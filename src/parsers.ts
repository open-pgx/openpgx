/**
 * OpenPGx Parsers — Read raw DNA data files and extract all relevant SNPs.
 *
 * Extracts SNPs for three modules:
 * 1. Pharmacogenes (PGx) — drug-gene interactions
 * 2. Risk SNPs — disease predisposition
 * 3. Trait SNPs — observable characteristics
 *
 * Supported formats:
 * - 23andMe (.txt, tab-separated)
 * - Genera (.csv)
 */

import { readFileSync } from "fs";
import {
  ALL_RELEVANT_RSIDS,
  RSID_TO_GENE,
  RISK_RSIDS,
  TRAIT_RSIDS,
  PHARMACOGENE_CATALOG,
  RISK_CATALOG,
  TRAIT_CATALOG,
  inferPhenotype,
  assessRiskLevel,
  type RiskDefinition,
  type TraitDefinition,
} from "./pharmacogenes.js";

// === Types ===

export interface Genotype {
  rsid: string;
  chromosome: string;
  position: string;
  genotype: string;
}

export interface Pharmacogene {
  gene: string;
  genotypes: Record<string, string>;
  diplotype: string | null;
  phenotype: string | null;
  activityScore: number | null;
}

export interface RiskResult {
  condition: string;
  category: string;
  icd10: string | null;
  overall_risk: "reduced" | "typical" | "slightly_elevated" | "elevated" | "high";
  risk_snps: Array<{
    rsid: string;
    gene_region: string;
    your_genotype: string;
    risk_allele: string;
    odds_ratio: number;
    population_frequency?: Record<string, number>;
    effect: string;
  }>;
  evidence: { level: string; gwas_catalog_id: string | null };
  lifetime_risk: { general_population: string; your_estimated: string; note: string };
  actionable: boolean;
  recommendation: string;
  studies: Array<{
    pmid: string | null;
    title: string;
    journal: string;
    year: number;
    cohort_size: number | null;
    url: string;
    finding: string;
  }>;
}

export interface TraitResult {
  trait: string;
  category: string;
  snps: Array<{
    rsid: string;
    gene: string;
    your_genotype: string;
    effect_allele: string;
    effect: string;
  }>;
  your_phenotype: string;
  description: string;
  evidence: { level: string };
  practical_advice: string;
  studies: Array<{
    pmid: string | null;
    title: string;
    journal: string;
    year: number;
    cohort_size: number | null;
    url: string;
    finding: string;
  }>;
}

export interface PatientProfile {
  rawDataSource: string;
  rawDataFormat: string;
  extractionDate: string;
  totalSnpsExtracted: number;
  pharmacogenes: Pharmacogene[];
  risks: RiskResult[];
  traits: TraitResult[];
  allGenotypes: Genotype[];
}

// === 23andMe Parser ===

function is23andMe(lines: string[]): boolean {
  for (const line of lines.slice(0, 20)) {
    if (line.includes("23andMe")) return true;
  }
  for (const line of lines) {
    if (line.startsWith("#")) continue;
    if (line.trim() === "") continue;
    const parts = line.split("\t");
    if (parts.length >= 4 && parts[0].startsWith("rs")) return true;
    break;
  }
  return false;
}

function parse23andMe(content: string): PatientProfile {
  const lines = content.split("\n");
  const relevantGenotypes: Genotype[] = [];
  let totalLines = 0;

  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") continue;
    totalLines++;

    const parts = line.split("\t");
    if (parts.length < 4) continue;

    const [rsid, chromosome, position, genotype] = parts.map(p => p.trim());
    if (ALL_RELEVANT_RSIDS.has(rsid)) {
      relevantGenotypes.push({ rsid, chromosome, position, genotype });
    }
  }

  return buildProfile(relevantGenotypes, "23andMe", `23andMe raw data (${totalLines} SNPs)`);
}

// === Genera Parser ===

function isGenera(lines: string[]): boolean {
  for (const line of lines.slice(0, 10)) {
    if (line.toLowerCase().includes("genera")) return true;
  }
  for (const line of lines) {
    if (line.startsWith("#")) continue;
    if (line.trim() === "") continue;
    const parts = line.split(",");
    if (parts.length >= 4 && parts[0].trim().startsWith("rs")) return true;
    break;
  }
  return false;
}

