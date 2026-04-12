# OpenPGx Research TODO

> **Want to contribute?** Use the Research CLI to generate any study from this list.
> Each study costs roughly $0.01–0.02 in LLM tokens. Run it and open a PR!
>
> ```bash
> cd mcp-server
> ANTHROPIC_API_KEY=sk-... npm run research
> # or with Gemini Flash (~10× cheaper):
> LLM_PROVIDER=google GOOGLE_GENERATIVE_AI_API_KEY=... npm run research
> ```

---

## Current Coverage

| Type | Existing | Target | Progress |
|------|----------|--------|----------|
| PGx Studies (gene–drug) | 32 | 120+ | ███░░░░░░░ 27% |
| Disease Risks | 20 | 50+ | ████░░░░░░ 40% |
| Genetic Traits | 33 | 60+ | █████░░░░░ 55% |

---

## PGx Studies — Drugs & Genes

### High Priority

Studies with strong clinical evidence (CPIC Level A/B, PharmGKB Level 1/2). Direct impact on dosing.

#### ADHD
- [ ] `SLC6A3` — methylphenidate, lisdexamfetamine, amphetamine (DAT1 VNTR, rs27072)
- [ ] `ADRA2A` — guanfacine, clonidine (rs1800544)
- [ ] `CES1` — methylphenidate (rs71647871, rs2244613)
- [ ] `DRD4` — methylphenidate, amphetamine (48bp VNTR, rs1800955)
- [ ] `SNAP25` — methylphenidate (rs3746544)
- [ ] `NET/SLC6A2` — atomoxetine (rs28386840, rs2242446)

#### Cannabis / Cannabidiol
- [ ] `CYP3A4` — cannabidiol, dronabinol, nabilone (*1B, *22)
- [ ] `CNR1` — cannabidiol, dronabinol (rs1049353, rs806379)
- [ ] `FAAH` — cannabidiol (rs324420 — Pro129Thr)
- [x] `ABCB1` — cannabidiol, dronabinol (rs1045642, rs2032582) *(added — PharmGKB + CPIC literature)*
- [ ] `AKT1` — cannabis/THC psychosis risk (rs2494732)
- [ ] `COMT` — cannabis/THC psychosis interaction (rs4680 × cannabis)
- [ ] `CYP2C9` — THC metabolism (rs1799853, rs1057910)

#### Antidepressants / SSRIs
- [ ] `SLC6A4` — sertraline, escitalopram, fluoxetine, paroxetine, citalopram (5-HTTLPR, rs25531)
- [ ] `HTR2A` — SSRIs (rs7997012, rs6311)
- [x] `CYP2B6` — bupropion, ketamine, methadone (rs3745274 — *6) *(added — CPIC)*
- [ ] `FKBP5` — antidepressant response (rs1360780, rs9296158)
- [ ] `GRIK4` — citalopram response (rs1954787)
- [ ] `HTR1A` — SSRI response (rs6295 — C-1019G)
- [x] `ABCB1` — antidepressant CNS penetration (rs2032582, rs1045642) *(covered by ABCB1 study)*
- [ ] `SLC6A2` — venlafaxine, duloxetine, nortriptyline (rs5569)

#### Pain / Opioids
- [x] `OPRM1` — morphine, oxycodone, fentanyl, naltrexone, buprenorphine (rs1799971 — A118G) *(existing — reward/food + applicable to pain)*
- [ ] `CYP3A4` — fentanyl, methadone, buprenorphine, oxycodone (*1B, *22)
- [x] `ABCB1` — morphine, fentanyl, methadone (rs1045642 — C3435T) *(covered by ABCB1 study)*
- [ ] `COMT` — opioid dose requirement (rs4680 — Val158Met)
- [ ] `MC1R` — anesthetic requirement, pain sensitivity (rs1805007, rs1805008)
- [ ] `SCN9A` — pain sensitivity (rs6746030)

