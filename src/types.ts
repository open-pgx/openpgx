/**
 * OpenPGx Shared Types
 *
 * All interfaces used across PGx, Risk, and Trait modules.
 */

// === Study Reference (shared across all modules) ===

export interface StudyReference {
  pmid: string | null;
  doi?: string | null;
  source_type?: string;
  title: string;
  journal: string;
  year: number;
  cohort_size: number | null;
  url: string;
  finding: string;
}

// === PGx Gene Definitions ===

export interface GeneDefinition {
  gene: string;
  category: string;
  description: string;
  rsids: string[];
  key_snp: string;
  studies?: StudyReference[];
}

// === Study Contribution (from data/pgx/studies/*.json) ===

export interface SnpInterpretation {
  phenotype: string;
  effect: string;
  recommendation?: string;
  severity?: "info" | "mild" | "moderate" | "severe" | "life_threatening";
  odds_ratio?: number | null;
}

export interface StudySnp {
  rsid: string;
  risk_allele?: string;
  reference_allele?: string;
  interpretations: Record<string, SnpInterpretation>;
  population_frequency?: Record<string, number>;
}

export interface StudyContribution {
  gene: string;
  category?: string;
  gene_description?: string;
  drugs?: string[];
  source: StudyReference;
  snps: StudySnp[];
  evidence_level?: "established" | "moderate" | "emerging" | "preliminary";
  contributor?: { name?: string; github?: string; orcid?: string };
}

// === Disease Risk Definitions ===

export interface RiskSnpDef {
  rsid: string;
  gene_region: string;
  risk_allele: string;
  odds_ratio: number;
  population_frequency?: Record<string, number>;
  effect_template: string;
}

export interface RiskDefinition {
  condition: string;
  category: string;
  icd10: string | null;
  snps: RiskSnpDef[];
  evidence_level: "established" | "moderate" | "emerging" | "preliminary";
  gwas_catalog_id: string | null;
  general_population_risk: string;
  recommendation_template: string;
  studies: StudyReference[];
}

// === Trait Definitions ===

export interface TraitSnpDef {
  rsid: string;
  gene: string;
  effect_allele: string;
  effect_template: string;
}

export interface TraitPhenotypeResult {
  phenotype: string;
  description: string;
  advice: string;
}

export type TraitPhenotypeFn = (genotypes: Record<string, string>) => TraitPhenotypeResult;

export interface TraitDefinition {
  trait: string;
  category: string;
  snps: TraitSnpDef[];
  phenotype_fn: TraitPhenotypeFn;
  evidence_level: "established" | "moderate" | "emerging";
  studies: StudyReference[];
}

// === JSON file shapes (what the JSON catalog files contain) ===

export interface PgxJsonFile {
  gene: string;
  category: string;
  description: string;
  rsids: string[];
  key_snp: string;
  studies: StudyReference[];
}

export interface StudyJsonFile {
  gene: string;
  category?: string;
  gene_description?: string;
  drugs?: string[];
  source: {
    pmid?: string | null;
    doi?: string | null;
    source_type?: string;
    title: string;
    journal?: string;
    year: number;
    cohort_size?: number | null;
    url: string;
    finding?: string;
  };
  snps: Array<{
    rsid: string;
    risk_allele?: string;
    reference_allele?: string;
    interpretations: Record<string, {
      phenotype: string;
      effect: string;
      recommendation?: string;
      severity?: string;
      odds_ratio?: number | null;
    }>;
    population_frequency?: Record<string, number>;
  }>;
  evidence_level?: string;
  contributor?: { name?: string; github?: string; orcid?: string };
}

export interface RiskJsonFile {
  condition: string;
  category: string;
  icd10: string | null;
  snps: RiskSnpDef[];
  evidence_level: string;
  gwas_catalog_id: string | null;
  general_population_risk: string;
  recommendation_template: string;
  studies: StudyReference[];
}

export interface TraitJsonFile {
  trait: string;
  category: string;
  snps: TraitSnpDef[];
  evidence_level: string;
  studies: StudyReference[];
}
