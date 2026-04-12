/**
 * OpenPGx Drug Resolver — Smart drug name resolution.
 *
 * 6 layers of resolution:
 * 1. Brand → Generic (deterministic dictionary)
 * 2. Generic exact match
 * 3. Fuzzy brand match (bigram similarity)
 * 4. Fuzzy generic match
 * 5. Category keyword search (PT + EN)
 * 6. Semantic search (OpenAI text-embedding-3-small)
 * 7. Not found
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { DRUG_GENE_INDEX } from "./pgx-catalog.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

// === Brand → Generic mapping ===

export const BRAND_TO_GENERIC: Record<string, string> = {
  // GLP-1 / Weight loss
  ozempic: "semaglutide", wegovy: "semaglutide", rybelsus: "semaglutide",
  mounjaro: "tirzepatide", zepbound: "tirzepatide",
  saxenda: "liraglutide", victoza: "liraglutide",
  trulicity: "dulaglutide",
  // Antidepressants
  zoloft: "sertraline", prozac: "fluoxetine", lexapro: "escitalopram",
  celexa: "citalopram", paxil: "paroxetine", cymbalta: "duloxetine",
  effexor: "venlafaxine", wellbutrin: "bupropion",
  pondera: "paroxetine", exodus: "escitalopram", assert: "sertraline",
  brintellix: "vortioxetine", pristiq: "desvenlafaxine",
  // Anxiolytics
  xanax: "alprazolam", valium: "diazepam",
  rivotril: "clonazepam", klonopin: "clonazepam",
  ambien: "zolpidem", stilnox: "zolpidem",
  // Pain
  tylenol: "acetaminophen", advil: "ibuprofen", motrin: "ibuprofen",
  aleve: "naproxen", vicodin: "hydrocodone", oxycontin: "oxycodone",
  // Cardiovascular
  plavix: "clopidogrel", coumadin: "warfarin", marevan: "warfarin",
  lipitor: "atorvastatin", crestor: "rosuvastatin", zocor: "simvastatin",
  eliquis: "apixaban", xarelto: "rivaroxaban", pradaxa: "dabigatran",
  // PPIs
  nexium: "esomeprazole", prilosec: "omeprazole", losec: "omeprazole",
  prevacid: "lansoprazole",
  // Oncology
  xeloda: "capecitabine", imuran: "azathioprine", purinethol: "mercaptopurine",
  // Transplant
  prograf: "tacrolimus",
  // Cannabis
  epidiolex: "cannabidiol",
  // Wakefulness / Narcolepsy
  provigil: "modafinil", stavigile: "modafinil", alertec: "modafinil",
  nuvigil: "armodafinil",
  // ADHD
  ritalin: "methylphenidate", ritalina: "methylphenidate",
  concerta: "methylphenidate", venvanse: "lisdexamfetamine",
  vyvanse: "lisdexamfetamine", strattera: "atomoxetine",
  // Antipsychotics
  zyprexa: "olanzapine", seroquel: "quetiapine",
  risperdal: "risperidone", abilify: "aripiprazole",
};

const ALL_GENERICS = new Set(Object.values(BRAND_TO_GENERIC));

for (const drug of Object.keys(DRUG_GENE_INDEX)) {
  ALL_GENERICS.add(drug);
}

// === Category search ===

interface DrugCategory {
  keywords: string[];
  drugs: string[];
  description: string;
}

const DRUG_CATEGORIES: Record<string, DrugCategory> = {
  weight_loss: {
    keywords: ["weight", "obesity", "emagrecer", "peso", "emagrecimento", "diet", "fat", "glp-1", "glp1"],
    drugs: ["semaglutide", "tirzepatide", "liraglutide", "dulaglutide"],
    description: "GLP-1 receptor agonists for weight management",
  },
  diabetes: {
    keywords: ["diabetes", "blood sugar", "glucose", "insulin", "açúcar", "glicemia", "a1c", "diabético"],
    drugs: ["semaglutide", "tirzepatide", "liraglutide", "metformin"],
    description: "Diabetes medications",
  },
  depression: {
    keywords: ["depression", "depressão", "antidepressant", "antidepressivo", "ssri", "serotonin", "triste"],
    drugs: ["sertraline", "fluoxetine", "escitalopram", "citalopram", "paroxetine", "venlafaxine", "duloxetine", "bupropion"],
    description: "Antidepressants (SSRIs, SNRIs, others)",
  },
  anxiety: {
    keywords: ["anxiety", "ansiedade", "anxious", "nervoso", "panic", "pânico", "benzo"],
    drugs: ["alprazolam", "clonazepam", "diazepam", "sertraline", "escitalopram"],
    description: "Anxiolytics and medications used for anxiety",
  },
  pain: {
    keywords: ["pain", "dor", "headache", "cefaleia", "migraine", "enxaqueca", "opioid", "opioide", "analgésico"],
    drugs: ["codeine", "tramadol", "hydrocodone", "oxycodone", "ibuprofen", "naproxen"],
    description: "Pain medications (opioids, NSAIDs)",
  },
  cholesterol: {
    keywords: ["cholesterol", "colesterol", "statin", "estatina", "lipid", "ldl", "triglycerides"],
    drugs: ["simvastatin", "atorvastatin", "rosuvastatin", "fluvastatin", "pravastatin"],
    description: "Statins and lipid-lowering drugs",
  },
  blood_thinner: {
    keywords: ["blood thinner", "anticoagulant", "anticoagulante", "clot", "coágulo", "stroke", "avc", "trombose"],
    drugs: ["warfarin", "clopidogrel", "apixaban", "rivaroxaban"],
    description: "Anticoagulants and antiplatelets",
  },
  acid_reflux: {
    keywords: ["reflux", "refluxo", "heartburn", "azia", "stomach", "estômago", "gastritis", "gastrite", "ppi"],
    drugs: ["omeprazole", "esomeprazole", "lansoprazole", "pantoprazole"],
    description: "Proton pump inhibitors (PPIs)",
  },
  sleep: {
    keywords: ["sleep", "insomnia", "insônia", "dormir", "sono", "sleeping", "remédio pra dormir"],
    drugs: ["zolpidem", "melatonin", "trazodone"],
    description: "Sleep medications",
  },
  cancer: {
    keywords: ["cancer", "câncer", "chemo", "quimio", "oncology", "tumor"],
    drugs: ["capecitabine", "fluorouracil", "mercaptopurine", "tamoxifen"],
    description: "Chemotherapy and oncology drugs with PGx relevance",
  },
};

// === OpenAI Semantic Search (unified: drugs, risks, traits) ===

interface EmbeddingsFile {
  vectors: Record<string, number[]>;
  type_index: { drug: string[]; risk: string[]; trait: string[] };
}

let embeddingsData: EmbeddingsFile | null = null;
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

function loadEmbeddings(): EmbeddingsFile {
  if (embeddingsData) return embeddingsData;

  const embPath = join(DATA_DIR, "embeddings.json");
  if (!existsSync(embPath)) {
    embeddingsData = { vectors: {}, type_index: { drug: [], risk: [], trait: [] } };
    return embeddingsData;
  }

  embeddingsData = JSON.parse(readFileSync(embPath, "utf-8"));
  return embeddingsData!;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function embedQuery(query: string): Promise<number[] | null> {
  const client = getOpenAI();
  if (!client) return null;
  try {
    const resp = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    return resp.data[0].embedding;
  } catch {
    return null;
  }
}

/**
 * Semantic search across a specific type (drug, risk, trait) or all types.
 */
