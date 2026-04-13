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

| Type                    | Existing | Target | Progress        |
| ----------------------- | -------- | ------ | --------------- |
| PGx Studies (gene–drug) | 97       | 120+   | ████████░░ 81%  |
| Disease Risks           | 76       | 50+    | ██████████ 100% |
| Genetic Traits          | 71       | 60+    | ██████████ 100% |

---

## PGx Studies — Drugs & Genes

### High Priority

Studies with strong clinical evidence (CPIC Level A/B, PharmGKB Level 1/2). Direct impact on dosing.

#### ADHD

- [x] `SLC6A3` — methylphenidate, lisdexamfetamine, amphetamine (DAT1 VNTR, rs27072) _(added — source: Kooij 2008 + PharmGKB)_
- [x] `ADRA2A` — guanfacine, clonidine (rs1800544) _(added — source: Meta-analysis 2022, PMID 36325160)_
- [x] `CES1` — methylphenidate (rs71647871, rs2244613) _(added — source: Stage 2017, PMID 28087982)_
- [x] `DRD4` — methylphenidate, amphetamine (48bp VNTR, rs1800955) _(added — source: Myer 2017, PMID 28871191)_
- [x] `SNAP25` — methylphenidate (rs3746544) _(added — source: Myer 2017, PMID 28871191)_
- [x] `NET/SLC6A2` — atomoxetine (rs28386840, rs2242446) _(added — source: Ramoz 2009, PMID 19387424)_

#### Cannabis / Cannabidiol

- [x] `CYP3A4` — cannabidiol, dronabinol, nabilone (*1B, *22) _(added — source: Frontiers in Genetics 2021, PMID 34246200)_
- [x] `CNR1` — cannabidiol, dronabinol (rs1049353, rs806379) _(added — source: Drug Alcohol Depend 2009, PMID 19443135)_
- [x] `FAAH` — cannabidiol (rs324420 — Pro129Thr) _(added — source: Addiction Biology 2017, PMID 28150397)_
- [x] `ABCB1` — cannabidiol, dronabinol (rs1045642, rs2032582) _(added — PharmGKB + CPIC literature)_
- [x] `AKT1` — cannabis/THC psychosis risk (rs2494732) _(added — source: Biol Psychiatry 2012, PMID 22831980)_
- [ ] `COMT` — cannabis/THC psychosis interaction (rs4680 × cannabis) _(existing COMT studies cover rs4680 — expand with cannabis interaction)_
- [x] `CYP2C9` — THC metabolism (rs1799853, rs1057910) _(added — source: Clin Pharmacol Ther 2018, PMID 29386252)_

#### Antidepressants / SSRIs

- [x] `SLC6A4` — sertraline, escitalopram, fluoxetine, paroxetine, citalopram (5-HTTLPR, rs25531) _(added — source: Meta-analysis 2021, PMID 34889217)_
- [x] `HTR2A` — SSRIs (rs7997012, rs6311) _(added — source: Front Pharmacol 2020, PMID 33492430)_
- [x] `CYP2B6` — bupropion, ketamine, methadone (rs3745274 — _6) _(added — CPIC)\*
- [x] `FKBP5` — antidepressant response (rs1360780, rs9296158) _(added — source: J Psychopharmacol 2016, PMID 26645208)_
- [x] `GRIK4` — citalopram response (rs1954787) _(added — source: Am J Psychiatry 2007, PMID 17671280)_
- [x] `HTR1A` — SSRI response (rs6295 — C-1019G) _(added — source: PGx Genomics 2012, PMID 22890315)_
- [x] `ABCB1` — antidepressant CNS penetration (rs2032582, rs1045642) _(covered by ABCB1 study)_
- [x] `SLC6A2` — venlafaxine, duloxetine, nortriptyline (rs5569) _(added — source: Ramoz 2009, PMID 19387424 — covers atomoxetine + antidepressants)_

#### Pain / Opioids

- [x] `OPRM1` — morphine, oxycodone, fentanyl, naltrexone, buprenorphine (rs1799971 — A118G) _(existing — reward/food + applicable to pain)_
- [x] `CYP3A4` — fentanyl, methadone, buprenorphine, oxycodone (*1B, *22) _(added — covered by cyp3a4_2021_multidrug_metabolism.json)_
- [x] `ABCB1` — morphine, fentanyl, methadone (rs1045642 — C3435T) _(covered by ABCB1 study)_
- [ ] `COMT` — opioid dose requirement (rs4680 — Val158Met) _(existing COMT studies cover rs4680 — expand with opioid context)_
- [x] `MC1R` — anesthetic requirement, pain sensitivity (rs1805007, rs1805008) _(added — source: Anesthesiology 2004, PMID 15277922)_
- [x] `SCN9A` — pain sensitivity (rs6746030) _(added — source: PNAS 2010, PMID 20421589)_

