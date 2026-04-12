---
name: openpgx-research
description: >
  Research and create OpenPGx pharmacogenomic/nutrigenomic study JSON files from gene/rsID inputs.
  Use this skill whenever the user asks to: create new PGx studies, research a gene or SNP for OpenPGx,
  add a new gene to the catalog, generate study JSONs, expand the OpenPGx database, process genes from
  TODO-RESEARCH.md, create studies from DNHygia/HeartGenetics/Xcode sources, or anything involving
  "openpgx", "study json", "gene research", "rsid", "pharmacogenomics study", "nutrigenomics study",
  "pgx catalog". Also trigger when user mentions specific gene names like CYP2D6, ABCB1, MTHFR etc.
  in the context of creating database entries or study files.
---

# OpenPGx Research — Gene/SNP Study Generator

You are creating structured pharmacogenomic (PGx) and nutrigenomic study files for the OpenPGx open-source catalog. Each file represents one gene-drug or gene-trait association backed by peer-reviewed evidence.

## Project Layout

```
openpgx-project/
├── mcp-server/
│   ├── data/pgx/studies/          ← study JSONs go here
│   ├── docs/openpgx.study.schema.json  ← canonical schema (v0.4.0)
│   └── TODO-RESEARCH.md           ← master list of pending genes
├── openpgx.study.schema.json      ← root copy (may be older)
```

**Always read the schema from `mcp-server/docs/openpgx.study.schema.json`** — it's the most up-to-date version.

## Workflow Overview

The process has 5 phases. Do them in order, but batch work within each phase for speed.

```
1. DISCOVER  →  2. RESEARCH  →  3. GENERATE  →  4. VALIDATE  →  5. UPDATE TODO
```

---

## Phase 1: DISCOVER — What needs to be built?

Start by understanding what the user wants:

- **If user names specific genes**: collect gene symbols, rsIDs, drugs, and category (PGx or nutrigen).
- **If user says "do all from TODO"**: read `mcp-server/TODO-RESEARCH.md` and filter for unchecked items (`- [ ]`) matching the user's criteria (e.g., "all DNHygia", "all TDAH genes", "all nutrigenetics").
- **If user provides a report/PDF**: extract gene+rsID pairs from the document.

### Checklist before proceeding

For each gene you're about to research, confirm you have:
- [ ] Gene symbol (HGNC standard, e.g., `CYP2D6` not `cyp2d6`)
- [ ] At least one rsID
- [ ] Associated drugs or traits
- [ ] Rough category (drug_metabolism, drug_target, drug_transport, immune, nutrient_absorption, vitamin_conversion, etc.)

### Check for duplicates

Before researching, verify the gene doesn't already have a study:

```bash
ls mcp-server/data/pgx/studies/ | grep -i <gene_name_lowercase>
```

If a study exists, the user might want an *upgrade* (add more SNPs/drugs) rather than a new file. Ask.

---

## Phase 2: RESEARCH — Gather evidence from the literature

This is the most important phase. Bad research = bad study files. Here's what to search for each gene/rsID.

### Search strategy

Run **parallel web searches** for efficiency. For each gene, do 1-2 searches:

**Search query template:**
```
"<GENE> <rsID> <key_drug_or_trait> pharmacogenomics <functional_keyword> allele frequency"
```

Example:
```
"CYP1A2 rs762551 caffeine clozapine metabolism *1F allele frequency"
```

### What to extract from search results

For each gene, you need these data points:

| Data point | Where to find it | Criticality |
|------------|-------------------|-------------|
| **Mechanism** — what the gene/protein does | PharmGKB summary, gene review articles | Required |
| **Risk allele** — which allele causes the altered phenotype | Primary GWAS or PGx study | Required |
| **Reference allele** — the "normal" allele | Same source, or dbSNP | Required |
| **Clinical effect per genotype** (homozygous risk, heterozygous, wild-type) | Clinical studies, CPIC/DPWG guidelines | Required |
| **Recommendations per genotype** | CPIC guideline, FDA label, clinical consensus | Required |
| **Severity per genotype** | Clinical judgment from evidence | Required |
| **Odds ratio** (if available) | Meta-analysis or large cohort study | Nice to have |
| **Population frequencies** (EUR, AFR, EAS, SAS, LAT) | gnomAD, 1000 Genomes, study cohorts | Nice to have |
| **PMID / DOI** of the primary source | PubMed | Required |
| **Cohort size** of the primary study | Abstract or methods section | Nice to have |
| **Evidence level** | See classification below | Required |

### Evidence level classification

| Level | Criteria |
|-------|---------|
| `established` | CPIC Level A/B, PharmGKB Level 1A/1B, FDA label, or multiple large meta-analyses |
| `moderate` | PharmGKB Level 2A/2B, single large meta-analysis, or consistent replicated GWAS |
| `emerging` | PharmGKB Level 3, single well-powered study, or GWAS without replication |
| `preliminary` | Small cohort, candidate gene study, or conflicting evidence |

### Common pitfalls from experience

1. **Don't confuse risk/reference alleles.** Some papers report the minor allele as risk, others the major. Cross-reference with dbSNP. The risk_allele is the one that *changes* the phenotype from normal.