export async function semanticSearch(
  query: string,
  type: "drug" | "risk" | "trait" | "all" = "all",
  topK = 5,
  threshold = 0.40,
): Promise<Array<{ key: string; type: string; score: number }>> {
  const queryVec = await embedQuery(query);
  if (!queryVec) return [];

  const data = loadEmbeddings();
  if (Object.keys(data.vectors).length === 0) return [];

  const keysToSearch = type === "all"
    ? Object.keys(data.vectors)
    : (data.type_index[type] ?? []);

  const results: Array<{ key: string; type: string; score: number }> = [];
  for (const key of keysToSearch) {
    const vec = data.vectors[key];
    if (!vec) continue;
    const score = cosineSimilarity(queryVec, vec);
    if (score >= threshold) {
      const entryType = key.startsWith("risk:") ? "risk" : key.startsWith("trait:") ? "trait" : "drug";
      results.push({ key, type: entryType, score: Math.round(score * 10000) / 10000 });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

async function drugSemanticSearch(query: string, topK = 5, threshold = 0.40): Promise<Array<{ name: string; score: number }>> {
  const results = await semanticSearch(query, "drug", topK, threshold);
  return results.map(r => ({ name: r.key, score: r.score }));
}

// === Similarity ===

function bigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.slice(i, i + 2));
  if (bigramsA.size === 0 || bigramsB.size === 0) return a === b ? 1 : 0;

  let intersection = 0;
  for (const bg of bigramsA) if (bigramsB.has(bg)) intersection++;
  const union = new Set([...bigramsA, ...bigramsB]).size;
  return intersection / union;
}

// === Main resolver ===

export interface DrugResolution {
  resolved: string | null;
  type: "brand_match" | "generic_exact" | "fuzzy_match" | "category_match" | "semantic_match" | "semantic_suggestions" | "not_found";
  suggestions: string[];
  original: string;
  brand?: string;
  matchedBrand?: string;
  score?: number;
  category?: string;
  description?: string;
  scores?: Record<string, number>;
}

export async function resolveDrugName(query: string): Promise<DrugResolution> {
  const q = query.toLowerCase().trim();

  // 1. Brand → Generic
  if (q in BRAND_TO_GENERIC) {
    return { resolved: BRAND_TO_GENERIC[q], type: "brand_match", brand: q, suggestions: [], original: query };
  }

  // 2. Already a generic
  if (ALL_GENERICS.has(q)) {
    return { resolved: q, type: "generic_exact", suggestions: [], original: query };
  }

  // 3. Fuzzy brand match
  const closeBrands = Object.keys(BRAND_TO_GENERIC).filter(b => bigramSimilarity(q, b) > 0.55);
  if (closeBrands.length > 0) {
    const best = closeBrands.reduce((a, b) => bigramSimilarity(q, a) > bigramSimilarity(q, b) ? a : b);
    return {
      resolved: BRAND_TO_GENERIC[best], type: "fuzzy_match",
      matchedBrand: best, suggestions: closeBrands.map(b => BRAND_TO_GENERIC[b]), original: query,
    };
  }

  // 4. Fuzzy generic match
  const closeGenerics = [...ALL_GENERICS].filter(g => bigramSimilarity(q, g) > 0.55);
  if (closeGenerics.length > 0) {
    const best = closeGenerics.reduce((a, b) => bigramSimilarity(q, a) > bigramSimilarity(q, b) ? a : b);
    return { resolved: best, type: "fuzzy_match", suggestions: closeGenerics, original: query };
  }

  // 5. Category keyword search
  const matchingCats: Array<[number, string, DrugCategory]> = [];
  for (const [catName, catData] of Object.entries(DRUG_CATEGORIES)) {
    const score = catData.keywords.filter(kw => q.includes(kw)).length;
    if (score > 0) matchingCats.push([score, catName, catData]);
  }
  if (matchingCats.length > 0) {
    matchingCats.sort((a, b) => b[0] - a[0]);
    const best = matchingCats[0];
    return {
      resolved: null, type: "category_match",
      category: best[1], description: best[2].description,
      suggestions: best[2].drugs, original: query,
    };
  }

  // 6. OpenAI semantic search (drugs only)
  const semResults = await drugSemanticSearch(query);
  if (semResults.length > 0) {
    if (semResults[0].score > 0.50 && semResults.length === 1) {
      return {
        resolved: semResults[0].name, type: "semantic_match",
        score: semResults[0].score, suggestions: semResults.map(r => r.name), original: query,
      };
    }
    return {
      resolved: null, type: "semantic_suggestions",
      suggestions: semResults.map(r => r.name),
      scores: Object.fromEntries(semResults.map(r => [r.name, r.score])),
      original: query,
    };
  }

  // 7. Not found
  return { resolved: null, type: "not_found", suggestions: [], original: query };
}