#### GLP-1 / Weight (expand)
- [ ] `MC4R` — semaglutide, tirzepatide, liraglutide (rs17782313)
- [x] `FTO` — semaglutide, tirzepatide, orlistat (rs9939609) *(added — Frayling 2007 et al.)*
- [ ] `PCSK1` — semaglutide, liraglutide (rs6232, rs6235)
- [ ] `GIPR` — tirzepatide (rs10423928) *expand existing study*
- [ ] `TMEM18` — obesity drug response (rs6548238)

#### Anxiolytics / Benzodiazepines
- [ ] `CYP3A4` — alprazolam, midazolam, triazolam, diazepam (*1B, *22)
- [ ] `CYP2C19` — diazepam, clobazam (*2, *3, *17)
- [ ] `GABRA2` — benzodiazepine response, dependence risk (rs279858)
- [ ] `GABRA6` — benzodiazepine sensitivity (rs3219151)

#### Antipsychotics
- [ ] `CYP2D6` — risperidone, aripiprazole, haloperidol, quetiapine (*3, *4, *5, *6, *41)
- [ ] `CYP1A2` — clozapine, olanzapine (rs762551 — *1F)
- [x] `DRD2` — risperidone, haloperidol, aripiprazole (rs1800497 — Taq1A) *(added — Zhang 2010 et al.; PharmGKB)*
- [ ] `DRD3` — clozapine response (rs6280 — Ser9Gly)
- [x] `HTR2C` — antipsychotic weight gain (rs3813929) *(added — Sicard 2012 et al.)*
- [ ] `MC4R` — antipsychotic weight gain (rs17782313)
- [ ] `HLA-DQB1` — clozapine-induced agranulocytosis (HLA-DQB1*02:01)

#### Antiepileptics
- [ ] `HLA-B` — carbamazepine, oxcarbazepine, phenytoin (*15:02 — SJS/TEN)
- [ ] `HLA-A` — carbamazepine (*31:01 — DRESS)
- [ ] `CYP2C9` — phenytoin, fosphenytoin (*2, *3)
- [ ] `UGT1A4` — lamotrigine (rs2011425)
- [ ] `SCN1A` — carbamazepine, phenytoin response (rs3812718)

#### Anticoagulants (DOACs)
- [ ] `CES1` — dabigatran (rs71647871, rs2244613)
- [ ] `ABCB1` — dabigatran, rivaroxaban, apixaban (rs1045642)
- [ ] `CYP3A4` — rivaroxaban, apixaban (*22)

#### Statins (expand)
- [ ] `CYP3A4` — atorvastatin, simvastatin, lovastatin (*22)
- [ ] `ABCG2` — rosuvastatin, atorvastatin (rs2231142 — Q141K)
- [ ] `HMGCR` — statin efficacy (rs17238540)
- [ ] `LDLR` — statin response (rs6511720)
- [ ] `PCSK9` — statin response, PCSK9 inhibitors (rs11591147)

#### Cardiovascular (expand)
- [ ] `CYP2D6` — metoprolol, carvedilol, propranolol, timolol
- [ ] `ADRB1` — metoprolol, atenolol, bisoprolol (rs1801253 — Arg389Gly)
- [ ] `ADRB2` — salbutamol, salmeterol, formoterol (rs1042713 — Arg16Gly)
- [ ] `ACE` — ACE inhibitors (I/D polymorphism)
- [ ] `AGTR1` — losartan, valsartan (rs5186 — A1166C)

#### Diabetes (expand)
- [x] `C11ORF65/ATM` — metformin response (rs11212617) *(added — Zhou 2011 Nat Genet)*
- [ ] `SLC22A1` — metformin (rs628031, rs36056065 — OCT1)
- [ ] `SLC22A2` — metformin (rs316019 — OCT2)
- [ ] `CYP2C9` — glimepiride, glipizide (*2, *3)
- [ ] `TCF7L2` — metformin, sulfonylureas response (rs7903146)

