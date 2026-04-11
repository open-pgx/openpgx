#!/usr/bin/env node
/**
 * Rebuild drug embeddings using OpenAI text-embedding-3-small.
 *
 * Collects all drug names from brand→generic mapping and study-based drug index,
 * generates embeddings via OpenAI API, and saves to data/drugs_embeddings.json.
 *
 * Requires: OPENAI_API_KEY in .env or environment
 *
 * Usage:  npm run rebuild-embeddings
 *    or:  OPENAI_API_KEY=sk-... node scripts/rebuild-embeddings.mjs
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { BRAND_TO_GENERIC } from "../dist/drug-resolver.js";
import { DRUG_GENE_INDEX } from "../dist/pgx-catalog.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const ENV_PATH = join(__dirname, "..", ".env");

// Load .env manually (no dotenv dependency)
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
const BATCH_SIZE = 100;

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY not found. Set it in .env or environment.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === Collect all drug names ===

const allDrugNames = new Set();

for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
  allDrugNames.add(brand);
  allDrugNames.add(generic);
}

for (const drug of Object.keys(DRUG_GENE_INDEX)) {
  allDrugNames.add(drug);
}

const drugList = [...allDrugNames].sort();
console.log(`Collected ${drugList.length} drug names`);
console.log(`Model: ${MODEL}`);

// === Generate embeddings in batches ===

const drugVectors = {};
let totalTokens = 0;

for (let i = 0; i < drugList.length; i += BATCH_SIZE) {
  const batch = drugList.slice(i, i + BATCH_SIZE);
  console.log(`Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(drugList.length / BATCH_SIZE)} (${batch.length} drugs)...`);

  const resp = await openai.embeddings.create({
    model: MODEL,
    input: batch,
  });

  totalTokens += resp.usage?.total_tokens ?? 0;

  for (let j = 0; j < resp.data.length; j++) {
    drugVectors[batch[j]] = resp.data[j].embedding;
  }
}

const dimensions = Object.values(drugVectors)[0]?.length ?? 0;

// === Write output ===

const output = {
  model: MODEL,
  dimensions,
  drug_count: drugList.length,
  tokens_used: totalTokens,
  generated_at: new Date().toISOString(),
  drugs: drugVectors,
};

writeFileSync(join(DATA_DIR, "drugs_embeddings.json"), JSON.stringify(output));

console.log(`\nWritten: data/drugs_embeddings.json`);
console.log(`  ${drugList.length} drugs, ${dimensions} dimensions`);
console.log(`  Tokens used: ${totalTokens}`);
console.log(`  Cost: ~$${(totalTokens * 0.00002 / 1000).toFixed(4)}`);
console.log("Done.");
process.exit(0);