#### GLP-1 / Weight (expand)

- [x] `MC4R` — semaglutide, tirzepatide, liraglutide (rs17782313) _(added — source: Nature Medicine 2025)_
- [x] `FTO` — semaglutide, tirzepatide, orlistat (rs9939609) _(added — Frayling 2007 et al.)_
- [x] `PCSK1` — semaglutide, liraglutide (rs6232, rs6235) _(added — source: BMC Med Genomics 2024)_
- [x] `GIPR` — tirzepatide (rs10423928) _(covered by gipr_2010_incretin_response.json)_
- [x] `TMEM18` — obesity drug response (rs6548238) _(added — source: BMC Med Genomics 2021)_

#### Anxiolytics / Benzodiazepines

- [x] `CYP3A4` — alprazolam, midazolam, triazolam, diazepam (*1B, *22) _(covered by cyp3a4_2021_multidrug_metabolism.json)_
- [x] `CYP2C19` — diazepam, clobazam (*2, *3, _17) _(added — source: CPIC 2020, PMID 32989530)\*
- [x] `GABRA2` — benzodiazepine response, dependence risk (rs279858) _(added — source: PMID 26250693)_
- [x] `GABRA6` — benzodiazepine sensitivity (rs3219151) _(added — source: PMID 25088614)_

#### Antipsychotics

- [x] `CYP2D6` — risperidone, aripiprazole, haloperidol, quetiapine (*3, *4, *5, *6, _41) _(covered by cyp2d6_2009_pharmgkb_summary.json)\*
- [x] `CYP1A2` — clozapine, olanzapine (rs762551 — _1F) _(covered by cyp1a2_2012_caffeine_clozapine.json)\*
- [x] `DRD2` — risperidone, haloperidol, aripiprazole (rs1800497 — Taq1A) _(added — Zhang 2010 et al.; PharmGKB)_
- [x] `DRD3` — clozapine response (rs6280 — Ser9Gly) _(added — source: PGx Journal 2022)_
- [x] `HTR2C` — antipsychotic weight gain (rs3813929) _(added — Sicard 2012 et al.)_
- [x] `MC4R` — antipsychotic weight gain (rs17782313) _(covered by mc4r_2023_glp1_response.json)_
- [x] `HLA-DQB1` — clozapine-induced agranulocytosis (HLA-DQB1*02:01) *(added — source: Nat Commun 2021)\*

#### Antiepileptics

- [x] `HLA-B` — carbamazepine, oxcarbazepine, phenytoin (_15:02 — SJS/TEN) _(added — source: FDA black-box warning, Thai study PMID 20345939)\*
- [x] `HLA-A` — carbamazepine (_31:01 — DRESS) _(existing — hla_a_2017_carbamazepine_dress.json)\*
- [x] `CYP2C9` — phenytoin, fosphenytoin (*2, *3) _(added — covered by cyp2c9_2017_thc_metabolism.json)_
- [x] `UGT1A4` — lamotrigine (rs2011425) _(added — source: PMID 25492569)_
- [x] `SCN1A` — carbamazepine, phenytoin response (rs3812718) _(added — source: PMID 24417206)_

#### Anticoagulants (DOACs)

- [x] `CES1` — dabigatran (rs71647871, rs2244613) _(covered by ces1_2017_methylphenidate_adhd.json — includes dabigatran)_
- [x] `ABCB1` — dabigatran, rivaroxaban, apixaban (rs1045642) _(covered by ABCB1 study)_
- [x] `CYP3A4` — rivaroxaban, apixaban (_22) _(covered by cyp3a4_2021_multidrug_metabolism.json)\*

#### Statins (expand)

- [x] `CYP3A4` — atorvastatin, simvastatin, lovastatin (_22) _(covered by cyp3a4_2021_multidrug_metabolism.json)\*
- [x] `ABCG2` — rosuvastatin, atorvastatin (rs2231142 — Q141K) _(existing — abcg2_2022_bcrp_transport.json)_
- [x] `HMGCR` — statin efficacy (rs17238540) _(added — source: GoDARTS, PMID 18815589)_
- [x] `LDLR` — statin response (rs6511720) _(existing — ldlr_2016_ldl_receptor.json)_
- [x] `PCSK9` — statin response, PCSK9 inhibitors (rs11591147) _(added — source: PGx Journal 2016, PMID 26804959)_

#### Cardiovascular (expand)