function parseGenera(content: string): PatientProfile {
  const lines = content.split("\n");
  const relevantGenotypes: Genotype[] = [];
  let totalLines = 0;

  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") continue;
    totalLines++;

    let parts = line.split(",");
    if (parts.length < 4) parts = line.split("\t");
    if (parts.length < 4) continue;

    const rsid = parts[0].trim().replace(/"/g, "");
    const chromosome = parts[1].trim().replace(/"/g, "");
    const position = parts[2].trim().replace(/"/g, "");
    const genotype = parts[3].trim().replace(/"/g, "");

    if (ALL_RELEVANT_RSIDS.has(rsid)) {
      relevantGenotypes.push({ rsid, chromosome, position, genotype });
    }
  }

  return buildProfile(relevantGenotypes, "Genera", `Genera raw data (${totalLines} SNPs)`);
}

// === Build full profile with PGx + Risk + Traits ===

function buildProfile(
  genotypes: Genotype[],
  source: string,
  format: string
): PatientProfile {
  // Build a flat rsid→genotype map
  const rsidMap: Record<string, string> = {};
  for (const g of genotypes) {
    rsidMap[g.rsid] = g.genotype;
  }

  // === PGx: Group genotypes by gene ===
  const geneGenotypes: Record<string, Record<string, string>> = {};
  for (const g of genotypes) {
    const gene = RSID_TO_GENE[g.rsid];
    if (!gene) continue;
    if (!geneGenotypes[gene]) geneGenotypes[gene] = {};
    geneGenotypes[gene][g.rsid] = g.genotype;
  }

  const pharmacogenes: Pharmacogene[] = [];
  for (const geneDef of PHARMACOGENE_CATALOG) {
    const genos = geneGenotypes[geneDef.gene];
    if (!genos || Object.keys(genos).length === 0) continue;
    const phenotype = inferPhenotype(geneDef.gene, genos);
    pharmacogenes.push({
      gene: geneDef.gene,
      genotypes: genos,
      diplotype: null,
      phenotype,
      activityScore: null,
    });
  }

  // === Risk: Evaluate each risk condition ===
  const risks: RiskResult[] = [];
  for (const riskDef of RISK_CATALOG) {
    const riskGenotypes: Record<string, string> = {};
    let hasData = false;
    for (const snpDef of riskDef.snps) {
      if (rsidMap[snpDef.rsid]) {
        riskGenotypes[snpDef.rsid] = rsidMap[snpDef.rsid];
        hasData = true;
      }
    }
    if (!hasData) continue;

    const overallRisk = assessRiskLevel(riskDef, riskGenotypes);

    // Build risk SNP results
    const riskSnps = riskDef.snps
      .filter(s => riskGenotypes[s.rsid])
      .map(s => {
        const geno = riskGenotypes[s.rsid];
        const alleles = geno.split("");
        const carries = alleles.filter(a => a === s.risk_allele).length;
        let effect = s.effect_template;
        if (carries === 0) effect += ` You do NOT carry the risk allele (${geno}).`;
        else if (carries === 1) effect += ` You carry ONE copy of the risk allele (${geno}).`;
        else effect += ` You carry TWO copies of the risk allele (${geno}).`;

        return {
          rsid: s.rsid,
          gene_region: s.gene_region,
          your_genotype: geno,
          risk_allele: s.risk_allele,
          odds_ratio: s.odds_ratio,
          population_frequency: s.population_frequency,
          effect,
        };
      });

    // Estimate risk based on alleles
    let estimatedRisk = "~" + riskDef.general_population_risk + " (no elevated risk detected)";
    if (overallRisk === "slightly_elevated") estimatedRisk = "Slightly above average";
    else if (overallRisk === "elevated") estimatedRisk = "Above average";
    else if (overallRisk === "high") estimatedRisk = "Significantly above average";

    risks.push({
      condition: riskDef.condition,
      category: riskDef.category,
      icd10: riskDef.icd10,
      overall_risk: overallRisk,
      risk_snps: riskSnps,
      evidence: {
        level: riskDef.evidence_level,
        gwas_catalog_id: riskDef.gwas_catalog_id,
      },
      lifetime_risk: {
        general_population: riskDef.general_population_risk,
        your_estimated: estimatedRisk,
        note: "Estimate based on common variants only. Does not account for family history, lifestyle, or rare variants.",
      },
      actionable: overallRisk !== "typical" && overallRisk !== "reduced",
      recommendation: riskDef.recommendation_template,
      studies: riskDef.studies,
    });
  }

  // === Traits: Evaluate each trait ===
  const traits: TraitResult[] = [];
  for (const traitDef of TRAIT_CATALOG) {
    const traitGenotypes: Record<string, string> = {};
    let hasData = false;
    for (const snpDef of traitDef.snps) {
      if (rsidMap[snpDef.rsid]) {
        traitGenotypes[snpDef.rsid] = rsidMap[snpDef.rsid];
        hasData = true;
      }
    }
    if (!hasData) continue;

    const { phenotype, description, advice } = traitDef.phenotype_fn(traitGenotypes);

    const traitSnps = traitDef.snps
      .filter(s => traitGenotypes[s.rsid])
      .map(s => ({
        rsid: s.rsid,
        gene: s.gene,
        your_genotype: traitGenotypes[s.rsid],
        effect_allele: s.effect_allele,
        effect: s.effect_template,
      }));

    traits.push({
      trait: traitDef.trait,
      category: traitDef.category,
      snps: traitSnps,
      your_phenotype: phenotype,
      description,
      evidence: { level: traitDef.evidence_level },
      practical_advice: advice,
      studies: traitDef.studies,
    });
  }

  return {
    rawDataSource: source,
    rawDataFormat: format,
    extractionDate: new Date().toISOString().split("T")[0],
    totalSnpsExtracted: genotypes.length,
    pharmacogenes,
    risks,
    traits,
    allGenotypes: genotypes,
  };
}

// === Public API ===

export function parseRawData(filePath: string): PatientProfile {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").slice(0, 30);

  if (is23andMe(lines)) return parse23andMe(content);
  if (isGenera(lines)) return parseGenera(content);

  throw new Error(
    `Unknown file format. Supported: 23andMe (.txt), Genera (.csv). ` +
    `Make sure you're uploading the raw data file, not a PDF report.`
  );
}

export function supportedFormats(): string[] {
  return ["23andMe (.txt)", "Genera (.csv)"];
}
