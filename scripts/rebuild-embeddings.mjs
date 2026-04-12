#!/usr/bin/env node
/**
 * Rebuild OpenAI embeddings for semantic search across drugs, risks, and traits.
 *
 * Generates: data/embeddings.json
 *
 * Requires: OPENAI_API_KEY in .env or environment
 *
 * Usage:  npm run rebuild-embeddings
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { BRAND_TO_GENERIC } from "../dist/drug-resolver.js";
import { DRUG_GENE_INDEX } from "../dist/pgx-catalog.js";
import { RISK_CATALOG } from "../dist/risk-catalog.js";
import { TRAIT_CATALOG } from "../dist/trait-catalog.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const ENV_PATH = join(__dirname, "..", ".env");

if (existsSync(ENV_PATH)) {
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const MODEL = "text-embedding-3-small";
const BATCH_SIZE = 200;

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY not found.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === Collect entries: { key, text, type } ===

const entries = [];

// Drugs: brand names + generic names + study drugs
const drugNames = new Set();
for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
  drugNames.add(brand);
  drugNames.add(generic);
}
for (const drug of Object.keys(DRUG_GENE_INDEX)) {
  drugNames.add(drug);
}
for (const name of [...drugNames].sort()) {
  entries.push({ key: name, text: name.replace(/_/g, " "), type: "drug" });
}

// Risks: condition names + category aliases
for (const risk of RISK_CATALOG) {
  entries.push({ key: `risk:${risk.condition}`, text: risk.condition, type: "risk" });
  entries.push({ key: `risk:${risk.condition}:cat`, text: `${risk.condition} ${risk.category}`, type: "risk" });
}

// Traits: trait names + category aliases
for (const trait of TRAIT_CATALOG) {
  entries.push({ key: `trait:${trait.trait}`, text: trait.trait, type: "trait" });
  entries.push({ key: `trait:${trait.trait}:cat`, text: `${trait.trait} ${trait.category}`, type: "trait" });
}

console.log(`Collected: ${drugNames.size} drugs, ${RISK_CATALOG.length} risks, ${TRAIT_CATALOG.length} traits`);
console.log(`Total entries to embed: ${entries.length}`);
console.log(`Model: ${MODEL}`);

// === Generate embeddings in batches ===

const vectors = {};
let totalTokens = 0;
const texts = entries.map(e => e.text);

for (let i = 0; i < texts.length; i += BATCH_SIZE) {
  const batch = texts.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(texts.length / BATCH_SIZE);
  console.log(`Embedding batch ${batchNum}/${totalBatches} (${batch.length} entries)...`);

  const resp = await openai.embeddings.create({ model: MODEL, input: batch });
  totalTokens += resp.usage?.total_tokens ?? 0;

  for (let j = 0; j < resp.data.length; j++) {
    vectors[entries[i + j].key] = resp.data[j].embedding;
  }
}

const dimensions = Object.values(vectors)[0]?.length ?? 0;

// === Build type index for fast lookup ===

const typeIndex = { drug: [], risk: [], trait: [] };
for (const entry of entries) {
  typeIndex[entry.type].push(entry.key);
}

// === Truncate to 4 decimal places (8.6MB → 3.3MB, zero ranking impact) ===

for (const key of Object.keys(vectors)) {
  vectors[key] = vectors[key].map(v => Math.round(v * 10000) / 10000);
}

// === Write output ===

writeFileSync(join(DATA_DIR, "embeddings.json"), JSON.stringify({
  model: MODEL,
  dimensions,
  entry_count: entries.length,
  tokens_used: totalTokens,
  generated_at: new Date().toISOString(),
  type_index: typeIndex,
  vectors,
}));

console.log(`\nWritten: data/embeddings.json`);
console.log(`  ${entries.length} entries, ${dimensions} dimensions`);
console.log(`  Tokens used: ${totalTokens}`);
console.log(`  Cost: ~$${(totalTokens * 0.00002 / 1000).toFixed(4)}`);
console.log("Done.");
process.exit(0);