- [x] `CYP2D6` — metoprolol, carvedilol, propranolol, timolol _(covered by cyp2d6_2009_pharmgkb_summary.json + adrb1_2003)_
- [x] `ADRB1` — metoprolol, atenolol, bisoprolol (rs1801253 — Arg389Gly) _(added — source: PMID 22703382)_
- [x] `ADRB2` — salbutamol, salmeterol, formoterol (rs1042713 — Arg16Gly) _(added — source: PMID 27029682)_
- [x] `ACE` — ACE inhibitors (I/D polymorphism) _(added — source: PMID 15801945)_
- [x] `AGTR1` — losartan, valsartan (rs5186 — A1166C) _(added — source: PMID 35345577)_

#### Diabetes (expand)

- [x] `C11ORF65/ATM` — metformin response (rs11212617) _(added — Zhou 2011 Nat Genet)_
- [x] `SLC22A1` — metformin (rs628031, rs36056065 — OCT1) _(added — source: PMID 35905099)_
- [x] `SLC22A2` — metformin (rs316019 — OCT2) _(added — source: PMID 30733798)_
- [x] `CYP2C9` — glimepiride, glipizide (*2, *3) _(covered by cyp2c9_2017_thc_metabolism.json)_
- [x] `TCF7L2` — metformin, sulfonylureas response (rs7903146) _(added — source: PMID 29326107)_

#### Oncology (expand)

- [x] `UGT1A1` — irinotecan (_28 — Gilbert) _(added — source: NCBI Bookshelf)\*
- [x] `CYP2D6` — tamoxifen → endoxifen _(covered by cyp2d6_2009_pharmgkb_summary.json)_
- [x] `BRCA1/BRCA2` — olaparib, talazoparib (PARP inhibitors) _(added — source: brca2_2015_parp_inhibitor.json + brca1_2003_ovarian_cancer.json)_
- [x] `EGFR` — gefitinib, erlotinib, osimertinib (L858R, exon 19 del) _(added — source: egfr_2009_tki_lung_cancer.json)_
- [x] `ALK` — crizotinib, alectinib (EML4-ALK fusion) _(added — source: alk_2010_fusion_targeted.json)_
- [x] `BRAF` — vemurafenib, dabrafenib (V600E) _(added — source: braf_2010_v600e_targeted.json)_
- [x] `PD-L1/TMB` — pembrolizumab, nivolumab (checkpoint inhibitors) _(added — source: cd274_2015_checkpoint_immunotherapy.json)_
- [x] `RAS/KRAS` — cetuximab, panitumumab (G12/G13 mutations) _(added — source: kras_2008_anti_egfr_resistance.json)_

#### Immunosuppressants (expand)

- [x] `UGT1A9` — mycophenolate (rs72551330, rs2741049) _(added — source: PMID 15258099)_
- [x] `CYP3A4` — cyclosporine (_22) _(covered by cyp3a4_2021_multidrug_metabolism.json)\*
- [ ] `IMPDH1/2` — mycophenolate (rs2278294)

#### Proton Pump Inhibitors

- [x] `CYP2C19` — omeprazole, lansoprazole, pantoprazole, esomeprazole (*2, *3, _17) _(added — covered by cyp2c19_2022_ppi_benzo_voriconazole.json)\*

#### Antifungals

- [x] `CYP2C19` — voriconazole (*2, *3, _17) _(covered by cyp2c19_2022_ppi_benzo_voriconazole.json)\*

#### HIV

- [x] `HLA-B` — abacavir (_57:01) _(existing)\*
- [x] `CYP2B6` — efavirenz (rs3745274 — _6) _(added — CPIC 2019)\*
- [x] `UGT1A1` — atazanavir (_28) _(covered by ugt1a1_2004_irinotecan_atazanavir.json)\*

#### Gout

- [x] `HLA-B` — allopurinol (_58:01 — SJS/TEN) _(added — source: hla_b_2005_allopurinol_sjsten.json)\*
- [x] `ABCG2` — allopurinol, febuxostat (rs2231142) _(covered by abcg2_2022_bcrp_transport.json)_

#### Tuberculosis

- [x] `NAT2` — isoniazid (slow/fast acetylator — multiple SNPs) _(added — source: PMID nat2_2008)_
- [x] `CYP2E1` — isoniazid hepatotoxicity (rs2031920) _(added — source: PMID 12668988)_

#### Anesthesia

- [x] `BCHE/BChE` — succinylcholine, mivacurium (atypical variants) _(added — source: Mol Genet Genomic Med 2020, PMID 33061533)_
- [x] `RYR1` — anesthetics (malignant hyperthermia — rs121918592) _(added — source: Sci Rep 2016, PMID 27857962)_
- [x] `CYP2D6` — tramadol, codeine (perioperative) _(covered by cyp2d6_2009_pharmgkb_summary.json)_

---

### Medium Priority

Studies with moderate evidence. Useful but not sufficient alone to change clinical practice.

#### Supplements / Nutraceuticals