#### Oncology (expand)
- [ ] `UGT1A1` — irinotecan (*28 — Gilbert)
- [ ] `CYP2D6` — tamoxifen → endoxifen
- [ ] `BRCA1/BRCA2` — olaparib, talazoparib (PARP inhibitors)
- [ ] `EGFR` — gefitinib, erlotinib, osimertinib (L858R, exon 19 del)
- [ ] `ALK` — crizotinib, alectinib (EML4-ALK fusion)
- [ ] `BRAF` — vemurafenib, dabrafenib (V600E)
- [ ] `PD-L1/TMB` — pembrolizumab, nivolumab (checkpoint inhibitors)
- [ ] `RAS/KRAS` — cetuximab, panitumumab (G12/G13 mutations)

#### Immunosuppressants (expand)
- [ ] `UGT1A9` — mycophenolate (rs72551330, rs2741049)
- [ ] `CYP3A4` — cyclosporine (*22)
- [ ] `IMPDH1/2` — mycophenolate (rs2278294)

#### Proton Pump Inhibitors
- [ ] `CYP2C19` — omeprazole, lansoprazole, pantoprazole, esomeprazole (*2, *3, *17)

#### Antifungals
- [ ] `CYP2C19` — voriconazole (*2, *3, *17)

#### HIV
- [x] `HLA-B` — abacavir (*57:01) *(existing)*
- [x] `CYP2B6` — efavirenz (rs3745274 — *6) *(added — CPIC 2019)*
- [ ] `UGT1A1` — atazanavir (*28)

#### Gout
- [ ] `HLA-B` — allopurinol (*58:01 — SJS/TEN)
- [ ] `ABCG2` — allopurinol, febuxostat (rs2231142)

#### Tuberculosis
- [ ] `NAT2` — isoniazid (slow/fast acetylator — multiple SNPs)
- [ ] `CYP2E1` — isoniazid hepatotoxicity (rs2031920)

#### Anesthesia
- [ ] `BCHE/BChE` — succinylcholine, mivacurium (atypical variants)
- [ ] `RYR1` — anesthetics (malignant hyperthermia — rs121918592)
- [ ] `CYP2D6` — tramadol, codeine (perioperative)

---

### Medium Priority

Studies with moderate evidence. Useful but not sufficient alone to change clinical practice.

#### Supplements / Nutraceuticals
- [ ] `CYP1A2` — caffeine (rs762551) *expand with interactions*
- [ ] `VDR` — vitamin D (rs2228570, rs1544410) *expand*
- [ ] `MTHFR` — folate, B12 (rs1801133) *expand with more drugs*
- [ ] `FADS1/FADS2` — omega-3, omega-6 (rs174537)
- [ ] `GC/VDBP` — vitamin D absorption (rs2282679)
- [ ] `FUT2` — vitamin B12 (rs601338) *expand*
- [ ] `SLC23A1` — vitamin C absorption (rs33972313)
- [ ] `NBPF3` — vitamin B6 metabolism (rs4654748)
- [ ] `TCN2` — vitamin B12 transport (rs1801198)
- [ ] `BCMO1` — beta-carotene (rs12934922, rs7501331) *expand*

#### Hormones
- [ ] `CYP1A2` — estradiol, caffeine–estrogen interaction
- [ ] `CYP3A4` — testosterone, oral contraceptives
- [ ] `COMT` — estrogen metabolism, catechol estrogens (rs4680)
- [ ] `SHBG` — testosterone, estradiol levels (rs6258)
- [ ] `ESR1` — estrogen receptor, tamoxifen (rs2234693)
- [ ] `AR` — testosterone therapy (CAG repeat)

#### Dermatology
- [ ] `HLA-C` — psoriasis biologics (HLA-C*06:02)
- [ ] `IL23R` — ustekinumab response (rs11209026)
- [ ] `CARD14` — psoriasis severity (rs11652075)

---

## Disease Risks

### Missing (planned but not yet generated)

