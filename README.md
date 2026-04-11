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

---

## What can you ask?

### Medications (Pharmacogenomics)

```
"Upload my genome"                    → parse your raw DNA file
"Can I take Ozempic?"                 → check semaglutide + GLP1R
"What about Venvanse?"                → brand names work (60+ mapped)
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

### AI-Powered Drug Research

When a drug isn't in the local knowledge base, the AI can search online and bring the data back into the OpenPGx standard:

```
"Can I take metformin?"               → not found locally
                                      → AI searches PharmGKB, CPIC, PubMed
                                      → saves structured study to local cache
                                      → returns personalized result
```

---

## What's in the knowledge base

### 19 Genes with Study Data

Every gene is backed by at least one published study with interpretations per genotype:

| Category | Genes |
|----------|-------|
| Drug Metabolism | CYP2D6, CYP2C19, CYP2C9, CYP3A5, ALDH2 |
| Drug Targets | DPYD, TPMT, NUDT15, VKORC1 |
| Drug Transport | SLCO1B1 |
| Immune | HLA-B |
| Methylation & Vitamins | MTHFR, COMT, VDR, BCMO1, FUT2, CBS |
| GLP-1 Response | GLP1R, GIPR |

### 50+ Drugs Indexed

Warfarin, clopidogrel, simvastatin, semaglutide, modafinil, lisdexamfetamine, abacavir, tacrolimus, capecitabine, azathioprine, codeine, tramadol, and many more — each linked to specific genes with evidence.

### 21 Published Studies

Each with PMID/DOI, cohort sizes, and genotype-level interpretations. From CPIC guidelines, PharmGKB, and peer-reviewed journals.

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

### 11 MCP Tools

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
| `search_drug_pgx` | AI-powered drug research prompt (web search fallback) |
| `save_drug_research` | Save and validate AI-researched drug data |

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

Full schema: [`openpgx.study.schema.json`](../openpgx.study.schema.json)

---

## The OpenPGx Output Standard (v0.4.0)

The output format separates raw observations from interpretations for clinical audit trail:

- **`observations`** — raw genotypes (what was measured)
- **`medications`** — drug-gene interpretations with structured confidence scoring
- **`risks`** — disease predispositions with odds ratios and lifetime risk
- **`traits`** — observable characteristics with practical advice
- **`provenance`** — version history and changelog for tracking what changed and why
- **`fhir_mapping`** — how each section maps to HL7 FHIR resources

Full schema: [`openpgx.schema.json`](../openpgx.schema.json)

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
|  Study Catalog    | --> 21 studies x 19 genes x 50+ drugs
|  (data/pgx/       |     Auto-creates gene definitions
|   studies/*.json)  |     Builds drug-gene index at runtime
+------------------+
        |
        v
+------------------+
|  MCP Tools        | --> 11 tools for AI interaction
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
│   ├── pgx/studies/         # 21 study files (the knowledge base)
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