- [x] `CYP1A2` — caffeine (rs762551) _(covered by cyp1a2_2012_caffeine_clozapine.json)_
- [x] `VDR` — vitamin D (rs2228570, rs1544410) _(covered by vdr_2011_vitamin_d_receptor.json)_
- [x] `MTHFR` — folate, B12 (rs1801133) _(covered by mthfr_2005_chd_meta_analysis.json)_
- [x] `FADS1/FADS2` — omega-3, omega-6 (rs174537) _(covered by fads1_2019_omega3_desaturase.json)_
- [x] `GC/VDBP` — vitamin D absorption (rs2282679) _(added — source: gc_2010_vitamin_d_binding.json)_
- [x] `FUT2` — vitamin B12 (rs601338) _(covered by fut2_2009_b12_secretor.json)_
- [x] `SLC23A1` — vitamin C absorption (rs33972313) _(covered by slc23a1_2010_vitamin_c.json)_
- [x] `NBPF3` — vitamin B6 metabolism (rs4654748) _(added — source: PMID 19303062)_
- [x] `TCN2` — vitamin B12 transport (rs1801198) _(added — source: tcn2_2003_vitamin_b12_transport.json)_
- [x] `BCMO1` — beta-carotene (rs12934922, rs7501331) _(covered by bcmo1_2009_beta_carotene.json)_

#### Hormones

- [x] `CYP1A2` — estradiol, caffeine–estrogen interaction _(covered by cyp1a2_2012_caffeine_clozapine.json)_
- [x] `CYP3A4` — testosterone, oral contraceptives _(covered by cyp3a4_2021_multidrug_metabolism.json)_
- [ ] `COMT` — estrogen metabolism, catechol estrogens (rs4680) _(existing COMT studies — expand with estrogen context)_
- [x] `SHBG` — testosterone, estradiol levels (rs6258) _(added — source: shbg_2012_hormone_binding.json)_
- [x] `ESR1` — estrogen receptor, tamoxifen (rs2234693) _(added — source: esr1_2007_estrogen_receptor.json)_
- [ ] `AR` — testosterone therapy (CAG repeat)

#### Dermatology

- [x] `HLA-C` — psoriasis biologics (HLA-C*06:02) *(added — source: hla_c_2010_psoriasis_biologics.json)\*
- [x] `IL23R` — ustekinumab response (rs11209026) _(added — source: il23r_2007_ustekinumab_response.json)_
- [ ] `CARD14` — psoriasis severity (rs11652075)

---

## Disease Risks

### Missing (planned but not yet generated)

#### Neuropsychiatric

- [x] Major Depressive Disorder (F32) — `SLC6A4`, `FKBP5`, `BDNF` _(added — source: bdnf_2019_depression_risk.json)_
- [x] Generalized Anxiety Disorder (F41.1) — `SLC6A4`, `CRHR1`, `MAOA` _(added — source: crhr1_2012_anxiety_stress.json)_
- [x] Bipolar Disorder (F31) — `CACNA1C`, `ANK3`, `ODZ4` _(added — source: cacna1c_2013_bipolar_risk.json)_
- [x] Schizophrenia (F20) — `COMT`, `DRD2`, `DISC1`, `C4A` _(added — source: c4a_2016_schizophrenia_risk.json)_
- [x] Chronic Pain Susceptibility (G89) — `COMT`, `OPRM1`, `SCN9A` _(added — source: comt_2006_pain_susceptibility.json)_

#### Metabolic

- [x] Obesity (E66) — `FTO`, `MC4R`, `TMEM18`, `GNPDA2` _(added — source: gnpda2_2009_obesity_risk.json)_
- [x] Non-Alcoholic Fatty Liver Disease (K76.0) — `PNPLA3`, `TM6SF2`, `MBOAT7` _(added — source: pnpla3_2008_nafld_risk.json)_
- [x] Chronic Kidney Disease (N18) — `APOL1`, `UMOD`, `SHROOM3` _(added — source: apol1_2010_kidney_disease.json)_

#### Neurological

- [x] Migraine (G43) — `CALCA`, `TRPM8`, `MTHFR`, `LRP1` _(added — source: trpm8_2010_migraine_risk.json)_

#### GI / Autoimmune

- [x] Inflammatory Bowel Disease (K50/K51) — `NOD2`, `IL23R`, `ATG16L1` _(added — source: nod2_2001_ibd_crohns.json)_

#### Cardiovascular

- [x] Hypertension (I10) — `AGT`, `ACE`, `ADD1`, `CYP11B2` _(added — source: agt_2003_hypertension_risk.json)_

### New diseases (not yet planned)

#### Neuropsychiatric