#### Neuropsychiatric
- [ ] Major Depressive Disorder (F32) — `SLC6A4`, `FKBP5`, `BDNF`
- [ ] Generalized Anxiety Disorder (F41.1) — `SLC6A4`, `CRHR1`, `MAOA`
- [ ] Bipolar Disorder (F31) — `CACNA1C`, `ANK3`, `ODZ4`
- [ ] Schizophrenia (F20) — `COMT`, `DRD2`, `DISC1`, `C4A`
- [ ] Chronic Pain Susceptibility (G89) — `COMT`, `OPRM1`, `SCN9A`

#### Metabolic
- [ ] Obesity (E66) — `FTO`, `MC4R`, `TMEM18`, `GNPDA2`
- [ ] Non-Alcoholic Fatty Liver Disease (K76.0) — `PNPLA3`, `TM6SF2`, `MBOAT7`
- [ ] Chronic Kidney Disease (N18) — `APOL1`, `UMOD`, `SHROOM3`

#### Neurological
- [ ] Migraine (G43) — `CALCA`, `TRPM8`, `MTHFR`, `LRP1`

#### GI / Autoimmune
- [ ] Inflammatory Bowel Disease (K50/K51) — `NOD2`, `IL23R`, `ATG16L1`

#### Cardiovascular
- [ ] Hypertension (I10) — `AGT`, `ACE`, `ADD1`, `CYP11B2`

### New diseases (not yet planned)

#### Neuropsychiatric
- [ ] Autism Spectrum Disorder (F84) — `SHANK3`, `NLGN3`, `CNTNAP2`
- [ ] PTSD susceptibility (F43.1) — `FKBP5`, `CRHR1`, `ADCYAP1R1`
- [ ] OCD (F42) — `SLC6A4`, `SLC1A1`, `DLGAP1`
- [ ] Insomnia (G47.0) — `PER2`, `CLOCK`, `MEIS1`
- [ ] Restless Legs Syndrome (G25.8) — `BTBD9`, `MEIS1`, `MAP2K5`
- [ ] Epilepsy (G40) — `SCN1A`, `SCN2A`, `KCNQ2`
- [ ] Multiple Sclerosis (G35) — `HLA-DRB1`, `IL7R`, `IL2RA`

#### Metabolic
- [ ] Hypothyroidism (E03) — `FOXE1`, `TPO`, `TSHR`
- [ ] Hyperthyroidism/Graves (E05) — `HLA-DRB1`, `CTLA4`, `TSHR`
- [ ] Polycystic Ovary Syndrome (E28.2) — `DENND1A`, `THADA`, `FSHR`
- [ ] Metabolic Syndrome — `FTO`, `TCF7L2`, `PPARG`
- [ ] Lactose Intolerance (E73) — `MCM6/LCT` (rs4988235)
- [ ] Phenylketonuria (E70.0) — `PAH`
- [ ] Wilson Disease (E83.0) — `ATP7B`

#### Cardiovascular
- [ ] Stroke (I63/I64) — `HDAC9`, `PITX2`, `ZFHX3`
- [ ] Aortic Aneurysm (I71) — `FBN1`, `ACTA2`, `MYH11`
- [ ] Peripheral Artery Disease (I73.9) — `CHRNA3`, `9p21`
- [ ] Long QT Syndrome (I45.8) — `KCNQ1`, `KCNH2`, `SCN5A`
- [ ] Cardiomyopathy (I42) — `TTN`, `LMNA`, `MYH7`

#### Oncology
- [ ] Lung Cancer (C34) — `CHRNA5`, `TERT`, `EGFR`
- [ ] Pancreatic Cancer (C25) — `CFTR`, `BRCA2`, `ABO`
- [ ] Thyroid Cancer (C73) — `FOXE1`, `NKX2-1`, `BRAF`
- [ ] Bladder Cancer (C67) — `NAT2`, `GSTM1`, `TP63`
- [ ] Kidney Cancer (C64) — `VHL`, `BAP1`, `PBRM1`
- [ ] Leukemia/Lymphoma (C91-C96) — `ARID5B`, `IKZF1`, `CDKN2A`
- [ ] Gastric Cancer (C16) — `CDH1`, `PSCA`, `MUC1`
- [ ] Cervical Cancer (C53) — `HLA-DRB1`, `MICA`
- [ ] Ovarian Cancer (C56) — `BRCA1`, `BRCA2`, `RAD51C`
- [ ] Testicular Cancer (C62) — `KITLG`, `DMRT1`, `TERT`
- [ ] Brain Tumors / Glioma (C71) — `TERT`, `CDKN2B`, `TP53`

