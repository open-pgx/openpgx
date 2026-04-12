# Quick Reference: Research Sources for OpenPGx Studies

## Tier 1 — Authoritative (prefer these)

| Source | URL pattern | What it gives you |
|--------|-------------|-------------------|
| **CPIC Guidelines** | cpicpgx.org/guidelines/ | Gold-standard drug-gene pairs, dosing recommendations, evidence levels |
| **PharmGKB** | pharmgkb.org/gene/GENE | Gene summaries, drug-gene annotations, clinical annotations |
| **DPWG** (Dutch guidelines) | pharmgkb.org/page/dpwg | European PGx dosing guidelines |
| **FDA Table** | fda.gov/drugs/...pharmacogenomics | FDA-approved PGx biomarkers |

## Tier 2 — Strong evidence

| Source | Best for |
|--------|----------|
| **PubMed meta-analyses** | Pooled odds ratios, cohort sizes, effect sizes |
| **gnomAD** (gnomad.broadinstitute.org) | Population allele frequencies |
| **ClinVar** (ncbi.nlm.nih.gov/clinvar) | Clinical significance classifications |
| **SNPedia** (snpedia.com) | Quick SNP summaries with genotype effects |

## Tier 3 — Supplementary

| Source | Best for |
|--------|----------|
| **dbSNP** (ncbi.nlm.nih.gov/snp) | Allele details, chromosome position |
| **GeneCards** | Gene function overview |
| **OMIM** | Mendelian disease associations |
| **1000 Genomes** | Population frequency data |

## Search templates by study type

### PGx (drug-gene interaction)
```
"<GENE> <rsID> pharmacogenomics <DRUG> clinical significance allele frequency"
"<GENE> <rsID> CPIC DPWG guideline <DRUG>"
```

### Nutrigenomics (gene-nutrient interaction)
```
"<GENE> <rsID> <NUTRIENT/TRAIT> nutrigenomics allele frequency"
"<GENE> <rsID> <NUTRIENT> metabolism GWAS meta-analysis"
```

### Disease risk
```
"<GENE> <rsID> <DISEASE> susceptibility GWAS odds ratio allele frequency"
```

## PMID extraction shortcuts

When you find a good paper in search results, the PMID is in the URL:
- `pubmed.ncbi.nlm.nih.gov/12345678/` → PMID = 12345678
- `pmc.ncbi.nlm.nih.gov/articles/PMC1234567/` → search PubMed for the PMID separately