- [x] Autism Spectrum Disorder (F84) — `SHANK3`, `NLGN3`, `CNTNAP2` _(added — source: cntnap2_2008_autism_risk.json)_
- [x] PTSD susceptibility (F43.1) — `FKBP5`, `CRHR1`, `ADCYAP1R1` _(added — source: adcyap1r1_2011_ptsd_risk.json)_
- [x] OCD (F42) — `SLC6A4`, `SLC1A1`, `DLGAP1` _(added — source: slc1a1_2006_ocd.json + slc6a4_2021)_
- [x] Insomnia (G47.0) — `PER2`, `CLOCK`, `MEIS1` _(added — source: meis1_2017_insomnia_rls.json)_
- [x] Restless Legs Syndrome (G25.8) — `BTBD9`, `MEIS1`, `MAP2K5` _(partially covered by meis1_2017_insomnia_rls.json)_
- [x] Epilepsy (G40) — `SCN1A`, `SCN2A`, `KCNQ2` _(added — source: scn1a_2014_epilepsy_risk.json)_
- [x] Multiple Sclerosis (G35) — `HLA-DRB1`, `IL7R`, `IL2RA` _(added — source: hla_drb1_2011_multiple_sclerosis.json)_

#### Metabolic

- [x] Hypothyroidism (E03) — `FOXE1`, `TPO`, `TSHR` _(added — source: tpo_2012_hypothyroidism.json)_
- [x] Hyperthyroidism/Graves (E05) — `HLA-DRB1`, `CTLA4`, `TSHR` _(added — source: tshr_2009_graves_disease.json)_
- [x] Polycystic Ovary Syndrome (E28.2) — `DENND1A`, `THADA`, `FSHR` _(added — source: dennd1a_2012_pcos.json)_
- [x] Metabolic Syndrome — `FTO`, `TCF7L2`, `PPARG` _(covered by fto_2007 + tcf7l2_2006 + pparg_2020)_
- [x] Lactose Intolerance (E73) — `MCM6/LCT` (rs4988235) _(added — source: mcm6_2002_lactose_intolerance.json)_
- [x] Phenylketonuria (E70.0) — `PAH` _(added — source: pah_2000_phenylketonuria.json)_
- [x] Wilson Disease (E83.0) — `ATP7B` _(added — source: atp7b_2005_wilson_disease.json)_

#### Cardiovascular

- [x] Stroke (I63/I64) — `HDAC9`, `PITX2`, `ZFHX3` _(added — source: pitx2_2007_stroke_risk.json)_
- [x] Aortic Aneurysm (I71) — `FBN1`, `ACTA2`, `MYH11` _(added — source: fbn1_2011_aortic_aneurysm.json)_
- [x] Peripheral Artery Disease (I73.9) — `CHRNA3`, `9p21` _(added — source: chrna3_2008_pad_risk.json)_
- [x] Long QT Syndrome (I45.8) — `KCNQ1`, `KCNH2`, `SCN5A` _(added — source: kcnh2_2004_long_qt.json)_
- [x] Cardiomyopathy (I42) — `TTN`, `LMNA`, `MYH7` _(added — source: ttn_2012_cardiomyopathy.json)_

#### Oncology

- [x] Lung Cancer (C34) — `CHRNA5`, `TERT`, `EGFR` _(added — source: chrna5_2008_lung_cancer_risk.json + egfr_2009)_
- [x] Pancreatic Cancer (C25) — `CFTR`, `BRCA2`, `ABO` _(added — source: abo_2009_pancreatic_cancer.json + brca2_2015)_
- [x] Thyroid Cancer (C73) — `FOXE1`, `NKX2-1`, `BRAF` _(added — source: foxe1_2009_thyroid_cancer.json + braf_2010)_
- [x] Bladder Cancer (C67) — `NAT2`, `GSTM1`, `TP63` _(added — source: nat2_2005_bladder_cancer.json)_
- [x] Kidney Cancer (C64) — `VHL`, `BAP1`, `PBRM1` _(added — source: vhl_2000_kidney_cancer.json)_
- [x] Leukemia/Lymphoma (C91-C96) — `ARID5B`, `IKZF1`, `CDKN2A` _(added — source: arid5b_2009_leukemia_risk.json)_
- [x] Gastric Cancer (C16) — `CDH1`, `PSCA`, `MUC1` _(added — source: cdh1_2010_gastric_cancer.json)_
- [x] Cervical Cancer (C53) — `HLA-DRB1`, `MICA` _(added — source: hla_drb1_2007_cervical_cancer.json)_
- [x] Ovarian Cancer (C56) — `BRCA1`, `BRCA2`, `RAD51C` _(added — source: brca1_2003_ovarian_cancer.json + brca2_2015)_
- [x] Testicular Cancer (C62) — `KITLG`, `DMRT1`, `TERT` _(added — source: kitlg_2009_testicular_cancer.json)_
- [x] Brain Tumors / Glioma (C71) — `TERT`, `CDKN2B`, `TP53` _(added — source: tert_2013_glioma_risk.json)_

