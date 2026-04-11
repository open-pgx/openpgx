/**
 * OpenPGx — Trait Catalog
 *
 * Loads trait metadata from data/traits/*.json and attaches
 * phenotype inference functions defined in TypeScript.
 *
 * Architecture: JSON files contain SNP definitions, studies, and metadata.
 * Phenotype functions (which can't be serialized to JSON) live here in TS.
 * The two are merged at load time by matching on trait name.
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { TraitDefinition, TraitPhenotypeFn, TraitJsonFile } from "./types.js";

// === Resolve data directory ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TRAIT_DATA_DIR = join(__dirname, "..", "data", "traits");

// ============================================================
// PHENOTYPE FUNCTIONS — keyed by trait name
// ============================================================
// These are TypeScript functions that interpret genotypes into
// human-readable phenotypes. They can't live in JSON.
// ============================================================

const PHENOTYPE_FUNCTIONS: Record<string, TraitPhenotypeFn> = {

  "Caffeine Metabolism": (g) => {
    const v = g["rs762551"] ?? "";
    if (v === "AA") return { phenotype: "Fast Metabolizer", description: "You metabolize caffeine quickly. A coffee at 3pm is mostly cleared by evening.", advice: "You can tolerate caffeine later in the day. Enjoy your coffee, but moderation is still wise." };
    if (v === "AC" || v === "CA") return { phenotype: "Slow Metabolizer", description: "You metabolize caffeine more slowly. A cup at 3pm may still affect your sleep at midnight.", advice: "Limit caffeine after early afternoon. You may be more sensitive to caffeine's effects on blood pressure and sleep." };
    if (v === "CC") return { phenotype: "Very Slow Metabolizer", description: "You metabolize caffeine very slowly. Even morning coffee may linger into the evening.", advice: "Be cautious with caffeine intake. Consider limiting to 1-2 cups before noon." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient for prediction.", advice: "Standard caffeine guidelines apply." };
  },

  "Alcohol Flush Reaction": (g) => {
    const v = g["rs671"] ?? "";
    if (v === "GG") return { phenotype: "No Flush (Normal Metabolism)", description: "You have fully functional ALDH2 enzyme. No flush reaction to alcohol.", advice: "Normal alcohol metabolism, but this does NOT mean alcohol is safe in excess. Standard health guidelines apply." };
    if (v === "AG" || v === "GA") return { phenotype: "Flush Reaction (Heterozygous)", description: "You have one copy of the ALDH2*2 variant. You likely experience facial flushing and discomfort with alcohol.", advice: "You metabolize acetaldehyde slowly (a carcinogen). Alcohol increases your esophageal cancer risk significantly. Consider minimizing or avoiding alcohol." };
    if (v === "AA") return { phenotype: "Strong Flush (Homozygous)", description: "You have two copies of ALDH2*2. You likely cannot tolerate alcohol at all.", advice: "Alcohol is strongly contraindicated. Even small amounts cause severe flushing, nausea. Significantly elevated esophageal cancer risk." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient for prediction.", advice: "Standard alcohol guidelines apply." };
  },

  "Lactose Tolerance": (g) => {
    const v = g["rs4988235"] ?? "";
    if (v === "TT" || v === "AA") return { phenotype: "Lactose Tolerant (Persistent)", description: "You carry two copies of the lactase persistence allele. You almost certainly digest dairy well.", advice: "Dairy should be well tolerated. No need to avoid lactose." };
    if (v === "CT" || v === "TC" || v === "AG" || v === "GA") return { phenotype: "Lactose Tolerant (Carrier)", description: "You carry one copy of the lactase persistence allele. Most adults with this genotype digest dairy without issues.", advice: "Dairy should generally be tolerated. Some may notice mild issues with large amounts." };
    if (v === "CC" || v === "GG") return { phenotype: "Likely Lactose Intolerant", description: "You do not carry the lactase persistence allele. You may lose ability to digest lactose in adulthood.", advice: "You may benefit from lactose-free dairy or lactase supplements. Fermented dairy (yogurt, aged cheese) is often better tolerated." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient for prediction.", advice: "If you have dairy discomfort, try lactose-free alternatives." };
  },

  "Bitter Taste Perception": (g) => {
    const v1 = g["rs713598"] ?? "";
    if (v1 === "CC") return { phenotype: "Super Taster", description: "You have heightened sensitivity to bitter compounds (PTC/PROP) found in cruciferous vegetables, grapefruit, and dark chocolate.", advice: "You may dislike broccoli, kale, Brussels sprouts raw. Cooking methods (roasting, adding fat/salt) reduce bitterness and make them palatable." };
    if (v1 === "CG" || v1 === "GC") return { phenotype: "Medium Taster", description: "You have intermediate sensitivity to bitter compounds.", advice: "You may find some vegetables mildly bitter but not intolerable. Cooking reduces bitterness." };
    if (v1 === "GG") return { phenotype: "Non-Taster", description: "You have low sensitivity to PTC/PROP bitter compounds.", advice: "You likely enjoy bitter vegetables easily. This may also mean less aversion to bitter medications." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient for prediction.", advice: "Taste preferences vary — experiment with preparation methods." };
  },

  "Cilantro / Coriander Preference": (g) => {
    const v = g["rs72921001"] ?? "";
    if (v === "AA") return { phenotype: "Likely Soapy Taste", description: "You carry two copies of the variant linked to perceiving cilantro as soapy.", advice: "If cilantro tastes soapy to you, it's genetic! Try substituting with parsley or basil." };
    if (v === "AC" || v === "CA") return { phenotype: "Mild Soapy Tendency", description: "You carry one copy. You may have mild sensitivity to cilantro's soapy aldehydes.", advice: "You might notice a slight soapy note but may still enjoy cilantro overall." };
    if (v === "CC") return { phenotype: "Normal Cilantro Taste", description: "You don't carry the soapy-taste variant. Cilantro likely tastes fresh and herbal to you.", advice: "Enjoy cilantro freely — your genetics don't work against you here." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Your cilantro preference is partly genetic." };
  },

  "Muscle Composition (Power vs Endurance)": (g) => {
    const v = g["rs1815739"] ?? "";
    if (v === "CC") return { phenotype: "Power-Oriented (R/R)", description: "You have two functional copies of α-actinin-3. Your muscles are optimized for explosive power and sprint activities.", advice: "You may excel in power sports (sprinting, jumping, weightlifting). Include explosive training in your routine." };
    if (v === "CT" || v === "TC") return { phenotype: "Mixed (Power/Endurance)", description: "You have one functional copy of α-actinin-3. Balanced between power and endurance capabilities.", advice: "You can benefit from both strength training and endurance work. Good genetic versatility for varied training." };
    if (v === "TT") return { phenotype: "Endurance-Oriented (X/X)", description: "You lack α-actinin-3 in fast-twitch fibers. Your muscles may favor endurance over explosive power.", advice: "You may have a natural edge in endurance sports (marathon, cycling, swimming). Focus on aerobic training, but don't neglect strength work." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient for prediction.", advice: "A balanced training approach works for everyone regardless of genetics." };
  },

  "Circadian Rhythm / Chronotype": (g) => {
    const per2 = g["rs12927162"] ?? "";
    const clock = g["rs1801260"] ?? "";
    let morningScore = 0;
    if (per2 === "AA") morningScore += 2;
    else if (per2 === "AG" || per2 === "GA") morningScore += 1;
    if (clock === "AA") morningScore += 2;
    else if (clock === "AG" || clock === "GA") morningScore += 1;

    if (morningScore >= 3) return { phenotype: "Morning Person (Lark)", description: "Your genetic markers suggest a morning chronotype. You likely feel most alert and productive in the morning.", advice: "Schedule important tasks for morning hours. Respect your natural rhythm — forcing late nights may reduce your performance." };
    if (morningScore <= 1) return { phenotype: "Evening Person (Owl)", description: "Your genetic markers suggest an evening chronotype. You likely feel most alert and creative later in the day.", advice: "If possible, schedule creative/demanding work for afternoon/evening. Consistent sleep schedule matters more than early wake-up." };
    return { phenotype: "Intermediate Chronotype", description: "Your genetic markers suggest a balanced chronotype — neither strongly morning nor evening oriented.", advice: "You likely have flexibility in sleep timing. Consistent sleep/wake schedule is more important than which hours you choose." };
  },

  "Sun Sensitivity / Skin Type": (g) => {
    const v1 = g["rs1805007"] ?? "";
    const v2 = g["rs1805008"] ?? "";
    const riskAlleles = [v1, v2].filter(v => v.includes("T")).length;
    if (riskAlleles >= 2) return { phenotype: "Very Sun Sensitive", description: "You carry multiple MC1R variants associated with fair skin, freckling, and high UV sensitivity.", advice: "SPF 50+ daily is essential. You burn easily and have higher melanoma risk. Regular skin checks recommended." };
    if (riskAlleles === 1) return { phenotype: "Moderately Sun Sensitive", description: "You carry one MC1R variant. You may have fairer-than-average skin and some sun sensitivity.", advice: "Use SPF 30+ regularly, especially during peak UV hours. Be aware of moles and skin changes." };
    return { phenotype: "Typical Sun Sensitivity", description: "You don't carry major MC1R fair-skin variants.", advice: "Standard sun protection applies. Use sunscreen for prolonged exposure." };
  },

  "Earwax Type": (g) => {
    const v = g["rs17822931"] ?? "";
    if (v === "CC") return { phenotype: "Wet Earwax", description: "You have wet (yellowish-brown) earwax. This is also associated with typical underarm body odor.", advice: "Standard hygiene applies. Wet earwax is dominant in European and African populations." };
    if (v === "CT" || v === "TC") return { phenotype: "Wet Earwax (Carrier)", description: "You have wet earwax but carry one dry-earwax allele.", advice: "Standard hygiene applies. You're a carrier for the dry earwax trait." };
    if (v === "TT") return { phenotype: "Dry Earwax", description: "You have dry (flaky, gray) earwax. This is also associated with reduced underarm body odor.", advice: "You produce less apocrine sweat. You may need less deodorant than average. Common in East Asian populations." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Earwax type is genetically determined but has no health implications." };
  },

  "Eye Color": (g) => {
    const v = g["rs12913832"] ?? "";
    if (v === "GG") return { phenotype: "Likely Blue/Gray Eyes", description: "You carry two copies of the blue-eye allele at the strongest eye color locus. ~99% of GG individuals have blue or gray eyes.", advice: "Blue eyes have less melanin and may be more sensitive to bright light. UV-protective sunglasses recommended." };
    if (v === "AG" || v === "GA") return { phenotype: "Likely Green/Hazel Eyes", description: "You carry one blue-eye allele and one brown-eye allele. This combination often produces green, hazel, or light brown eyes.", advice: "Eye color is influenced by multiple genes — this is the strongest single predictor but not the only one." };
    if (v === "AA") return { phenotype: "Likely Brown Eyes", description: "You carry two copies of the brown-eye allele. You very likely have brown eyes.", advice: "Brown eyes have more melanin and offer slightly more natural UV protection, but sunglasses are still recommended." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Eye color is determined by multiple genes." };
  },

  "Freckles": (g) => {
    const mc1r = g["rs1805007"] ?? "";
    const irf4 = g["rs4911414"] ?? "";
    let score = 0;
    if (mc1r === "CT" || mc1r === "TC") score += 1;
    if (mc1r === "TT") score += 2;
    if (irf4 === "GT" || irf4 === "TG") score += 1;
    if (irf4 === "TT") score += 2;
    if (score >= 3) return { phenotype: "Many Freckles", description: "You carry multiple freckling-associated variants. You likely have prominent freckles, especially after sun exposure.", advice: "Freckles are a sign of UV sensitivity. Use SPF 30+ daily. Monitor moles/freckles for changes." };
    if (score >= 1) return { phenotype: "Some Freckles", description: "You carry one or more freckling variants. You may have scattered freckles, particularly after sun exposure.", advice: "Some freckling is normal. Sun protection helps prevent new freckles and protects skin health." };
    return { phenotype: "Few/No Freckles", description: "You don't carry major freckling variants. You likely have few or no freckles.", advice: "Standard sun protection guidelines apply." };
  },

  "Male Pattern Baldness": (g) => {
    const pax = g["rs2180439"] ?? "";
    const ar = g["rs6152"] ?? "";
    let score = 0;
    if (pax === "CC") score += 2;
    else if (pax === "CT" || pax === "TC") score += 1;
    if (ar === "GG" || ar === "G") score += 2;
    else if (ar === "AG" || ar === "GA") score += 1;
    if (score >= 3) return { phenotype: "Higher Baldness Risk", description: "You carry multiple variants associated with male pattern baldness. If male, you have above-average likelihood of hair loss.", advice: "Early treatment (finasteride, minoxidil) is most effective. Consult a dermatologist if hair thinning begins." };
    if (score >= 1) return { phenotype: "Moderate Baldness Risk", description: "You carry some baldness-associated variants. Moderate genetic predisposition to male pattern hair loss.", advice: "Monitor for early signs. Many effective treatments exist if caught early." };
    return { phenotype: "Lower Baldness Risk", description: "You don't carry major baldness risk variants at these loci.", advice: "Genetics is only part of the picture — hormonal and environmental factors also play a role." };
  },

  "Widow's Peak": (g) => {
    const v = g["rs2249079"] ?? "";
    if (v === "CC") return { phenotype: "Likely Widow's Peak", description: "You carry two copies of the variant associated with a pointed hairline (widow's peak).", advice: "Widow's peak is a harmless cosmetic trait. It's a dominant trait in classical genetics." };
    if (v === "CT" || v === "TC") return { phenotype: "Possible Widow's Peak", description: "You carry one copy. You may have a subtle widow's peak.", advice: "Hairline shape is influenced by multiple factors including age." };
    if (v === "TT") return { phenotype: "Likely Straight Hairline", description: "You likely have a straight or rounded hairline.", advice: "Hairline shape is purely cosmetic with no health implications." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Hairline shape is genetically influenced." };
  },

  "Cheek Dimples": (g) => {
    const v = g["rs3841438"] ?? "";
    if (v === "AA") return { phenotype: "Likely Dimples", description: "You carry the variant associated with cheek dimples. You likely have visible dimples when smiling.", advice: "Dimples are a charming cosmetic trait with no health significance." };
    if (v === "AG" || v === "GA") return { phenotype: "Possible Dimples", description: "You carry one copy. You may have dimples, possibly subtle or on one side.", advice: "Dimples can be asymmetric — one cheek is common." };
    return { phenotype: "Unlikely Dimples", description: "You don't carry the main dimple-associated variant.", advice: "Dimples are purely cosmetic. Genetics is just one factor." };
  },

  "Asparagus Odor Detection": (g) => {
    const v = g["rs4481887"] ?? "";
    if (v === "GG") return { phenotype: "Can Smell Asparagus Pee", description: "You carry two copies of the detection allele. You can likely detect the distinctive smell of asparagus metabolites in urine.", advice: "This is a fun genetic party trick! About 40% of people can detect this smell. You're one of them." };
    if (v === "AG" || v === "GA") return { phenotype: "Moderate Detection", description: "You carry one copy. You may be able to detect asparagus odor, but perhaps not as strongly.", advice: "Your ability to detect this smell is somewhere in between. Try the asparagus test!" };
    if (v === "AA") return { phenotype: "Cannot Smell Asparagus Pee", description: "You don't carry the detection allele. You likely cannot detect the characteristic asparagus urine smell.", advice: "Don't worry — the smell is still there, your nose just can't detect those specific sulfur compounds!" };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Try eating asparagus and see for yourself!" };
  },

  "Photic Sneeze Reflex": (g) => {
    const v = g["rs10427255"] ?? "";
    if (v === "CC") return { phenotype: "Likely Photic Sneezer", description: "You carry two copies of the photic sneeze variant. You very likely sneeze when exposed to bright light (ACHOO syndrome).", advice: "Be careful when driving out of tunnels into bright sunlight. Sunglasses can help prevent unexpected sneezing." };
    if (v === "CT" || v === "TC") return { phenotype: "Possible Photic Sneezer", description: "You carry one copy. You may experience occasional photic sneezing.", advice: "If you sneeze in bright sunlight, now you know why! Sunglasses help." };
    if (v === "TT") return { phenotype: "Not a Photic Sneezer", description: "You don't carry the photic sneeze variant. Bright light shouldn't make you sneeze.", advice: "About 18-35% of people have this reflex. You're not one of them." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Try looking at bright light and see if you sneeze!" };
  },

  "Misophonia (Chewing Sound Sensitivity)": (g) => {
    const v = g["rs2937573"] ?? "";
    if (v === "GG") return { phenotype: "Higher Misophonia Risk", description: "You carry two copies of the variant associated with misophonia. You may feel strong irritation at chewing, breathing, or mouth sounds.", advice: "If sounds bother you intensely, it's partly genetic. Noise-canceling headphones, white noise, and therapy (CBT) can help." };
    if (v === "AG" || v === "GA") return { phenotype: "Moderate Sensitivity", description: "You carry one copy. You may have some sensitivity to mouth sounds.", advice: "Mild sound sensitivity is very common. Background music during meals can help if it bothers you." };
    if (v === "AA") return { phenotype: "Typical Sound Tolerance", description: "You don't carry the main misophonia variant. You likely have typical tolerance to chewing sounds.", advice: "Lucky you — chewing sounds probably don't trigger strong reactions." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Misophonia is common and treatable." };
  },

  "Pain Sensitivity": (g) => {
    const v = g["rs6746030"] ?? "";
    if (v === "AA") return { phenotype: "Higher Pain Sensitivity", description: "You carry two copies of the variant associated with increased pain perception. You may experience pain more intensely.", advice: "Discuss pain management options with your doctor. You may need different analgesic approaches. Non-pharmacological methods (meditation, TENS) may help." };
    if (v === "AG" || v === "GA") return { phenotype: "Moderate Pain Sensitivity", description: "You carry one copy. Your pain sensitivity may be slightly above average.", advice: "Standard pain management approaches should work. Be aware you might be more sensitive than some people." };
    if (v === "GG") return { phenotype: "Typical Pain Sensitivity", description: "You don't carry the increased pain sensitivity variant at this locus.", advice: "Your pain perception at this locus is typical. Pain sensitivity involves many genes and environmental factors." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Pain sensitivity is complex and multi-genetic." };
  },

  "Motion Sickness": (g) => {
    const v = g["rs2052440"] ?? "";
    if (v === "CC") return { phenotype: "More Prone to Motion Sickness", description: "You carry two copies of the motion sickness variant. You likely experience motion sickness more easily in cars, boats, or planes.", advice: "Sit in the front seat of cars, look at the horizon on boats, ginger supplements may help. Medications like meclizine can prevent symptoms." };
    if (v === "CT" || v === "TC") return { phenotype: "Moderate Susceptibility", description: "You carry one copy. You may experience motion sickness in certain conditions.", advice: "Focus on the horizon, avoid reading in vehicles, and keep fresh air flowing. Ginger or acupressure wristbands may help." };
    if (v === "TT") return { phenotype: "Less Prone to Motion Sickness", description: "You don't carry the main motion sickness variant. You likely have good tolerance to motion.", advice: "You're probably fine on boats and winding roads. Lucky!" };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Motion sickness tends to decrease with age." };
  },

  "Deep Sleep Quality": (g) => {
    const v = g["rs73598374"] ?? "";
    if (v === "CC") return { phenotype: "Typical Deep Sleep", description: "You have the common ADA variant. Your deep sleep patterns are genetically typical.", advice: "Prioritize sleep hygiene: consistent schedule, cool dark room, no screens 1h before bed." };
    if (v === "CT" || v === "TC") return { phenotype: "Enhanced Deep Sleep", description: "You carry one copy of the ADA variant associated with more intense deep sleep (slow-wave sleep).", advice: "You may feel more refreshed after sleep. Maintain good sleep habits to maximize this genetic advantage." };
    if (v === "TT") return { phenotype: "Very Enhanced Deep Sleep", description: "You carry two copies. You likely experience deeper, more restorative slow-wave sleep.", advice: "Your genetics favor deep sleep. You may need slightly less total sleep to feel rested. Protect this advantage with good sleep hygiene." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Deep sleep quality depends on many factors beyond genetics." };
  },

  "VO2max Potential (Aerobic Capacity)": (g) => {
    const v = g["rs4341"] ?? "";
    if (v === "CC") return { phenotype: "High Endurance Potential", description: "ACE I/I genotype. You have lower ACE activity, associated with better endurance capacity and VO2max improvement with training.", advice: "You may respond particularly well to endurance training. Consider marathon, cycling, or swimming." };
    if (v === "CG" || v === "GC") return { phenotype: "Balanced Aerobic Capacity", description: "ACE I/D genotype. Balanced between endurance and power traits.", advice: "You can benefit from both endurance and high-intensity training. A mixed program works well." };
    if (v === "GG") return { phenotype: "Power-Oriented", description: "ACE D/D genotype. Higher ACE activity, associated with strength/power performance and muscle hypertrophy.", advice: "You may respond better to strength and power training (sprints, HIIT, weights). Endurance training still beneficial but may take more effort." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Aerobic fitness improves with training regardless of genetics." };
  },

  "Tendon / Injury Risk": (g) => {
    const v = g["rs12722"] ?? "";
    if (v === "TT") return { phenotype: "More Flexible / Higher Injury Risk", description: "You carry the variant associated with increased flexibility but potentially higher risk of soft tissue injuries (Achilles, ACL).", advice: "Focus on strength training to protect joints. Warm up thoroughly. Progress gradually in training volume." };
    if (v === "CT" || v === "TC") return { phenotype: "Moderate Flexibility", description: "Intermediate collagen variant. Balanced flexibility and injury risk.", advice: "Standard injury prevention: warm-up, progressive overload, rest days." };
    if (v === "CC") return { phenotype: "Stiffer Tendons / Lower Injury Risk", description: "You have stiffer collagen fibers. Lower risk of tendon injuries but potentially less natural flexibility.", advice: "You have naturally resilient tendons. Still stretch regularly to maintain range of motion." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Injury prevention is about training load management, regardless of genetics." };
  },

  "Omega-3 Conversion Efficiency": (g) => {
    const v = g["rs174546"] ?? "";
    if (v === "CC") return { phenotype: "Efficient Converter", description: "You efficiently convert plant-based omega-3 (ALA from flaxseed, walnuts) to EPA/DHA.", advice: "Plant-based omega-3 sources can meet your needs. Fish oil supplements are optional but still beneficial." };
    if (v === "CT" || v === "TC") return { phenotype: "Moderate Converter", description: "You have intermediate omega-3 conversion efficiency.", advice: "Include both plant and marine omega-3 sources. Consider fish oil or algae-based DHA supplements." };
    if (v === "TT") return { phenotype: "Poor Converter", description: "You have reduced ability to convert plant ALA to EPA/DHA. You depend more on preformed omega-3 from fish or supplements.", advice: "Prioritize fatty fish (salmon, sardines) 2-3x/week or take fish oil / algae DHA supplements. Plant sources alone may not be sufficient." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Omega-3 fatty acids are essential — include multiple sources in your diet." };
  },

  "Vitamin B6 Needs": (g) => {
    const v = g["rs4654748"] ?? "";
    if (v === "CC") return { phenotype: "Typical B6 Levels", description: "Your genetics support normal vitamin B6 (pyridoxal phosphate) levels.", advice: "Standard dietary B6 from chicken, fish, potatoes, bananas should meet your needs." };
    if (v === "CT" || v === "TC") return { phenotype: "Slightly Lower B6", description: "You carry one variant associated with modestly lower circulating B6 levels.", advice: "Ensure adequate B6 intake through diet. Consider a B-complex supplement if blood levels are low." };
    if (v === "TT") return { phenotype: "Lower B6 Levels", description: "You carry two copies of the variant associated with lower circulating vitamin B6.", advice: "You may benefit from B6-rich foods or supplementation (P5P form preferred). Check blood levels periodically." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "B6 is important for neurotransmitter synthesis and immune function." };
  },

  "Histamine Intolerance Risk": (g) => {
    const v = g["rs10156191"] ?? "";
    if (v === "CC") return { phenotype: "Normal Histamine Tolerance", description: "You have typical diamine oxidase (DAO) activity. You can handle histamine in foods normally.", advice: "No special dietary restrictions needed for histamine. Enjoy aged cheeses, wine, and fermented foods freely." };
    if (v === "CT" || v === "TC") return { phenotype: "Mildly Reduced DAO", description: "You carry one copy of the reduced DAO variant. You may have slight sensitivity to high-histamine foods.", advice: "If you experience headaches, flushing, or GI issues after wine, aged cheese, or fermented foods, histamine may be a factor. Try reducing these foods and see if symptoms improve." };
    if (v === "TT") return { phenotype: "Reduced DAO / Histamine Sensitive", description: "You carry two copies. You have genetically reduced diamine oxidase activity and may be more sensitive to dietary histamine.", advice: "Consider a low-histamine diet trial if symptomatic. DAO enzyme supplements before meals may help. Avoid: aged cheese, wine, cured meats, fermented foods, canned fish." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "If you suspect histamine issues, try an elimination diet." };
  },

  "Salt Sensitivity (Blood Pressure)": (g) => {
    const v = g["rs699"] ?? "";
    // C = risk allele (T235) on plus strand; 23andMe may report on minus strand (G→C, A→T)
    if (v === "CC" || v === "GG") return { phenotype: "Salt Sensitive", description: "You carry two copies of the salt sensitivity variant (AGT T235T). Your blood pressure may respond more to sodium intake.", advice: "Limit sodium to <2000mg/day. DASH diet is especially effective for your genotype. Monitor blood pressure regularly." };
    if (v === "CT" || v === "TC" || v === "AG" || v === "GA") return { phenotype: "Moderately Salt Sensitive", description: "You carry one copy. You may have some blood pressure response to high sodium intake.", advice: "Moderate sodium intake (<2300mg/day). Increase potassium (bananas, leafy greens) to counterbalance." };
    if (v === "TT" || v === "AA") return { phenotype: "Less Salt Sensitive", description: "You have the common AGT variant. Your blood pressure is less affected by sodium intake.", advice: "Standard sodium guidelines apply. Don't ignore sodium entirely — other health effects exist beyond blood pressure." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Moderate sodium intake is healthy for everyone." };
  },

  "Saturated Fat & Weight Gain": (g) => {
    const v = g["rs5082"] ?? "";
    if (v === "GG") return { phenotype: "Sensitive to Saturated Fat", description: "You carry two copies of the APOA2 variant. High saturated fat intake may cause more weight gain for you than average.", advice: "Limit saturated fat (butter, red meat, cheese). Choose olive oil, avocado, nuts instead. This genotype responds well to a Mediterranean diet." };
    if (v === "AG" || v === "GA") return { phenotype: "Moderate Fat Sensitivity", description: "You carry one copy. Modest effect on weight gain from saturated fat.", advice: "Moderate saturated fat intake. Emphasize unsaturated fats (olive oil, fish, nuts)." };
    if (v === "AA") return { phenotype: "Typical Fat Response", description: "You have the common APOA2 variant. Saturated fat intake has typical effect on your weight.", advice: "Standard dietary guidelines apply. Balance fat sources and watch total caloric intake." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Balanced fat intake is healthy for everyone." };
  },

  "Stretch Marks Susceptibility": (g) => {
    const v = g["rs7787362"] ?? "";
    // A = risk allele; 23andMe may report complementary strand (T=A, C=G)
    if (v === "AA" || v === "TT") return { phenotype: "More Prone to Stretch Marks", description: "You carry two copies of the elastin variant. You may be more prone to developing stretch marks with rapid weight/size changes.", advice: "Keep skin moisturized during weight changes or pregnancy. Gradual weight gain/loss reduces stretch mark risk. Retinoids may help prevent (not during pregnancy)." };
    if (v === "AG" || v === "GA" || v === "TC" || v === "CT") return { phenotype: "Moderate Susceptibility", description: "You carry one copy. You have moderate genetic susceptibility to stretch marks.", advice: "Moisturize during periods of rapid growth. Cocoa butter, bio-oil, and hyaluronic acid may help." };
    if (v === "GG" || v === "CC") return { phenotype: "Lower Susceptibility", description: "You have the common elastin variant. Lower genetic predisposition to stretch marks.", advice: "Stretch marks can still occur with rapid changes. Good hydration and moisturizing helps." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Keep skin well-moisturized during weight changes." };
  },

  "Sweet vs Salty Preference": (g) => {
    const v = g["rs838133"] ?? "";
    if (v === "AA") return { phenotype: "Strong Sweet Tooth", description: "You carry two copies of the variant associated with preference for sweet foods and higher carbohydrate intake.", advice: "Be mindful of sugar intake. Opt for natural sweetness (fruit, dark chocolate). Your cravings are partly genetic, but you can train your palate." };
    if (v === "AG" || v === "GA") return { phenotype: "Moderate Sweet Preference", description: "You carry one copy. You may have a moderate preference for sweet over salty.", advice: "Balance your snacks between sweet and savory. Choose whole fruits over processed sweets." };
    if (v === "GG") return { phenotype: "Salty/Savory Preference", description: "You don't carry the sweet-tooth variant. You may naturally prefer savory, salty, or umami flavors.", advice: "Watch sodium intake if you gravitate toward salty snacks. Nuts, olives, and cheese are healthier savory options." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Food preferences are influenced by genetics, culture, and habit." };
  },

  "Novelty Seeking / Risk Taking": (g) => {
    const v = g["rs1800955"] ?? "";
    if (v === "CC") return { phenotype: "Higher Novelty Seeking", description: "You carry two copies of the variant associated with novelty seeking, exploration, and risk-taking behavior.", advice: "Channel your adventurous nature into positive outlets: travel, new skills, entrepreneurship. Be aware of impulsive tendencies." };
    if (v === "CT" || v === "TC") return { phenotype: "Moderate Novelty Seeking", description: "You carry one copy. You balance between seeking new experiences and enjoying familiar routines.", advice: "Your balance of adventure and stability is genetically supported. Embrace both sides." };
    if (v === "TT") return { phenotype: "Lower Novelty Seeking", description: "You have the variant associated with preference for familiar routines and lower risk-taking.", advice: "Routine and stability come naturally. Occasionally push your comfort zone — growth happens at the edges." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Personality is shaped by both genetics and experience." };
  },

  "Mosquito Bite Attraction": (g) => {
    const v = g["rs478304"] ?? "";
    if (v === "TT") return { phenotype: "More Attractive to Mosquitoes", description: "You may produce body odors that mosquitoes find more attractive, partly due to HLA-influenced skin microbiome.", advice: "Use DEET or picaridin-based repellents. Wear light-colored clothing. Mosquitoes are also attracted to CO2 and body heat." };
    if (v === "CT" || v === "TC") return { phenotype: "Moderate Attraction", description: "Average genetic profile for mosquito attraction.", advice: "Standard precautions: repellent in mosquito season, eliminate standing water around home." };
    if (v === "CC") return { phenotype: "Less Attractive to Mosquitoes", description: "Your body odor profile may be less attractive to mosquitoes.", advice: "Lucky you, but don't skip repellent in high-risk areas (tropical regions, dusk/dawn)." };
    return { phenotype: "Unknown", description: "Genotype data not sufficient.", advice: "Mosquito attraction varies by many factors: CO2, body heat, blood type, skin bacteria." };
  },
};

// ============================================================
// LOAD TRAIT CATALOG FROM JSON + ATTACH PHENOTYPE FUNCTIONS
// ============================================================

function loadTraitCatalog(): TraitDefinition[] {
  const traits: TraitDefinition[] = [];
  let files: string[];

  try {
    files = readdirSync(TRAIT_DATA_DIR).filter(f => f.endsWith(".json"));
  } catch {
    console.error(`[OpenPGx] Warning: Trait data directory not found at ${TRAIT_DATA_DIR}`);
    return [];
  }

  for (const file of files) {
    try {
      const raw = readFileSync(join(TRAIT_DATA_DIR, file), "utf-8");
      const data: TraitJsonFile = JSON.parse(raw);

      // Find the matching phenotype function
      const phenotype_fn = PHENOTYPE_FUNCTIONS[data.trait];
      if (!phenotype_fn) {
        console.error(`[OpenPGx] Warning: No phenotype function for trait "${data.trait}" (${file})`);
        continue;
      }

      traits.push({
        trait: data.trait,
        category: data.category,
        snps: data.snps,
        phenotype_fn,
        evidence_level: data.evidence_level as TraitDefinition["evidence_level"],
        studies: data.studies,
      });
    } catch (e) {
      console.error(`[OpenPGx] Error loading ${file}:`, e);
    }
  }

  return traits;
}

export const TRAIT_CATALOG: TraitDefinition[] = loadTraitCatalog();

// === Build trait rsID set ===

export const TRAIT_RSIDS = new Set<string>();
for (const trait of TRAIT_CATALOG) {
  for (const snp of trait.snps) {
    TRAIT_RSIDS.add(snp.rsid);
  }
}
