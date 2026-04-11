/**
 * OpenPGx — Pharmacogene (PGx) Catalog
 *
 * Single source of truth: study files in data/pgx/studies/*.json.
 * Gene definitions are auto-created from studies at load time.
 * No separate catalog files needed — one JSON per study is enough.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type {
  GeneDefinition,
  StudyJsonFile,
  StudyContribution,
  SnpInterpretation,
  StudyReference,
} from "./types.js";

import { homedir } from "os";

// === Resolve data directories ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STUDIES_DIR = join(__dirname, "..", "data", "pgx", "studies");
const CACHE_STUDIES_DIR = join(homedir(), ".openpgx", "cache", "studies");

// === Parse a single study JSON into StudyContribution ===

function parseStudyJson(data: StudyJsonFile): StudyContribution {
  const source: StudyReference = {
    pmid: data.source.pmid ?? null,
    doi: data.source.doi ?? null,
    source_type: data.source.source_type,
    title: data.source.title,
    journal: data.source.journal ?? "",
    year: data.source.year,
    cohort_size: data.source.cohort_size ?? null,
    url: data.source.url,
    finding: data.source.finding ?? "",
  };

  return {
    gene: data.gene,
    category: data.category,
    gene_description: data.gene_description,
    drugs: data.drugs,
    source,
    snps: data.snps.map(s => ({
      rsid: s.rsid,
      risk_allele: s.risk_allele,
      reference_allele: s.reference_allele,
      interpretations: s.interpretations as Record<string, SnpInterpretation>,
      population_frequency: s.population_frequency,
    })),
    evidence_level: data.evidence_level as StudyContribution["evidence_level"],
    contributor: data.contributor,
  };
}

// === Load studies from a directory ===

function loadStudiesFromDir(dir: string): StudyContribution[] {
  const studies: StudyContribution[] = [];
  if (!existsSync(dir)) return studies;

  let files: string[];
  try {
    files = readdirSync(dir).filter(f => f.endsWith(".json"));
  } catch {
    return studies;
  }

  for (const file of files) {
    try {
      const raw = readFileSync(join(dir, file), "utf-8");
      studies.push(parseStudyJson(JSON.parse(raw)));
    } catch (e) {
      console.error(`[OpenPGx] Error loading study ${file}:`, e);
    }
  }

  return studies;
}

function loadAllStudies(): StudyContribution[] {
  const repoStudies = loadStudiesFromDir(STUDIES_DIR);
  const cachedStudies = loadStudiesFromDir(CACHE_STUDIES_DIR);
  return [...repoStudies, ...cachedStudies];
}

// === Mutable indexes ===

export const STUDY_CATALOG: StudyContribution[] = loadAllStudies();
export const PHARMACOGENE_CATALOG: GeneDefinition[] = [];
export const RSID_TO_GENE: Record<string, string> = {};

type InterpretationIndex = Record<string, Record<string, Record<string, SnpInterpretation>>>;
export const INTERPRETATION_INDEX: InterpretationIndex = {};

export interface DrugGeneLink {
  gene: string;
  study: StudyContribution;
  snps: StudyContribution["snps"];
}
export const DRUG_GENE_INDEX: Record<string, DrugGeneLink[]> = {};

// === Index a single study into all indexes ===

function indexStudy(study: StudyContribution): void {
  // Gene catalog
  let geneDef = PHARMACOGENE_CATALOG.find(g => g.gene === study.gene);
  if (!geneDef) {
    const rsids = study.snps.map(s => s.rsid);
    geneDef = {
      gene: study.gene,
      category: study.category ?? "uncategorized",
      description: study.gene_description ?? study.gene,
      rsids,
      key_snp: rsids[0],
      studies: [study.source],
    };
    PHARMACOGENE_CATALOG.push(geneDef);
  } else {
    if (study.category && geneDef.category === "uncategorized") {
      geneDef.category = study.category;
    }
    if (study.gene_description && geneDef.description === geneDef.gene) {
      geneDef.description = study.gene_description;
    }
    for (const snp of study.snps) {
      if (!geneDef.rsids.includes(snp.rsid)) geneDef.rsids.push(snp.rsid);
    }
    if (!geneDef.studies) geneDef.studies = [];
    geneDef.studies.push(study.source);
  }

  // RSID → gene map
  for (const snp of study.snps) {
    RSID_TO_GENE[snp.rsid] = study.gene;
  }

  // Interpretation index
  if (!INTERPRETATION_INDEX[study.gene]) INTERPRETATION_INDEX[study.gene] = {};
  for (const snp of study.snps) {
    if (!INTERPRETATION_INDEX[study.gene][snp.rsid]) INTERPRETATION_INDEX[study.gene][snp.rsid] = {};
    for (const [genotype, interp] of Object.entries(snp.interpretations)) {
      if (!INTERPRETATION_INDEX[study.gene][snp.rsid][genotype]) {
        INTERPRETATION_INDEX[study.gene][snp.rsid][genotype] = interp;
      }
      const reversed = genotype.split("").reverse().join("");
      if (reversed !== genotype && !INTERPRETATION_INDEX[study.gene][snp.rsid][reversed]) {
        INTERPRETATION_INDEX[study.gene][snp.rsid][reversed] = interp;
      }
    }
  }

  // Drug index
  if (study.drugs) {
    for (const drug of study.drugs) {
      const key = drug.toLowerCase();
      if (!DRUG_GENE_INDEX[key]) DRUG_GENE_INDEX[key] = [];
      DRUG_GENE_INDEX[key].push({ gene: study.gene, study, snps: study.snps });
    }
  }
}

// === Build all indexes from loaded studies ===

for (const study of STUDY_CATALOG) {
  indexStudy(study);
}

// === Hot-reload: ingest a new study at runtime ===

export function ingestStudy(study: StudyContribution): void {
  STUDY_CATALOG.push(study);
  indexStudy(study);
}

// === Lookup helpers ===

export function getGeneDefinition(gene: string): GeneDefinition | undefined {
  return PHARMACOGENE_CATALOG.find(g => g.gene === gene);
}

export function getDrugGeneLinks(genericDrug: string): DrugGeneLink[] {
  return DRUG_GENE_INDEX[genericDrug.toLowerCase()] ?? [];
}

export function getDrugsForGene(gene: string): string[] {
  const drugs = new Set<string>();
  for (const study of STUDY_CATALOG) {
    if (study.gene === gene && study.drugs) {
      for (const d of study.drugs) drugs.add(d);
    }
  }
  return [...drugs];
}

// === Phenotype Inference (data-driven from studies) ===

export function inferPhenotype(gene: string, genotypes: Record<string, string>): string | null {
  const geneInterps = INTERPRETATION_INDEX[gene];
  if (!geneInterps) return null;

  const geneDef = getGeneDefinition(gene);
  if (!geneDef) return null;

  const keySnp = geneDef.key_snp;
  if (keySnp && genotypes[keySnp] && geneInterps[keySnp]) {
    const interp = geneInterps[keySnp][genotypes[keySnp]];
    if (interp) return interp.phenotype;
  }

  for (const [rsid, geno] of Object.entries(genotypes)) {
    if (geneInterps[rsid]) {
      const interp = geneInterps[rsid][geno];
      if (interp) return interp.phenotype;
    }
  }

  return null;
}

export function getInterpretation(
  gene: string, rsid: string, genotype: string
): SnpInterpretation | null {
  return INTERPRETATION_INDEX[gene]?.[rsid]?.[genotype] ?? null;
}

export function getAllInterpretations(
  gene: string, genotypes: Record<string, string>
): Array<{ rsid: string; genotype: string; interpretation: SnpInterpretation }> {
  const results: Array<{ rsid: string; genotype: string; interpretation: SnpInterpretation }> = [];
  const geneInterps = INTERPRETATION_INDEX[gene];
  if (!geneInterps) return results;

  for (const [rsid, geno] of Object.entries(genotypes)) {
    if (geneInterps[rsid]) {
      const interp = geneInterps[rsid][geno];
      if (interp) results.push({ rsid, genotype: geno, interpretation: interp });
    }
  }

  return results;
}