#### Autoimmune / Inflammatory

- [x] Type 1 Diabetes (E10) — `HLA-DRB1`, `INS`, `PTPN22` _(added — source: ptpn22_2004_type1_diabetes.json)_
- [x] Crohn's Disease (K50) — `NOD2`, `ATG16L1`, `IL23R` _(covered by nod2_2001_ibd_crohns.json + il23r_2007)_
- [x] Ulcerative Colitis (K51) — `IL23R`, `HLA-DRB1`, `ECM1` _(covered by il23r_2007 + hla_drb1_2011)_
- [x] Ankylosing Spondylitis (M45) — `HLA-B*27`, `ERAP1`, `IL23R` _(added — source: hla_b_2010_ankylosing_spondylitis.json)_
- [x] Sjogren's Syndrome (M35.0) — `HLA-DRB1`, `IRF5`, `STAT4` _(added — source: irf5_2005_sjogrens.json)_
- [x] Hashimoto's Thyroiditis (E06.3) — `HLA-DRB1`, `CTLA4`, `PTPN22` _(covered by ptpn22_2004 + hla_drb1_2011)_
- [x] Vitiligo (L80) — `TYR`, `HLA-A`, `NLRP1` _(added — source: tyr_2010_vitiligo.json)_

#### Respiratory

- [x] COPD (J44) — `SERPINA1` (alpha-1 antitrypsin), `HHIP`, `FAM13A` _(added — source: serpina1_2006_copd_a1at.json)_
- [x] Pulmonary Fibrosis (J84.1) — `MUC5B`, `TERT`, `TERC` _(added — source: muc5b_2011_pulmonary_fibrosis.json)_

#### Musculoskeletal

- [x] Ankylosing Spondylitis (M45) — `HLA-B27` _(covered by hla_b_2010_ankylosing_spondylitis.json)_
- [x] Fibromyalgia (M79.7) — `COMT`, `SLC6A4`, `5-HT2A` _(covered by comt_2006_pain_susceptibility.json + slc6a4_2021 + htr2a_2020)_

#### Ophthalmologic

- [x] Glaucoma (H40) — `MYOC`, `CAV1`, `TMCO1` _(added — source: myoc_2002_glaucoma.json)_

#### Renal

- [ ] IgA Nephropathy (N02) — `HLA-DRB1`, `CFHR5`, `DEFA`
- [ ] Polycystic Kidney Disease (Q61) — `PKD1`, `PKD2`

#### Hematologic

- [x] Sickle Cell Disease (D57) — `HBB` (rs334) _(added — source: hbb_2010_sickle_cell.json)_
- [ ] Thalassemia (D56) — `HBA1/HBA2`, `HBB`
- [x] G6PD Deficiency (D55.0) — `G6PD` _(added — source: g6pd_2012_enzyme_deficiency.json)_
- [ ] Hemophilia A/B — `F8`, `F9`

#### Dermatologic

- [x] Eczema / Atopic Dermatitis (L20) — `FLG`, `IL4R`, `IL13` _(added — source: flg_2006_atopic_dermatitis.json)_
- [x] Alopecia Areata (L63) — `HLA-DRB1`, `CTLA4`, `IL2RA` _(added — source: il2ra_2007_alopecia_areata.json)_

---

## Traits — Genetic Characteristics

### Missing (planned but not yet generated)

#### Drug Sensitivity

- [x] Nicotine Dependence — `CHRNA5` (rs16969968), `CHRNA3`, `CYP2A6` _(added — source: chrna5_2008_nicotine_dependence.json)_
- [x] Opioid Sensitivity — `OPRM1` (rs1799971), `COMT`, `CYP2D6` _(covered by oprm1_cpic_opioids.json + comt_2006_pain_susceptibility.json)_
- [x] Cannabis Sensitivity — `CNR1` (rs1049353), `AKT1` (rs2494732), `COMT` _(covered by cnr1_2012_cannabinoid_response.json + akt1_2012_cannabis_psychosis.json)_
- [x] Alcohol Dependence Risk — `ADH1B` (rs1229984), `ALDH2` (rs671), `GABRA2` _(covered by existing adh1b + aldh2 studies)_
- [x] Statin Muscle Side Effects — `SLCO1B1` (rs4149056), `LILRB5` _(added — source: lilrb5_2013_statin_myalgia.json + existing slco1b1)_
- [x] Metformin GI Tolerance — `SLC22A1` (rs628031), `OCT1` _(covered by slc22a1_2011_metformin_oct1.json)_
- [x] Warfarin Sensitivity — `VKORC1` (rs9923231), `CYP2C9` _(covered by existing vkorc1 + cyp2c9 studies)_
- [x] Antidepressant Response Speed — `SLC6A4` (5-HTTLPR), `FKBP5`, `BDNF` _(covered by slc6a4_2021_ssri_response.json + fkbp5_2016 + bdnf_2019)_
- [x] Pain Threshold — `SCN9A` (rs6746030), `COMT` (rs4680), `OPRM1` _(added — source: trpv1_2012_pain_threshold.json + existing scn9a + comt)_
- [x] Vitamin D Absorption Efficiency — `GC` (rs2282679), `DHCR7`, `CYP2R1` _(added — source: cyp2r1_2010_vitamin_d_metabolism.json + existing gc + dhcr7)_

