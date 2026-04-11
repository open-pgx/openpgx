/**
 * OpenPGx — Disease Risk Catalog
 *
 * Loads risk condition definitions from data/risks/*.json and provides
 * risk level assessment logic.
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { RiskDefinition, RiskJsonFile } from "./types.js";

// === Resolve data directory ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RISK_DATA_DIR = join(__dirname, "..", "data", "risks");

// === Load all risk definitions from JSON ===

function loadRiskCatalog(): RiskDefinition[] {
  const risks: RiskDefinition[] = [];
  let files: string[];

  try {
    files = readdirSync(RISK_DATA_DIR).filter(f => f.endsWith(".json"));
  } catch {
    console.error(`[OpenPGx] Warning: Risk data directory not found at ${RISK_DATA_DIR}`);
    return [];
  }

  for (const file of files) {
    try {
      const raw = readFileSync(join(RISK_DATA_DIR, file), "utf-8");
      const data: RiskJsonFile = JSON.parse(raw);
      risks.push({
        condition: data.condition,
        category: data.category,
        icd10: data.icd10,
        snps: data.snps,
        evidence_level: data.evidence_level as RiskDefinition["evidence_level"],
        gwas_catalog_id: data.gwas_catalog_id,
        general_population_risk: data.general_population_risk,
        recommendation_template: data.recommendation_template,
        studies: data.studies,
      });
    } catch (e) {
      console.error(`[OpenPGx] Error loading ${file}:`, e);
    }
  }

  return risks;
}

export const RISK_CATALOG: RiskDefinition[] = loadRiskCatalog();

// === Build risk rsID set ===

export const RISK_RSIDS = new Set<string>();
for (const risk of RISK_CATALOG) {
  for (const snp of risk.snps) {
    RISK_RSIDS.add(snp.rsid);
  }
}

// === Risk Assessment Logic ===

/**
 * Assess overall risk level based on risk alleles found.
 *
 * Uses a 1.5x multiplier for homozygous (not squaring) to avoid
 * overstating risk for common variants. Only maxSingleOr >= 5.0
 * triggers "high" (catches rare high-impact variants like BRCA, LRRK2).
 */
export function assessRiskLevel(
  riskDef: RiskDefinition,
  genotypes: Record<string, string>
): "reduced" | "typical" | "slightly_elevated" | "elevated" | "high" {
  let maxSingleOr = 1.0;  // highest per-allele OR among carried risk alleles
  let riskAlleleCount = 0;
  let combinedOr = 1.0;   // multiplicative across all SNPs

  for (const snpDef of riskDef.snps) {
    const geno = genotypes[snpDef.rsid];
    if (!geno) continue;
    const alleles = geno.split("");
    const riskCount = alleles.filter(a => a === snpDef.risk_allele).length;
    if (riskCount > 0) {
      riskAlleleCount += riskCount;
      // Per-allele OR — don't square for homozygous common variants (log-additive model overstates)
      // Use 1.5x multiplier for homozygous instead of squaring
      const effectiveOr = riskCount === 2 ? snpDef.odds_ratio * 1.5 : snpDef.odds_ratio;
      if (snpDef.odds_ratio > maxSingleOr) maxSingleOr = snpDef.odds_ratio;
      combinedOr *= effectiveOr;
    }
  }

  if (riskAlleleCount === 0) return "typical";
  // Use the single highest OR for rare high-impact variants (BRCA, LRRK2, Factor V)
  // Use combined OR for polygenic conditions
  const effectiveRisk = Math.max(maxSingleOr, combinedOr);
  if (maxSingleOr >= 5.0) return "high";           // rare high-impact variant (BRCA, HFE homozygous)
  if (effectiveRisk >= 3.0) return "elevated";      // strong combined risk
  if (effectiveRisk >= 1.8) return "slightly_elevated";
  if (riskAlleleCount > 0) return "slightly_elevated"; // at least one risk allele
  return "typical";
}
