# OpenPGx — The Open Standard for AI-Readable Pharmacogenomics

**OpenPGx is an open, AI-readable standard for pharmacogenomic data.** It defines how genetic variants, drug responses, disease risks, and traits should be structured so that any AI system can understand and reason about them.

The standard is delivered today through an **MCP Server** — plug it into Claude, Cursor, or any MCP-compatible AI and start asking questions about your DNA.

```
"Can I take Ozempic?"       → Checks GLP1R variants against your genotype
"How about Vyvanse?"        → Cross-references CYP2D6 + COMT studies
"What's my Alzheimer risk?" → 19 disease conditions analyzed with odds ratios
```

**Privacy-first:** your data never leaves your computer. No cloud, no account, no tracking.

---

## Why OpenPGx?

Pharmacogenomic data is trapped in formats that AI can't use. FHIR is verbose and hospital-centric. PharmCAT is great but not designed for AI consumption. Research papers are unstructured text.

OpenPGx is different:

- **AI-readable** — structured JSON that any LLM can parse and reason about
- **Study-driven** — every interpretation traces back to a published study with PMID/DOI
- **Open source** — add a study by dropping a JSON file and opening a PR
- **FHIR-compatible** — not a replacement, but an intelligence layer that exports to FHIR resources

### The OpenPGx Study Format

One JSON file = one gene-drug study. This is the atomic unit of pharmacogenomic knowledge in OpenPGx:

```json
{
  "gene": "ALDH2",
  "category": "drug_metabolism",
  "gene_description": "Alcohol metabolism, nitroglycerin bioactivation",
  "drugs": ["nitroglycerin", "ethanol"],
  "source": {
    "pmid": "16395407",
    "doi": "10.1172/JCI26564",
    "source_type": "pubmed",
    "title": "ALDH2 Glu504Lys polymorphism and nitroglycerin efficacy",
    "journal": "Journal of Clinical Investigation",
    "year": 2006,
    "cohort_size": 986,
    "url": "https://pubmed.ncbi.nlm.nih.gov/16395407/",
    "finding": "ALDH2*2 carriers show reduced nitroglycerin bioactivation."
  },
  "snps": [
    {
      "rsid": "rs671",
      "risk_allele": "A",
      "reference_allele": "G",
      "interpretations": {
        "AA": { "phenotype": "ALDH2 Deficient", "effect": "Nitroglycerin ineffective", "severity": "severe" },
        "AG": { "phenotype": "Reduced Activity", "effect": "33-40% less efficacy", "severity": "moderate" },
        "GG": { "phenotype": "Normal", "effect": "Standard response", "severity": "info" }
      }
    }
  ],
  "evidence_level": "established"
}
```

Want to contribute a new drug-gene study? Create a file like this in `data/pgx/studies/` and open a PR. No code changes needed.

---

## Install in 30 seconds

### Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openpgx": {
      "command": "npx",
      "args": ["-y", "openpgx"]
    }
  }
}
```

Restart Claude Desktop. Done.

### Claude Code (CLI)

```bash
claude mcp add openpgx -- npx -y openpgx
```

### Cursor

Open Settings > MCP > Add new MCP Server:

```json
{
  "mcpServers": {
    "openpgx": {
      "command": "npx",
      "args": ["-y", "openpgx"]
    }
  }
}
```

### Windsurf / Cline / Any MCP client

Same configuration. OpenPGx uses stdio transport — any MCP-compatible client works:

```bash
npx openpgx
```

### Remote server (no install)

Don't want to install anything? Use the hosted server directly:

```json
{
  "mcpServers": {
    "openpgx": {
      "type": "streamable-http",
      "url": "https://mcp.openpgx.ai/mcp"
    }
  }
}
```

This connects to our remote MCP server via Streamable HTTP — same 9 tools, zero local setup. Your genome is parsed server-side and stored temporarily in memory (30-minute session TTL).

> **Privacy note:** For maximum privacy, prefer the `npx` install — everything stays on your machine. The remote server processes your data but does not store it permanently.

---

## What can you ask?

### Medications (Pharmacogenomics)

```
"Upload my genome"                    → parse your raw DNA file
"Can I take Ozempic?"                 → check semaglutide + GLP1R
"What about Venvanse?"                → brand names work (60+ brands mapped)
"Is modafinil right for me?"          → checks COMT + CYP2C19 interactions
"Compare sertraline vs escitalopram"  → head-to-head comparison
"Weight loss medications"             → search by category
"antidepressivo"                      → Portuguese works too
"ozmpic"                              → typos are auto-corrected
```

### Disease Risks

```
"What's my cancer risk?"              → check specific conditions
"Full risk report"                    → all 19 conditions analyzed
"Do I have the Alzheimer gene?"       → APOE status
"Am I at risk for blood clots?"       → Factor V Leiden check
```

### Traits

```
"Trait report"                        → all 25+ traits
"Am I lactose intolerant?"            → lactose persistence check
"Am I a morning person?"              → chronotype analysis
```

### Supplements

```
"Supplement protocol"                 → MTHFR, COMT, VDR, BCMO1, FUT2, CBS
"Should I take methylfolate?"         → based on your MTHFR status
```

---

## What's in the knowledge base

**67 studies · 63 genes · 127 drugs · 19 disease risks · 31 traits** — all backed by published research with PMID/DOI.

### 63 Genes with Study Data

Every gene is backed by at least one published study with interpretations per genotype:

| Category | Genes |
|----------|-------|
| Drug Metabolism | CYP2D6, CYP2C19, CYP2C9, CYP2B6, CYP3A5, CYP1A2, ALDH2, DPYD, TPMT, NUDT15, GSTP1 |
| Drug Targets | VKORC1, DRD2, HTR2C, OPRM1, DPYD, NUDT15, C11ORF65, MTNR1B, GRK4, CLCNKA, F2, F5 |
| Drug Transport | SLCO1B1, ABCB1, ABCG2 |
| Immune / HLA | HLA-B, HLA-A |
| GLP-1 / Incretin | GLP1R, GIPR |
| Methylation & Vitamins | MTHFR, COMT, VDR, BCMO1, FUT2, CBS, DHCR7, SLC23A1 |
| Lipid Metabolism | PNPLA3, TM6SF2, APOE, APOA5, APOB, LDLR, LIPC, LPL, SORT1, PPARG |
| Energy Balance / Obesity | FTO, MC4R, GHSR, CLOCK, SIRT1, BDNF, PCSK1, FABP2, LYPLAL1 |
| Glucose / Insulin | GCKR, SLC2A2, PPM1K, MTNR1B, IL6 |
| Circadian Rhythm | PER2, CRY2, NR1D1 |
| Nutrient Response | FADS1, FABP2, IL6, GRK4, CLCNKA |

### 127 Medications & Compounds

<details>
<summary>Full list of supported drugs (click to expand)</summary>

| Therapeutic Area | Medications |
|-----------------|-------------|
| **Cardiology & Anticoagulation** | warfarin, clopidogrel, rivaroxaban, apixaban, dabigatran, enoxaparin, heparin, nitroglycerin, isosorbide dinitrate, digoxin, amlodipine, losartan, hydrochlorothiazide, chlorthalidone, furosemide |
| **Statins & Lipid-Lowering** | simvastatin, atorvastatin, rosuvastatin, pravastatin, ezetimibe, fenofibrate, gemfibrozil, niacin, evolocumab, alirocumab, mipomersen |
| **Psychiatry & Neurology** | clozapine, olanzapine, risperidone, haloperidol, aripiprazole, quetiapine, fluoxetine, paroxetine, escitalopram, citalopram, venlafaxine, bupropion, carbamazepine, oxcarbazepine, eslicarbazepine, phenytoin, donepezil, memantine, lecanemab |
| **ADHD & Wakefulness** | modafinil, armodafinil, methylphenidate, lisdexamfetamine, amphetamine, atomoxetine, caffeine |
| **Pain & Opioids** | codeine, tramadol, fentanyl, morphine, methadone |
| **Oncology** | capecitabine, fluorouracil, cisplatin, carboplatin, oxaliplatin, paclitaxel, topotecan, methotrexate, tamoxifen |
| **Immunosuppressants** | tacrolimus, azathioprine, mercaptopurine, thioguanine, sulfasalazine |
| **Metabolic & GLP-1** | semaglutide, liraglutide, tirzepatide, dulaglutide, setmelanotide, metformin, pioglitazone, rosiglitazone, insulin, orlistat, empagliflozin, dapagliflozin |
| **Infectious Disease** | abacavir, efavirenz |
| **Supplements & Vitamins** | omega-3/fish oil/EPA/DHA, vitamin D (cholecalciferol, ergocalciferol, calcitriol), vitamin C (ascorbic acid), folic acid, methylfolate, methylcobalamin, beta-carotene, retinol, resveratrol, nicotinamide riboside, NMN, melatonin, pyridoxine |
| **Other** | allopurinol, febuxostat, theophylline, tizanidine, cannabidiol, ethanol, disulfiram, celecoxib, ibuprofen, naproxen |

</details>

### 19 Disease Risk Conditions

| Category | Conditions |
|----------|-----------|
| Oncology | Prostate Cancer, Breast Cancer (BRCA), Colorectal Cancer, Melanoma |
| Cardiovascular | Coronary Artery Disease, Atrial Fibrillation |
| Neurological | Alzheimer's Disease, Parkinson's Disease |
| Metabolic | Type 2 Diabetes, Hereditary Hemochromatosis, Gout |
| Autoimmune | Celiac Disease, Psoriasis, Rheumatoid Arthritis, Lupus (SLE) |
| Hematological | Venous Thromboembolism (Factor V Leiden) |
| Musculoskeletal | Osteoporosis |
| Respiratory | Asthma |
| Ophthalmological | Age-Related Macular Degeneration |

### 31 Traits

Caffeine metabolism, alcohol flush, lactose tolerance, muscle composition, chronotype, eye color, and more.

### Clinical Conditions Covered by Gene Studies

Beyond disease risk SNPs, the gene studies provide pharmacogenomic guidance across these clinical areas:

| Area | What OpenPGx covers |
|------|-------------------|
| **Blood Clotting** | Factor V Leiden (F5), Prothrombin mutation (F2), warfarin sensitivity (VKORC1, CYP2C9) |
| **Drug Hypersensitivity** | HLA-B*57:01 → abacavir, HLA-A*31:01 → carbamazepine DRESS, HLA-B*15:02 → SJS/TEN |
| **Statin Myopathy** | SLCO1B1 poor transport → simvastatin muscle toxicity |
| **Chemotherapy Toxicity** | DPYD deficiency → fluorouracil/capecitabine, TPMT/NUDT15 → thiopurines, GSTP1 → platinum agents |
| **Opioid Response** | CYP2D6 poor/ultrarapid → codeine, tramadol, fentanyl dosing |
| **Antipsychotic Side Effects** | HTR2C → weight gain risk, DRD2 → efficacy, CYP2D6 → metabolism |
| **Obesity & Weight Loss** | FTO, MC4R, BDNF, PCSK1, GHSR, CLOCK, SIRT1, LYPLAL1 — 9 genes affecting appetite, metabolism, fat distribution |
| **Cardiovascular Lipids** | APOE, APOA5, APOB, LDLR, LIPC, LPL, SORT1, PNPLA3, TM6SF2 — LDL, HDL, triglycerides, fatty liver |
| **Diabetes & Glucose** | GCKR, SLC2A2, MTNR1B, PPM1K, PPARG, IL6 — insulin secretion, glucose sensing, BCAA metabolism |
| **Salt Sensitivity & Hypertension** | GRK4, CLCNKA — sodium handling, diuretic response |
| **Circadian & Sleep** | PER2, CRY2, NR1D1, CLOCK — chronotype, shift work risk, melatonin response |
| **Vitamin Metabolism** | MTHFR → folate, DHCR7 → vitamin D synthesis, BCMO1 → beta-carotene, VDR → vitamin D receptor, SLC23A1 → vitamin C, FUT2 → B12 |
| **Omega-3 & Fat Absorption** | FADS1 → DHA/EPA conversion, FABP2 → dietary fat absorption |
| **GLP-1 Drug Response** | GLP1R, GIPR → semaglutide/tirzepatide efficacy prediction |

### 9 MCP Tools

| Tool | Description |
|------|-------------|
| `upload_genome` | Parse raw DNA data (23andMe, Genera) |
| `check_medication` | Smart drug lookup — brand names, generics, typos, categories |
| `full_pgx_report` | Complete pharmacogenomic report |
| `supplement_protocol` | Supplement optimization based on gene variants |
| `compare_medications` | Head-to-head drug comparison |
| `check_risk` | Check genetic risk for a specific disease |
| `full_risk_report` | Comprehensive disease risk report |
| `trait_report` | All genetic traits analysis |
| `full_report` | Everything combined: medications + risks + traits |

---

## Contributing studies

OpenPGx is designed for open source contribution. Adding a new drug-gene study requires **zero code changes** — just a JSON file.

### How to contribute

1. Find a pharmacogenomic study (PubMed, CPIC guidelines, PharmGKB)
2. Create a JSON file in `data/pgx/studies/` following the naming pattern: `{gene}_{year}_{slug}.json`
3. Open a PR

The system automatically:
- Creates the gene if it doesn't exist in the catalog
- Registers all rsIDs for DNA parsing
- Builds the drug-to-gene index
- Makes the interpretations available in all reports

### Study file template

```json
{
  "gene": "GENE_SYMBOL",
  "category": "drug_metabolism",
  "gene_description": "What this gene does",
  "drugs": ["generic_drug_name"],
  "source": {
    "pmid": "12345678",
    "doi": "10.xxxx/xxxxx",
    "source_type": "pubmed",
    "title": "Study title",
    "journal": "Journal name",
    "year": 2024,
    "cohort_size": 1000,
    "url": "https://pubmed.ncbi.nlm.nih.gov/12345678/",
    "finding": "One-line summary of the key finding"
  },
  "snps": [
    {
      "rsid": "rs12345",
      "risk_allele": "A",
      "reference_allele": "G",
      "interpretations": {
        "AA": { "phenotype": "Poor Metabolizer", "effect": "...", "recommendation": "...", "severity": "severe" },
        "AG": { "phenotype": "Intermediate", "effect": "...", "recommendation": "...", "severity": "moderate" },
        "GG": { "phenotype": "Normal", "effect": "...", "recommendation": "...", "severity": "info" }
      }
    }
  ],
  "evidence_level": "established"
}
```

Full schema: [`openpgx.schema.json`](docs/openpgx.schema.json) (see `$defs/study_contribution`)

---

## The OpenPGx Output Standard (v0.4.0)

Patient-facing OpenPGx files are a single JSON object. The **only required top-level field** is `openpgx_version` (must be `"0.4.0"`). Everything else follows [`openpgx.schema.json`](docs/openpgx.schema.json).

Top-level structure:

| Field | Required | Role |
|--------|----------|------|
| **`openpgx_version`** | yes | Specification version; const `0.4.0` |
| **`metadata`** | no | `generated_at`, `generator`, `sources`; optional `last_updated` |
| **`provenance`** | no | Audit trail: `version`, `previous_version_hash`, `changelog[]` (`date`, `reason`, optional `description`, `affected_sections`) |
| **`patient`** | no | Profile only (no genotypes): `id`, `raw_data_source`, `raw_data_format`, `extraction_date`, `ancestry` |
| **`observations`** | no | Raw measurements: each item has `gene`, `rsid`, `genotype`; optional `chromosome`, `position`, `diplotype`, `activity_score` |
| **`medications`** | no | Per-drug blocks: `drug` (`name`, `class`, optional `brand_names`, `atc_code`, `drugbank_id`), `pgx_associations[]`, optional `interactions[]`, optional `dosing`, plus `parsed_at`, `parse_source`, `confidence` (`score`, `evidence_level`, …) |
| **`risks`** | no | Disease risk: `condition`, `category` (enum incl. oncology, cardiovascular, …), `overall_risk`, `risk_snps[]`, `evidence`, `actionable`, `recommendation`, `studies`; optional `icd10`, `polygenic_score`, `lifetime_risk` |
| **`traits`** | no | `trait`, `category`, `snps[]`, `your_phenotype`, `description`, `evidence`, `practical_advice`, `studies` |
| **`fhir_mapping`** | no | Hints for FHIR: `patient_reference`, `service_request_id`, `resource_mappings`, `terminology_systems` |

Minimal valid skeleton (only the required field):

```json
{
  "openpgx_version": "0.4.0"
}
```

Example with the main optional sections (names shortened; see schema for full `$defs`):

```json
{
  "openpgx_version": "0.4.0",
  "metadata": {
    "generated_at": "2026-04-12T12:00:00Z",
    "generator": "openpgx-mcp/1.x",
    "sources": ["CPIC", "PharmGKB"]
  },
  "patient": {
    "raw_data_source": "23andMe",
    "ancestry": "european"
  },
  "observations": [
    {
      "gene": "CYP2C19",
      "rsid": "rs4244285",
      "genotype": "AG"
    }
  ],
  "medications": [
    {
      "drug": { "name": "clopidogrel", "class": "antiplatelet" },
      "pgx_associations": [
        {
          "gene": "CYP2C19",
          "rsid": "rs4244285",
          "effect": "Reduced active metabolite formation",
          "evidence": { "level": "established", "sources": [] },
          "clinical_recommendation": "Consider alternative antiplatelet per guideline"
        }
      ],
      "parsed_at": "2026-04-12T12:00:00Z",
      "parse_source": "cpic_guideline",
      "confidence": { "score": 0.9, "evidence_level": "established" }
    }
  ],
  "fhir_mapping": {
    "resource_mappings": {
      "observations": "Observation (code: LOINC 81247-9 'Master HL7 genetic variant reporting panel')",
      "medications": "DiagnosticReport (code: LOINC 51969-4 'Genetic analysis report') + MolecularSequence",
      "risks": "RiskAssessment (method: LOINC 75321-0 'Clinical genomics report')",
      "traits": "Observation (category: genomics)"
    }
  }
}
```

Full schema: [`openpgx.schema.json`](docs/openpgx.schema.json)

---

## Architecture

```
Raw DNA file (23andMe .txt / Genera .csv)
        |
        v