2. **Population frequencies are allele frequencies, not genotype frequencies.** A value of 0.30 means 30% of alleles in that population carry the variant — not that 30% of people are homozygous.

3. **Always include both heterozygous orderings** (e.g., both "AG" and "GA") with identical content. The OpenPGx search system matches genotypes literally, and users' raw data may report either strand orientation.

4. **For HLA genes**, the rsID may be a tag SNP, not the actual HLA allele. Clarify this in the effect text.

5. **For haplotypic genes** (like APOE with ε2/ε3/ε4 from two SNPs), create entries for BOTH rsIDs and explain the haplotype system in the gene_description.

6. **Source URL format**: always use `https://pubmed.ncbi.nlm.nih.gov/<PMID>/` for PubMed sources.

---

## Phase 3: GENERATE — Create the JSON study files

### File naming convention

```
<gene_lowercase>_<year>_<short_description>.json
```

Examples:
- `cyp1a2_2012_caffeine_clozapine.json`
- `abcg2_2022_bcrp_transport.json`
- `f5_2017_factor_v_leiden.json`

Rules:
- Gene name always lowercase
- Year = publication year of primary source
- Description = 2-4 words, lowercase, underscores
- No spaces, no special characters

### JSON template

Use this template for every study. Read it from `references/study_template.json` if available, otherwise use this:

```json
{
  "gene": "GENE_SYMBOL",
  "category": "category_here",
  "gene_description": "One-sentence description of gene function and clinical relevance",
  "drugs": ["drug1", "drug2"],
  "source": {
    "pmid": "12345678",
    "doi": "10.xxxx/xxxxx",
    "source_type": "pubmed",
    "title": "Full title of the primary paper",
    "journal": "Journal Name",
    "year": 2024,
    "cohort_size": null,
    "url": "https://pubmed.ncbi.nlm.nih.gov/12345678/",
    "finding": "One-line summary of the key finding with specific numbers"
  },
  "snps": [
    {
      "rsid": "rs12345",
      "risk_allele": "A",
      "reference_allele": "G",
      "interpretations": {
        "AA": {
          "phenotype": "Clinical phenotype name",
          "effect": "2-4 sentence clinical effect description",
          "recommendation": "Actionable clinical recommendation",
          "severity": "moderate",
          "odds_ratio": null
        },
        "AG": {
          "phenotype": "Heterozygous phenotype",
          "effect": "Effect description for heterozygotes",
          "recommendation": "Recommendation for heterozygotes",
          "severity": "mild"
        },
        "GA": {
          "phenotype": "Heterozygous phenotype",
          "effect": "Effect description for heterozygotes (same as AG)",
          "recommendation": "Recommendation for heterozygotes (same as AG)",
          "severity": "mild"
        },
        "GG": {
          "phenotype": "Normal/wild-type phenotype",
          "effect": "Normal function description",
          "recommendation": "Standard guidelines",
          "severity": "info"
        }
      },
      "population_frequency": {
        "european": 0.10,
        "african": 0.05,
        "east_asian": 0.15,
        "south_asian": 0.08,
        "latino": 0.09
      }
    }
  ],
  "evidence_level": "moderate",
  "contributor": {
    "name": "OpenPGx Community",
    "github": "openpgx"
  }
}
```

### Writing quality guidelines

**gene_description**: Start with gene full name, then a dash, then what it does clinically. Keep under 200 chars.
- Good: `"Cytochrome P450 1A2 — major hepatic enzyme responsible for metabolism of caffeine, clozapine, theophylline, olanzapine, and several other drugs."`
- Bad: `"CYP1A2 gene"`

**effect**: 2-4 sentences. Include specific numbers (fold-change, OR, percentage) when available. Explain the mechanism briefly. Don't just say "increased risk" — say what kind of risk and how much.

**recommendation**: Actionable. Start with a verb. Include specific dosing guidance if available (e.g., "initial dose ≤20mg per CPIC guideline"). For serious reactions, use "DO NOT USE" in caps.

**severity scale**:
- `info` = no clinical action needed, normal phenotype
- `mild` = minor effect, standard dosing usually OK but monitor
- `moderate` = may need dose adjustment or enhanced monitoring
- `severe` = significant risk, avoid drug or use alternative
- `life_threatening` = contraindication, risk of death (SJS/TEN, anaphylaxis, etc.)

**finding** (in source): One line with the key result and p-value or OR if available. This should read like a paper's conclusion sentence.

### Batching for speed

Create files in parallel batches of 4-6. Don't create them one by one — that's slow. Use the Write tool for each file simultaneously in a single message.

---

## Phase 4: VALIDATE — Check all files against schema

After creating ALL files, run the validation script. This catches errors before they reach the catalog.

### Validation script