### New traits (not yet planned)

#### Metabolism

- [x] Iron Absorption Efficiency — `HFE` (C282Y, H63D), `TFR2` _(added — source: hfe_1996_iron_metabolism.json)_
- [x] Folate Metabolism Efficiency — `MTHFR` (rs1801133), `MTR`, `MTRR` _(added — source: mtr_2005_folate_b12.json + existing mthfr)_
- [ ] Copper Metabolism — `ATP7B` (rs1801243)
- [ ] Selenium Status — `SEPP1`, `GPX1`
- [ ] Zinc Absorption — `SLC30A8`, `SLC39A4`

#### Fitness / Performance

- [x] Sprint vs Endurance Genetic Potential — `ACTN3` (rs1815739 — R577X) _(added — source: actn3_2003_muscle_performance.json)_
- [x] Injury Recovery Speed — `COL1A1` (rs1800012), `GDF5` _(added — source: col1a1_2015_injury_risk.json)_
- [x] Altitude Adaptation — `EPAS1`, `EGLN1` _(added — source: epas1_2010_altitude_adaptation.json)_
- [x] Muscle Recovery — `IL6` (rs1800795), `TNF` _(added — source: il6_2005_muscle_recovery.json)_
- [ ] Flexibility / Joint Hypermobility — `COL5A1`, `TNXB`
- [ ] Sweat Rate / Electrolyte Loss — `CFTR`, `SCNN1A`

#### Cognitive

- [x] Memory Performance — `KIBRA/WWC1` (rs17070145), `BDNF` (rs6265) _(added — source: wwc1_2006_memory_performance.json + bdnf_2019)_
- [ ] Intelligence Polygenic — `multiple loci from Savage et al. 2018`
- [x] ADHD Traits (subclinical) — `SLC6A3`, `DRD4`, `SNAP25` _(covered by slc6a3_2008 + drd4_2017 + snap25_2017)_
- [x] Empathy / Social Cognition — `OXTR` (rs53576) _(added — source: oxtr_2012_social_cognition.json)_
- [x] Stress Resilience — `COMT`, `FKBP5`, `CRHR1`, `NPY` _(covered by comt_2003/2006 + fkbp5_2016 + crhr1_2012)_
- [x] Risk-Taking Tendency — `DRD4` (7R), `MAOA`, `COMT` _(added — source: drd4_2007_risk_taking.json + comt_2003)_

#### Sleep

- [x] Sleep Duration Genetic Need — `DEC2/BHLHE41` (rs121912617), `ADRB1` _(added — source: adrb1_2019_short_sleep.json)_
- [ ] Narcolepsy Risk — `HLA-DQB1*06:02`
- [x] Melatonin Sensitivity — `MTNR1B` (rs10830963) _(covered by mtnr1b_2009_melatonin_glucose.json)_

#### Sensory (expand)

- [ ] Umami Taste Perception — `TAS1R1`, `TAS1R3`
- [x] Spicy Food Tolerance — `TRPV1` (rs8065080) _(added — source: trpv1_2012_pain_threshold.json)_
- [ ] Sound Sensitivity / Hyperacusis — `CACNA1E`, `SLC17A8`
- [ ] Color Vision Deficiency — `OPN1LW`, `OPN1MW`
- [ ] Perfect Pitch — candidate loci (chr 8q)
- [ ] Smell Sensitivity (general) — `OR2J3`, `OR7D4`

#### Appearance (expand)

- [x] Hair Color — `MC1R`, `HERC2/OCA2`, `SLC24A4` _(added — source: herc2_2008_eye_color.json + mc1r_2000)_
- [x] Hair Texture (curly/straight) — `TCHH` (rs11803731), `EDAR` _(added — source: tchh_2009_hair_texture.json + edar_2008)_
- [ ] Height Polygenic — `hundreds of loci`
- [x] Skin Color — `SLC24A5` (rs1426654), `SLC45A2`, `HERC2` _(added — source: slc24a5_2005_skin_pigmentation.json + herc2_2008)_
- [ ] Cleft Chin — `multiple loci`
- [ ] Attached Earlobes — `EDAR`, multiple loci
- [x] Red Hair — `MC1R` (rs1805007, rs1805008) _(added — source: mc1r_2000_red_hair.json)_
- [ ] Unibrow — `PAX3`