#### Autoimmune / Inflammatory
- [ ] Type 1 Diabetes (E10) — `HLA-DRB1`, `INS`, `PTPN22`
- [ ] Crohn's Disease (K50) — `NOD2`, `ATG16L1`, `IL23R`
- [ ] Ulcerative Colitis (K51) — `IL23R`, `HLA-DRB1`, `ECM1`
- [ ] Ankylosing Spondylitis (M45) — `HLA-B*27`, `ERAP1`, `IL23R`
- [ ] Sjogren's Syndrome (M35.0) — `HLA-DRB1`, `IRF5`, `STAT4`
- [ ] Hashimoto's Thyroiditis (E06.3) — `HLA-DRB1`, `CTLA4`, `PTPN22`
- [ ] Vitiligo (L80) — `TYR`, `HLA-A`, `NLRP1`

#### Respiratory
- [ ] COPD (J44) — `SERPINA1` (alpha-1 antitrypsin), `HHIP`, `FAM13A`
- [ ] Pulmonary Fibrosis (J84.1) — `MUC5B`, `TERT`, `TERC`

#### Musculoskeletal
- [ ] Ankylosing Spondylitis (M45) — `HLA-B27`
- [ ] Fibromyalgia (M79.7) — `COMT`, `SLC6A4`, `5-HT2A`

#### Ophthalmologic
- [ ] Glaucoma (H40) — `MYOC`, `CAV1`, `TMCO1`

#### Renal
- [ ] IgA Nephropathy (N02) — `HLA-DRB1`, `CFHR5`, `DEFA`
- [ ] Polycystic Kidney Disease (Q61) — `PKD1`, `PKD2`

#### Hematologic
- [ ] Sickle Cell Disease (D57) — `HBB` (rs334)
- [ ] Thalassemia (D56) — `HBA1/HBA2`, `HBB`
- [ ] G6PD Deficiency (D55.0) — `G6PD`
- [ ] Hemophilia A/B — `F8`, `F9`

#### Dermatologic
- [ ] Eczema / Atopic Dermatitis (L20) — `FLG`, `IL4R`, `IL13`
- [ ] Alopecia Areata (L63) — `HLA-DRB1`, `CTLA4`, `IL2RA`

---

## Traits — Genetic Characteristics

### Missing (planned but not yet generated)

#### Drug Sensitivity
- [ ] Nicotine Dependence — `CHRNA5` (rs16969968), `CHRNA3`, `CYP2A6`
- [ ] Opioid Sensitivity — `OPRM1` (rs1799971), `COMT`, `CYP2D6`
- [ ] Cannabis Sensitivity — `CNR1` (rs1049353), `AKT1` (rs2494732), `COMT`
- [ ] Alcohol Dependence Risk — `ADH1B` (rs1229984), `ALDH2` (rs671), `GABRA2`
- [ ] Statin Muscle Side Effects — `SLCO1B1` (rs4149056), `LILRB5`
- [ ] Metformin GI Tolerance — `SLC22A1` (rs628031), `OCT1`
- [ ] Warfarin Sensitivity — `VKORC1` (rs9923231), `CYP2C9`
- [ ] Antidepressant Response Speed — `SLC6A4` (5-HTTLPR), `FKBP5`, `BDNF`
- [ ] Pain Threshold — `SCN9A` (rs6746030), `COMT` (rs4680), `OPRM1`
- [ ] Vitamin D Absorption Efficiency — `GC` (rs2282679), `DHCR7`, `CYP2R1`

### New traits (not yet planned)