+------------------+
|  Parser           | --> Extracts relevant SNPs from 600K+ raw data
|  (local, private) |
+------------------+
        |
        v
+------------------+
|  Study Catalog    | --> 67 studies x 63 genes x 127 drugs
|  (data/pgx/       |     Auto-creates gene definitions
|   studies/*.json)  |     Builds drug-gene index at runtime
+------------------+
        |
        v
+------------------+
|  MCP Tools        | --> 9 tools for AI interaction
|  (server-core.ts) |     Falls back to AI web search when needed
+------------------+
        |
        v
    AI Assistant (Claude, Cursor, ChatGPT, etc.)
```

All processing happens locally. No data is sent to any server.

---

## Supported raw data formats

- 23andMe (.txt) — fully supported
- Genera (.csv) — fully supported
- AncestryDNA — coming soon
- VCF — coming soon

---

## Smart Drug Resolution

OpenPGx resolves drug names through 6 layers:

1. **Brand > Generic** — "Ozempic" > semaglutide (60+ brands including Venvanse, Rivotril, Marevan, Provigil, Stavigile)
2. **Generic exact match** — "semaglutide" > found
3. **Fuzzy brand match** — "ozmpic" > Ozempic > semaglutide
4. **Fuzzy generic match** — "sertralina" > sertraline
5. **Category search** — "weight loss", "antidepressant", "antidepressivo" > list of drugs
6. **Semantic search** — pre-computed TF-IDF embeddings (289KB)

---

## Development

```bash
git clone https://github.com/open-pgx/open-pgx.git
cd open-pgx/mcp-server
npm install
npm run build
npm start
```

### Project structure

```
mcp-server/
├── src/
│   ├── index.ts            # Entry point (stdio transport)
│   ├── server-core.ts      # MCP tools (11 tools)
│   ├── pgx-catalog.ts      # Study loader, gene index, phenotype inference
│   ├── parsers.ts           # 23andMe & Genera raw data parsers
│   ├── pharmacogenes.ts     # Barrel re-exports
│   ├── drug-resolver.ts     # 6-layer smart drug resolution
│   ├── risk-catalog.ts      # Disease risk definitions
│   ├── trait-catalog.ts     # Trait definitions
│   └── types.ts             # Shared TypeScript interfaces
├── data/
│   ├── pgx/studies/         # 67 study files (the knowledge base)
│   ├── risks/               # Disease risk condition definitions
│   ├── traits/              # Trait definitions
│   ├── drugs_embeddings.json # TF-IDF vectors for semantic search
│   └── tfidf_vocab.json     # TF-IDF vocabulary
├── genomes/                  # Safe gitignored dir for your DNA files
└── package.json
```

---

## Privacy & Security

- Your genetic data **never leaves your computer**
- No cloud upload, no account, no tracking
- Pre-commit hook prevents accidentally committing DNA files
- `.gitignore` blocks all genetic file patterns
- The code is open source — audit it yourself

---

## License

- **Specification (OpenPGx format):** Apache License 2.0
- **Code (MCP server, parsers):** MIT License

---

## Disclaimer

OpenPGx is for educational and research purposes only. It does not replace professional medical advice. Always consult your physician before making decisions about medications or supplements. Genetic risk is probabilistic, not deterministic. Evidence levels and source publications are provided for every association.

---

**OpenPGx** — The open standard for AI-readable pharmacogenomics.

[openpgx.ai](https://openpgx.ai) · [GitHub](https://github.com/open-pgx) · [npm](https://www.npmjs.com/package/openpgx)
