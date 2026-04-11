/**
 * OpenPGx Pharmacogene, Risk SNP, and Trait SNP Catalog
 *
 * BARREL MODULE — re-exports from modular catalog files.
 *
 * This file maintains backward compatibility. All consumers
 * (parsers.ts, index.ts, etc.) can continue importing from
 * "./pharmacogenes.js" without changes.
 *
 * Architecture:
 *   types.ts         → shared interfaces
 *   pgx-catalog.ts   → PGx gene definitions (loaded from data/pgx/*.json)
 *   risk-catalog.ts  → Risk conditions (loaded from data/risks/*.json)
 *   trait-catalog.ts  → Traits (loaded from data/traits/*.json + TS phenotype functions)
 *   pharmacogenes.ts → THIS FILE (barrel re-exports)
 */

// === Re-export types ===
export type {
  GeneDefinition,
  RiskSnpDef,
  RiskDefinition,
  TraitSnpDef,
  TraitDefinition,
  TraitPhenotypeResult,
  TraitPhenotypeFn,
  StudyReference,
  StudyContribution,
  SnpInterpretation,
  StudySnp,
} from "./types.js";

// === Re-export PGx catalog ===
export {
  PHARMACOGENE_CATALOG,
  STUDY_CATALOG,
  RSID_TO_GENE,
  INTERPRETATION_INDEX,
  DRUG_GENE_INDEX,
  getGeneDefinition,
  inferPhenotype,
  getInterpretation,
  getAllInterpretations,
  getDrugGeneLinks,
  getDrugsForGene,
  ingestStudy,
} from "./pgx-catalog.js";

// === Re-export Risk catalog ===
export {
  RISK_CATALOG,
  RISK_RSIDS,
  assessRiskLevel,
} from "./risk-catalog.js";

// === Re-export Trait catalog ===
export {
  TRAIT_CATALOG,
  TRAIT_RSIDS,
} from "./trait-catalog.js";

// === Derived: ALL_RELEVANT_RSIDS (union of all modules) ===

import { PHARMACOGENE_CATALOG, RSID_TO_GENE, STUDY_CATALOG } from "./pgx-catalog.js";
import { RISK_CATALOG, RISK_RSIDS } from "./risk-catalog.js";
import { TRAIT_CATALOG, TRAIT_RSIDS } from "./trait-catalog.js";

export const ALL_RELEVANT_RSIDS = new Set<string>();

// PGx rsIDs
for (const gene of PHARMACOGENE_CATALOG) {
  for (const rsid of gene.rsids) {
    ALL_RELEVANT_RSIDS.add(rsid);
  }
}

// Risk rsIDs
for (const rsid of RISK_RSIDS) {
  ALL_RELEVANT_RSIDS.add(rsid);
}

// Trait rsIDs
for (const rsid of TRAIT_RSIDS) {
  ALL_RELEVANT_RSIDS.add(rsid);
}