#### Metabolism
- [ ] Iron Absorption Efficiency — `HFE` (C282Y, H63D), `TFR2`
- [ ] Folate Metabolism Efficiency — `MTHFR` (rs1801133), `MTR`, `MTRR`
- [ ] Copper Metabolism — `ATP7B` (rs1801243)
- [ ] Selenium Status — `SEPP1`, `GPX1`
- [ ] Zinc Absorption — `SLC30A8`, `SLC39A4`

#### Fitness / Performance
- [ ] Sprint vs Endurance Genetic Potential — `ACTN3` (rs1815739 — R577X)
- [ ] Injury Recovery Speed — `COL1A1` (rs1800012), `GDF5`
- [ ] Altitude Adaptation — `EPAS1`, `EGLN1`
- [ ] Muscle Recovery — `IL6` (rs1800795), `TNF`
- [ ] Flexibility / Joint Hypermobility — `COL5A1`, `TNXB`
- [ ] Sweat Rate / Electrolyte Loss — `CFTR`, `SCNN1A`

#### Cognitive
- [ ] Memory Performance — `KIBRA/WWC1` (rs17070145), `BDNF` (rs6265)
- [ ] Intelligence Polygenic — `multiple loci from Savage et al. 2018`
- [ ] ADHD Traits (subclinical) — `SLC6A3`, `DRD4`, `SNAP25`
- [ ] Empathy / Social Cognition — `OXTR` (rs53576)
- [ ] Stress Resilience — `COMT`, `FKBP5`, `CRHR1`, `NPY`
- [ ] Risk-Taking Tendency — `DRD4` (7R), `MAOA`, `COMT`

#### Sleep
- [ ] Sleep Duration Genetic Need — `DEC2/BHLHE41` (rs121912617), `ADRB1`
- [ ] Narcolepsy Risk — `HLA-DQB1*06:02`
- [ ] Melatonin Sensitivity — `MTNR1B` (rs10830963)

#### Sensory (expand)
- [ ] Umami Taste Perception — `TAS1R1`, `TAS1R3`
- [ ] Spicy Food Tolerance — `TRPV1` (rs8065080)
- [ ] Sound Sensitivity / Hyperacusis — `CACNA1E`, `SLC17A8`
- [ ] Color Vision Deficiency — `OPN1LW`, `OPN1MW`
- [ ] Perfect Pitch — candidate loci (chr 8q)
- [ ] Smell Sensitivity (general) — `OR2J3`, `OR7D4`

#### Appearance (expand)
- [ ] Hair Color — `MC1R`, `HERC2/OCA2`, `SLC24A4`
- [ ] Hair Texture (curly/straight) — `TCHH` (rs11803731), `EDAR`
- [ ] Height Polygenic — `hundreds of loci`
- [ ] Skin Color — `SLC24A5` (rs1426654), `SLC45A2`, `HERC2`
- [ ] Cleft Chin — `multiple loci`
- [ ] Attached Earlobes — `EDAR`, multiple loci
- [ ] Red Hair — `MC1R` (rs1805007, rs1805008)
- [ ] Unibrow — `PAX3`

#### Nutrition (expand)
- [ ] Gluten Sensitivity (non-celiac) — `HLA-DQ2/DQ8`
- [ ] Alcohol Metabolism Speed — `ADH1B` (rs1229984), `ADH1C`
- [ ] Choline Needs — `PEMT` (rs12325817)
- [ ] Magnesium Absorption — `TRPM6`, `CNNM2`
- [ ] Protein Utilization Efficiency — `FTO`, `PPARG`

#### Behavioral
- [ ] Morning Person / Night Owl (genetic) — `PER2`, `CRY1`, `CLOCK`
- [ ] Empathy Level — `OXTR` (rs53576), `SLC6A4`
- [ ] Addictive Personality — `DRD2` (rs1800497), `ANKK1`, `OPRM1`
- [ ] Loneliness Susceptibility — `multiple GWAS loci`
- [ ] Creativity — `DRD4`, `COMT` (speculative)