```python
import json, sys
from jsonschema import validate, ValidationError

schema_path = 'mcp-server/docs/openpgx.study.schema.json'
studies_dir = 'mcp-server/data/pgx/studies/'

with open(schema_path) as f:
    schema = json.load(f)

new_files = [...]  # list of new filenames

errors = 0
for fn in new_files:
    path = studies_dir + fn
    try:
        with open(path) as f:
            data = json.load(f)
        validate(instance=data, schema=schema)
        # Extra checks beyond schema:
        for snp in data['snps']:
            genotypes = list(snp['interpretations'].keys())
            # Check both het orderings exist
            for gt in genotypes:
                if len(gt) == 2:
                    reverse = gt[1] + gt[0]
                    if reverse != gt and reverse not in genotypes:
                        print(f'WARNING {fn}: missing reverse genotype {reverse} for {gt}')
        print(f'OK: {fn}')
    except Exception as e:
        print(f'FAIL {fn}: {e}')
        errors += 1

print(f'\nResult: {len(new_files) - errors}/{len(new_files)} valid')
```

Install jsonschema if needed: `pip install jsonschema --break-system-packages -q`

### What to check beyond the schema

The JSON schema validates structure but not quality. Also verify:

1. **Genotype completeness**: every SNP should have all 3 genotypes (homozygous risk, heterozygous, wild-type) + the reverse heterozygous. So for A/G, you need: AA, AG, GA, GG.

2. **Severity consistency**: wild-type should always be `info`. Homozygous risk should be ≥ heterozygous severity.

3. **Population frequencies**: should sum to reasonable values (all between 0 and 1, risk allele frequency shouldn't be >0.95 in all populations — that would mean it's actually the reference allele).

4. **No duplicate files**: `ls studies/ | sort | uniq -d` should return nothing.

5. **Source URL is valid**: PMID-based URLs should follow `https://pubmed.ncbi.nlm.nih.gov/<PMID>/`.

---

## Phase 5: UPDATE TODO — Mark completed items

After validation passes, update `TODO-RESEARCH.md`:

1. Change `- [ ]` to `- [x]` for each gene you created
2. Add source annotation: `*(added — source: <source_name>)*`
3. If this created a gene from the "Candidate genes identified but NOT yet added" section, move it to the "Genes extracted and already added to catalog" table

Example:
```markdown
# Before:
- [ ] `CYP1A2` rs762551 — caffeine, clozapine, theophylline

# After:
- [x] `CYP1A2` rs762551 — caffeine, clozapine, theophylline *(added — source: DNHygia Farmaco + PharmGKB)*
```

Also update the coverage counters at the top of the file.

---

## Speed tips (learned from practice)

1. **Batch web searches**: research 3-4 genes per search round, in parallel. Don't search one at a time.

2. **Batch file creation**: write 4-6 JSON files per round using parallel Write calls. Don't create one, validate, create another.

3. **Validate once at the end**, not after each file. The schema validation is cheap and fast.

4. **Don't re-read files after writing.** The Write tool confirms success; trust it.

5. **For large batches (>10 genes)**: organize into thematic groups (Clinical PGx, Nutrigenetics, Circadian, Lipids, etc.) and process group by group. This keeps the research focused and reduces context-switching.

6. **Read the schema FIRST**, before any file creation. This avoids structural errors that force rewrites.

---

## Category reference

| Category | When to use | Example genes |
|----------|-------------|---------------|
| `drug_metabolism` | CYP enzymes, phase I/II metabolism | CYP2D6, CYP1A2, GSTP1, UGT1A1 |
| `drug_target` | Receptors, channels, enzymes that drugs act on | OPRM1, MTNR1B, GRK4, F2, F5 |
| `drug_transport` | Efflux/uptake transporters | ABCB1, ABCG2, SLCO1B1 |
| `immune` | HLA genes, immune-mediated reactions | HLA-B, HLA-A |
| `nutrient_absorption` | Intestinal absorption, metabolic enzymes | FABP2, FADS1, LPL, FTO |
| `vitamin_conversion` | Vitamin synthesis/activation | DHCR7, BCMO1 |
| `vitamin_receptor` | Vitamin receptor signaling | VDR |
| `glp1_response` | GLP-1 pathway | GLP1R, GIPR |
| `catecholamine` | Dopamine/norepinephrine pathway | COMT, DRD2 |
| `methylation` | Methylation cycle | MTHFR, CBS |
| `folate_metabolism` | Folate pathway | MTHFR |

---

## Troubleshooting

**"Schema validation fails with 'additionalProperties'"**
→ You likely added a field that's not in the schema. Check for typos in field names.

**"Missing reverse genotype warning"**
→ Add both orderings. If risk=A, ref=G, you need AA, AG, GA, GG (not just AA, AG, GG).

**"Population frequency looks wrong"**
→ Remember: these are ALLELE frequencies (0.0-1.0), not percentages. And they're for the RISK allele specifically. Check gnomAD or 1000 Genomes if in doubt.

**"Which source to pick when multiple studies exist?"**
→ Prefer (in order): CPIC guideline > large meta-analysis > PharmGKB summary > original GWAS > single cohort study. Always pick the most authoritative, most recent, largest-cohort source.

**"Gene has multiple important rsIDs"**
→ Put them all in the same study file under the `snps` array. One file per gene (unless the gene has genuinely separate drug associations, like DRD2 for antipsychotics vs food reward).