#### Nutrition (expand)

- [x] Gluten Sensitivity (non-celiac) — `HLA-DQ2/DQ8` _(added — source: hla_dqa1_2003_celiac_disease.json)_
- [x] Alcohol Metabolism Speed — `ADH1B` (rs1229984), `ADH1C` _(added — source: adh1b_2009_alcohol_metabolism.json)_
- [x] Choline Needs — `PEMT` (rs12325817) _(added — source: pemt_2012_choline_needs.json)_
- [x] Magnesium Absorption — `TRPM6`, `CNNM2` _(added — source: trpm6_2009_magnesium_absorption.json)_
- [x] Protein Utilization Efficiency — `FTO`, `PPARG` _(covered by fto_2007 + pparg_2020)_

#### Behavioral

- [x] Morning Person / Night Owl (genetic) — `PER2`, `CRY1`, `CLOCK` _(added — source: per2_2017_chronotype.json + existing clock study)_
- [x] Empathy Level — `OXTR` (rs53576), `SLC6A4` _(covered by oxtr_2012_social_cognition.json + slc6a4_2021)_
- [x] Addictive Personality — `DRD2` (rs1800497), `ANKK1`, `OPRM1` _(covered by drd2_2016 + oprm1_2011)_
- [ ] Loneliness Susceptibility — `multiple GWAS loci`
- [x] Creativity — `DRD4`, `COMT` (speculative) _(covered by drd4_2007_risk_taking.json + comt_2003)_

#### Longevity

- [x] Longevity Genetic Factors — `APOE` (rs429358), `FOXO3` (rs2802292), `TERT` _(added — source: foxo3_2008_longevity.json + tert_2011_telomere_length.json + existing apoe)_
- [x] Telomere Length — `TERT`, `TERC`, `OBFC1` _(added — source: tert_2011_telomere_length.json)_

#### Immunity

- [x] Common Cold Susceptibility — `IL28B`, `ORMDL3` _(added — source: il28b_2009_cold_susceptibility.json)_
- [x] Vaccine Response Variability — `HLA-DRB1`, `IL6`, `IRF7` _(covered by hla_drb1_2011 + il6_2005 + irf5_2005)_
- [x] Autoimmune Predisposition (general) — `PTPN22`, `CTLA4`, `HLA` _(covered by ptpn22_2004 + multiple HLA files)_

#### Reproductive

- [ ] Male Fertility / Sperm Quality — `DMRT1`, `TEX11`, `USP26`
- [x] Female Fertility / Ovarian Reserve — `AMH`, `FSHR` (rs6166) _(added — source: amh_2016_ovarian_reserve.json)_
- [ ] Menopause Timing — `MCM8`, `BRSK1`, `multiple loci`
- [x] Twin Pregnancy Likelihood — `FSHB` (rs11031006), `SMAD3` _(added — source: fshb_2016_twin_pregnancy.json)_

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

| Existing study | What is missing                                                            | Reference source    |
| -------------- | -------------------------------------------------------------------------- | ------------------- |
| `cyp2d6_2009`  | Variants *3, *5, *6, *10 (complete star-allele coverage per PharmGKB/CPIC) | PharmGKB, CPIC      |
| `cyp2c19_2013` | rs4986893 (\*3) + population_frequency                                     | PharmGKB, CPIC      |
| `slco1b1_2012` | population_frequency by ancestry                                           | gnomAD              |
| `vkorc1_2017`  | population_frequency + odds_ratio in interpretations                       | CPIC guideline      |
| `gipr_2010`    | Companion study with rs2287019 (alternate GIPR variant)                    | Literature / GWAS   |
| All studies    | Standardize `contributor` field                                            | —                   |
| All studies    | Add `population_frequency` where missing                                   | gnomAD/1000 Genomes |

### Xcode Life / Genome Panel

**Source:** Genome reports (PGx, Health, Nutrition, Fitness, Personality, Allergy, Skin, Carrier, MTHFR).
**Raw data:** 23andMe v5 (~617K SNPs).
**Note:** Template PDFs with Low/Med/High ranges; specific values require the original PDF.

Genes already extracted and cross-referenced with catalog. Main contributions: confirmation of MTHFR rs1801133, COMT rs4680, APOE haplotypes, full CYP panel. MTHFR and COMT studies already existed previously.

---

_Last updated: April 12, 2026 — 51 new studies added in batch (TDAH, Cannabis, Antidepressants, Pain/Anesthesia, GLP-1, Antipsychotics, Antiepileptics, Benzos/PPI, Statins, CV, Diabetes, Immunosuppressants, TB, Supplements, Hormones, Dermatology)_  
_Generated with OpenPGx Research CLI; Xcode Life/Genome panel cross-check noted below._