#### Longevity
- [ ] Longevity Genetic Factors — `APOE` (rs429358), `FOXO3` (rs2802292), `TERT`
- [ ] Telomere Length — `TERT`, `TERC`, `OBFC1`

#### Immunity
- [ ] Common Cold Susceptibility — `IL28B`, `ORMDL3`
- [ ] Vaccine Response Variability — `HLA-DRB1`, `IL6`, `IRF7`
- [ ] Autoimmune Predisposition (general) — `PTPN22`, `CTLA4`, `HLA`

#### Reproductive
- [ ] Male Fertility / Sperm Quality — `DMRT1`, `TEX11`, `USP26`
- [ ] Female Fertility / Ovarian Reserve — `AMH`, `FSHR` (rs6166)
- [ ] Menopause Timing — `MCM8`, `BRSK1`, `multiple loci`
- [ ] Twin Pregnancy Likelihood — `FSHB` (rs11031006), `SMAD3`

---

## How to Contribute

### 1. Automated search (easiest)

```bash
cd mcp-server
ANTHROPIC_API_KEY=sk-... npm run research

> ozempic           # generates PGx study
> ADHD              # generates genetic risk
> nicotine dependence  # generates trait
```

### 2. Study from specific articles

Found an interesting paper? Paste the links:

```bash
> https://pubmed.ncbi.nlm.nih.gov/12345678/, https://pubmed.ncbi.nlm.nih.gov/87654321/
```

### 3. Batch generation

Generate all predefined targets at once:

```bash
# High priority only
ANTHROPIC_API_KEY=sk-... npm run generate-studies:high

# Everything
ANTHROPIC_API_KEY=sk-... npm run generate-studies
```

### 4. Contribution checklist

1. Run the CLI or batch
2. Review generated JSON under `data/`
3. Verify rsIDs are real (look up in dbSNP)
4. Verify PMID exists (look up in PubMed)
5. Open a PR!

---

## Notes

- Items marked `*expand*` already exist but can gain more SNPs/drugs
- rsIDs in parentheses are primary, not exhaustive
- Genes with `/` indicate variants at the same locus (e.g. `HBA1/HBA2`)
- Priority reflects: clinical evidence + dosing impact + disease prevalence
- Coverage goal: top 200 prescribed drugs + diseases with significant GWAS signal

---

## External Sources Analyzed

Commercial genetic reports already analyzed to extract candidate genes/SNPs for the catalog.
No personal patient data enters the repository — only genes, rsIDs, and bibliographic references.

### Pending upgrades to existing studies

| Existing study | What is missing | Reference source |
|----------------|----------------|-----------------|
| `cyp2d6_2009` | Variants *3, *5, *6, *10 (complete star-allele coverage per PharmGKB/CPIC) | PharmGKB, CPIC |
| `cyp2c19_2013` | rs4986893 (*3) + population_frequency | PharmGKB, CPIC |
| `slco1b1_2012` | population_frequency by ancestry | gnomAD |
| `vkorc1_2017` | population_frequency + odds_ratio in interpretations | CPIC guideline |
| `gipr_2010` | Companion study with rs2287019 (alternate GIPR variant) | Literature / GWAS |
| All studies | Standardize `contributor` field | — |
| All studies | Add `population_frequency` where missing | gnomAD/1000 Genomes |

### Xcode Life / Genome Panel

**Source:** Genome reports (PGx, Health, Nutrition, Fitness, Personality, Allergy, Skin, Carrier, MTHFR).
**Raw data:** 23andMe v5 (~617K SNPs).
**Note:** Template PDFs with Low/Med/High ranges; specific values require the original PDF.

Genes already extracted and cross-referenced with catalog. Main contributions: confirmation of MTHFR rs1801133, COMT rs4680, APOE haplotypes, full CYP panel. MTHFR and COMT studies already existed previously.

---

*Last updated: April 2026*  
*Generated with OpenPGx Research CLI; Xcode Life/Genome panel cross-check noted below.*
