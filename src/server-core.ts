/**
 * OpenPGx MCP Server Core — shared server factory used by both
 * the stdio entry point (index.ts) and the HTTP entry point (server-http.ts).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

import {
  parseRawData,
  parseRawContent,
  supportedFormats,
  type PatientProfile,
  type RiskResult,
  type TraitResult,
} from "./parsers.js";
import {
  getGeneDefinition,
  PHARMACOGENE_CATALOG,
  RISK_CATALOG,
  TRAIT_CATALOG,
  getDrugGeneLinks,
  getAllInterpretations,
  STUDY_CATALOG,
  ingestStudy,
  type StudyContribution,
  type SnpInterpretation,
} from "./pharmacogenes.js";
import { BRAND_TO_GENERIC, resolveDrugName, semanticSearch } from "./drug-resolver.js";

export const OPENPGX_VERSION = "0.4.0";
const OPENPGX_DIR = join(homedir(), ".openpgx");
const CACHE_DIR = join(OPENPGX_DIR, "cache", "drugs");
const PATIENT_DIR = join(OPENPGX_DIR, "patients");

mkdirSync(CACHE_DIR, { recursive: true });
mkdirSync(PATIENT_DIR, { recursive: true });

const GENE_CONTEXTS: Record<string, string> = {
  CYP2D6: "Affects metabolism of ~25% of all drugs including codeine, tramadol, tamoxifen, many antidepressants. CPIC Level A.",
  CYP2C19: "Affects clopidogrel, SSRIs (sertraline, escitalopram), PPIs (omeprazole), voriconazole. CPIC Level A.",
  CYP2C9: "Affects warfarin dosing, NSAID metabolism, phenytoin. CPIC Level A.",
  CYP3A5: "Affects tacrolimus dosing in transplant patients. CPIC Level A.",
  VKORC1: "Key determinant of warfarin dose. Combined with CYP2C9 for optimal dosing. CPIC Level A.",
  DPYD: "Critical for fluoropyrimidine safety (5-FU, capecitabine). Deficiency can be life-threatening. CPIC Level A.",
  TPMT: "Affects thiopurine dosing (azathioprine, mercaptopurine). CPIC Level A.",
  SLCO1B1: "Affects statin myopathy risk, especially simvastatin. CPIC Level A.",
  MTHFR: "Affects folate metabolism and methylation. Consider methylfolate if reduced activity.",
  COMT: "Affects stress response and pain sensitivity. May influence supplement tolerance.",
  VDR: "Affects vitamin D receptor function. May influence supplementation needs.",
  GLP1R: "May affect response to GLP-1 agonists (semaglutide/Ozempic). EMERGING evidence.",
  GIPR: "May affect response to dual agonists (tirzepatide/Mounjaro). EMERGING evidence.",
};

const RISK_LABELS: Record<string, string> = {
  reduced: "🟢 Reduced",
  typical: "⚪ Typical",
  slightly_elevated: "🟡 Slightly Elevated",
  elevated: "🟠 Elevated",
  high: "🔴 High",
};

const RISK_CATEGORY_LABELS: Record<string, string> = {
  oncology: "Oncology",
  cardiovascular: "Cardiovascular",
  neurological: "Neurological",
  metabolic: "Metabolic",
  autoimmune: "Autoimmune",
  ophthalmological: "Ophthalmological",
  hematological: "Hematological",
  musculoskeletal: "Musculoskeletal",
  dermatological: "Dermatological",
  respiratory: "Respiratory",
  endocrine: "Endocrine",
};

const TRAIT_CATEGORY_LABELS: Record<string, string> = {
  metabolism: "Metabolism",
  nutrition: "Nutrition",
  sensory: "Sensory",
  fitness: "Fitness",
  sleep: "Sleep & Circadian",
  appearance: "Appearance",
  cognitive: "Cognitive",
  behavioral: "Behavioral",
  skin: "Skin",
  longevity: "Longevity",
};

function getCachedDrug(drugName: string): Record<string, unknown> | null {
  const cachePath = join(CACHE_DIR, `${drugName.toLowerCase().replace(/ /g, "_")}.openpgx.json`);
  if (!existsSync(cachePath)) return null;
  try {
    return JSON.parse(readFileSync(cachePath, "utf-8"));
  } catch {
    return null;
  }
}

function getSupplementRec(gene: string, genotypes: Record<string, string>): string | null {
  if (gene === "MTHFR") {
    const v = genotypes["rs1801133"] ?? "";
    if (v === "TT") return "Consider methylfolate (L-5-MTHF) instead of folic acid. Check homocysteine levels.";
    if (v === "CT" || v === "TC") return "Mildly reduced MTHFR. Methylfolate may be preferred over folic acid.";
  }
  if (gene === "COMT") {
    const v = genotypes["rs4680"] ?? "";
    if (v === "AA") return "Low COMT (Met/Met): sensitive to methyl donors. May benefit from magnesium.";
    if (v === "GG") return "High COMT (Val/Val): tolerates methyl donors. May benefit from SAMe.";
  }
  if (gene === "VDR") return "Check vitamin D levels. VDR variants may require higher doses. Target 40-60 ng/mL.";
  if (gene === "BCMO1") return "Reduced beta-carotene conversion. Consider preformed vitamin A (retinol).";
  if (gene === "FUT2") {
    if ((genotypes["rs601338"] ?? "") === "AA") return "Non-secretor: lower B12 absorption. Consider sublingual methylcobalamin.";
  }
  if (gene === "CBS") return "CBS variants may affect transsulfuration. Monitor homocysteine.";
  return null;
}

function formatRiskResult(r: RiskResult): string {
  const lines = [
    `# Disease Risk: ${r.condition}`,
    `**Risk Level:** ${RISK_LABELS[r.overall_risk]}`,
    `**Category:** ${RISK_CATEGORY_LABELS[r.category] ?? r.category}`,
    r.icd10 ? `**ICD-10:** ${r.icd10}` : "",
    `**Evidence:** ${r.evidence.level}`,
    "",
    "## Your SNPs",
    "",
  ];

  for (const snp of r.risk_snps) {
    lines.push(`### ${snp.gene_region} (${snp.rsid})`);
    lines.push(`- **Your genotype:** ${snp.your_genotype}`);
    lines.push(`- **Risk allele:** ${snp.risk_allele} (OR: ${snp.odds_ratio})`);
    if (snp.population_frequency) {
      const freqs = Object.entries(snp.population_frequency).map(([pop, f]) => `${pop}: ${(f * 100).toFixed(1)}%`).join(", ");
      lines.push(`- **Risk allele frequency:** ${freqs}`);
    }
    lines.push(`- **Effect:** ${snp.effect}`);
    lines.push("");
  }

  lines.push("## Risk Estimate");
  lines.push(`- **General population:** ${r.lifetime_risk.general_population}`);
  lines.push(`- **Your estimated risk:** ${r.lifetime_risk.your_estimated}`);
  lines.push(`- *${r.lifetime_risk.note}*`);
  lines.push("");

  if (r.actionable) {
    lines.push("## Recommendation");
    lines.push(r.recommendation);
    lines.push("");
  }

  if (r.studies.length > 0) {
    lines.push("## Key Studies");
    for (const s of r.studies) {
      lines.push(`- **${s.title}** (${s.journal}, ${s.year})${s.pmid ? ` [PMID: ${s.pmid}]` : ""}`);
      lines.push(`  Finding: ${s.finding}`);
    }
    lines.push("");
  }

  lines.push(
    "---",
    "",
    "⚠️ Genetic risk is probabilistic, not deterministic. Discuss with your healthcare provider.",
    "",
    `*Generated by OpenPGx v${OPENPGX_VERSION} — openpgx.ai*`
  );

  return lines.filter(l => l !== "").join("\n");
}

function formatCachedDrug(name: string, cached: Record<string, unknown>): string {
  const drug = (cached["drug"] as Record<string, unknown>) ?? {};
  const assocs = (cached["pgx_associations"] as Array<Record<string, unknown>>) ?? [];

  const lines = [
    `# Medication Analysis: ${name}`,
    `*From OpenPGx cache (confidence: ${cached["confidence_score"] ?? "N/A"})*`,
    "",
  ];

  if (drug["brand_names"]) lines.push(`**Brand names:** ${(drug["brand_names"] as string[]).join(", ")}`);
  if (drug["class"]) lines.push(`**Drug class:** ${drug["class"]}`);
  lines.push("");

  for (const assoc of assocs) {
    const gene = (assoc["gene"] as string) ?? "Unknown";
    const rsid = (assoc["rsid"] as string) ?? "";
    lines.push(`## ${gene} (${rsid})`);
    lines.push(`**Effect:** ${assoc["effect"] ?? "N/A"}`);
    lines.push(`**Recommendation:** ${assoc["clinical_recommendation"] ?? "N/A"}`);
    lines.push("");
  }

  lines.push("---", "⚠️ Educational purposes only. Discuss with your healthcare provider.");
  return lines.join("\n");
}

/**
 * Creates a fully configured McpServer with all 9 OpenPGx tools registered.
 * Each call returns an independent server instance with its own patient state,
 * suitable for both stdio (single session) and HTTP (per-session) usage.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: "openpgx", version: OPENPGX_VERSION });

  let currentPatient: PatientProfile | null = null;

  const pendingUploads = new Map<string, { chunks: string[]; createdAt: number }>();
  const UPLOAD_TTL_MS = 10 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of pendingUploads) {
      if (now - entry.createdAt > UPLOAD_TTL_MS) pendingUploads.delete(id);
    }
  }, 60_000).unref();

  function saveAndFormatProfile(patient: PatientProfile, source: string): string {
    const patientFile = join(PATIENT_DIR, "current.openpgx.json");
    const patientData = {
      openpgx_version: OPENPGX_VERSION,
      metadata: { generated_at: new Date().toISOString(), generator: `openpgx-mcp v${OPENPGX_VERSION}` },
      patient: {
        raw_data_source: patient.rawDataSource,
        raw_data_format: patient.rawDataFormat,
        extraction_date: patient.extractionDate,
        total_snps_extracted: patient.totalSnpsExtracted,
        pharmacogenes: patient.pharmacogenes.map(pg => ({
          gene: pg.gene,
          genotypes: pg.genotypes,
          diplotype: pg.diplotype,
          phenotype: pg.phenotype,
        })),
      },
      medications: [],
      risks: patient.risks,
      traits: patient.traits,
    };
    writeFileSync(patientFile, JSON.stringify(patientData, null, 2));

    const lines = [
      `# OpenPGx Patient Profile (v${OPENPGX_VERSION})`,
      `**Source:** ${patient.rawDataSource}`,
      `**Input:** ${source}`,
      `**SNPs extracted:** ${patient.totalSnpsExtracted}`,
      `**Pharmacogenes:** ${patient.pharmacogenes.length}`,
      `**Disease risks:** ${patient.risks.length} conditions analyzed`,
      `**Traits:** ${patient.traits.length} traits detected`,
      "",
      "## Pharmacogenes",
      "",
    ];
    for (const pg of patient.pharmacogenes) {
      const def = getGeneDefinition(pg.gene);
      lines.push(`### ${pg.gene} (${def?.category ?? "unknown"})`);
      if (def) lines.push(`*${def.description}*`);
      lines.push(`- **Genotypes:** ${Object.entries(pg.genotypes).map(([k, v]) => `${k}=${v}`).join(", ")}`);
      if (pg.phenotype) lines.push(`- **Phenotype:** ${pg.phenotype}`);
      lines.push("");
    }

    const elevatedRisks = patient.risks.filter(r => r.overall_risk !== "typical" && r.overall_risk !== "reduced");
    if (elevatedRisks.length > 0) {
      lines.push("## Risk Highlights", "");
      for (const r of elevatedRisks) {
        lines.push(`- ${RISK_LABELS[r.overall_risk]} **${r.condition}** — ${r.risk_snps.length} SNP(s) analyzed`);
      }
      lines.push("", "*Use `check_risk` or `full_risk_report` for detailed analysis.*", "");
    }

    if (patient.traits.length > 0) {
      lines.push("## Trait Highlights", "");
      for (const t of patient.traits) {
        lines.push(`- **${t.trait}:** ${t.your_phenotype}`);
      }
      lines.push("", "*Use `trait_report` for detailed analysis.*", "");
    }

    lines.push(`Saved to: \`${patientFile}\``);
    return lines.join("\n");
  }

  function getPatientGeneSummary(): string {
    if (!currentPatient) return "No profile loaded.";
    return currentPatient.pharmacogenes
      .map(pg => {
        const genos = Object.entries(pg.genotypes).map(([k, v]) => `${k}=${v}`).join(", ");
        const pheno = pg.phenotype ? ` → ${pg.phenotype}` : "";
        return `- **${pg.gene}:** ${genos}${pheno}`;
      })
      .join("\n");
  }

  // --- Tool: upload_genome ---
  server.registerTool(
    "upload_genome",
    {
      title: "Upload Genome",
      description: [
        `Parse raw DNA data. Supports: ${supportedFormats().join(", ")}.`,
        `CRITICAL: Genome files are 15-25MB (600k+ lines). NEVER read, inline, or chunk genome file contents — this WILL exceed your context window and crash the session.`,
        `For REMOTE server (mcp.openpgx.ai): use get_upload_command to get a curl/python command, execute it in your code execution sandbox (or tell the user to run it in their terminal), then call load_profile with the returned code.`,
        `For LOCAL server (stdio/npx): use file_path only.`,
        `The url parameter is for direct download links (Google Drive, Dropbox, S3).`,
      ].join(" "),
      inputSchema: {
        file_path: z.string().optional().describe("Local file path (stdio mode ONLY — remote server cannot access local files)"),
        url: z.string().optional().describe("Direct download URL to the raw data file"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ file_path, url }) => {
      const inputCount = [file_path, url].filter(Boolean).length;
      if (inputCount === 0) {
        return { content: [{ type: "text" as const, text: "No input provided.\n\n**How to upload genome data:**\n\n1. Use `get_upload_command` — it returns a curl command\n2. Execute that command (in your sandbox or tell the user to run it in their terminal)\n3. Use `load_profile` with the returned code (e.g., `pgx-a7b3c`)\n\n**NEVER read or paste genome file contents** — they are 15-25MB and will exceed context limits." }] };
      }
      if (inputCount > 1) {
        return { content: [{ type: "text" as const, text: "Please provide only ONE of: file_path or url." }] };
      }

      try {
        if (url) {
          const resp = await fetch(url, { headers: { "User-Agent": "OpenPGx-MCP/0.3.0" }, redirect: "follow" });
          if (!resp.ok) {
            return { content: [{ type: "text" as const, text: `Error downloading from URL: HTTP ${resp.status} ${resp.statusText}\n\nMake sure the URL points directly to the raw data file. For Google Drive, use:\nhttps://drive.google.com/uc?export=download&id=FILE_ID` }] };
          }
          const content = await resp.text();
          currentPatient = parseRawContent(content);
        } else if (file_path) {
          if (!existsSync(file_path)) {
            return { content: [{ type: "text" as const, text: `File not found: ${file_path}\n\nIf using the remote server (mcp.openpgx.ai), the server cannot access local files.\n\n**Use this flow instead:**\n1. Call \`get_upload_command\` with the file path\n2. Execute the returned curl command in your sandbox or terminal\n3. Call \`load_profile\` with the code you receive` }] };
          }
          currentPatient = parseRawData(file_path);
        }
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }] };
      }

      if (!currentPatient) {
        return { content: [{ type: "text" as const, text: "Error: Failed to parse genome data." }] };
      }

      const source = url ? `URL: ${url}` : `File: ${file_path}`;
      const text = saveAndFormatProfile(currentPatient, source);
      return { content: [{ type: "text" as const, text }] };
    }
  );

  // --- Tool: get_upload_command ---
  server.registerTool(
    "get_upload_command",
    {
      title: "Get Upload Command",
      description: "Returns a ready-to-run curl command that uploads a genome file directly to the OpenPGx server. Execute this command in your code execution sandbox or tell the user to run it in their terminal. The command sends the file WITHOUT reading it into context. After running it, use load_profile with the returned code.",
      inputSchema: {
        file_path: z.string().describe("Path to the genome file (e.g., /uploads/genome.txt or the path shown in the user's message)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ file_path }) => {
      const curlCmd = `curl -s -X POST https://mcp.openpgx.ai/upload --data-binary @"${file_path}"`;
      const pythonCmd = `python3 -c "import urllib.request,json; r=urllib.request.urlopen(urllib.request.Request('https://mcp.openpgx.ai/upload',open('${file_path}','rb').read(),{'Content-Type':'application/octet-stream'},method='POST')); print(json.loads(r.read())['code'])"`;
      const text = [
        `## Upload Command`,
        ``,
        `Execute ONE of these in your code execution sandbox or terminal:`,
        ``,
        `**curl:**`,
        `\`\`\`bash`,
        curlCmd,
        `\`\`\``,
        ``,
        `**python (no dependencies):**`,
        `\`\`\`python`,
        pythonCmd,
        `\`\`\``,
        ``,
        `After running, you'll get a response like: \`{"code":"pgx-a7b3c",...}\``,
        `Then call \`load_profile\` with that code.`,
        ``,
        `**Important:** If executing in Claude.ai sandbox, the user must whitelist \`mcp.openpgx.ai\` in Settings → Capabilities → Additional allowed domains.`,
      ].join("\n");
      return { content: [{ type: "text" as const, text }] };
    }
  );

  // --- Tool: upload_genome_start ---
  server.registerTool(
    "upload_genome_start",
    {
      title: "Start Chunked Genome Upload",
      description: "FOR PROGRAMMATIC MCP CLIENTS ONLY (not for LLM agents). LLM agents: use get_upload_command + load_profile instead. This starts a chunked upload session for clients that can stream file contents without loading into context.",
      inputSchema: {
        filename: z.string().optional().describe("Original filename (for logging only)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ filename }) => {
      const uploadId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      pendingUploads.set(uploadId, { chunks: [], createdAt: Date.now() });
      const text = `Upload session started.\n\n**upload_id:** \`${uploadId}\`${filename ? `\n**file:** ${filename}` : ""}\n\nNow send the file content in chunks using \`upload_genome_chunk\`. Send ~500KB per chunk (~25k lines). Set \`is_last: true\` on the final chunk.`;
      return { content: [{ type: "text" as const, text }] };
    }
  );

  // --- Tool: upload_genome_chunk ---
  server.registerTool(
    "upload_genome_chunk",
    {
      title: "Send Genome Data Chunk",
      description: "FOR PROGRAMMATIC MCP CLIENTS ONLY (not for LLM agents). LLM agents: use get_upload_command + load_profile instead. Sends a chunk of genome data for a chunked upload session.",
      inputSchema: {
        upload_id: z.string().describe("Upload session ID from upload_genome_start"),
        chunk_index: z.number().describe("0-based sequential chunk index"),
        data: z.string().describe("Chunk of raw genome file content (plain text lines, NOT base64)"),
        is_last: z.boolean().optional().describe("Set to true on the final chunk to trigger parsing"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ upload_id, chunk_index, data, is_last }) => {
      const upload = pendingUploads.get(upload_id);
      if (!upload) {
        return { content: [{ type: "text" as const, text: `Error: Upload session \`${upload_id}\` not found or expired. Start a new session with \`upload_genome_start\`.` }] };
      }

      upload.chunks[chunk_index] = data;
      const totalBytes = upload.chunks.reduce((sum, c) => sum + (c?.length ?? 0), 0);
      const receivedCount = upload.chunks.filter(Boolean).length;

      if (!is_last) {
        return { content: [{ type: "text" as const, text: `Chunk ${chunk_index} received. **${receivedCount} chunks** so far (${(totalBytes / 1024).toFixed(0)} KB). Send next chunk or set \`is_last: true\` on the final one.` }] };
      }

      const fullContent = upload.chunks.join("");
      pendingUploads.delete(upload_id);

      try {
        currentPatient = parseRawContent(fullContent);
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error parsing assembled genome data (${receivedCount} chunks, ${(totalBytes / 1024).toFixed(0)} KB): ${e instanceof Error ? e.message : String(e)}` }] };
      }

      const text = saveAndFormatProfile(currentPatient, `Chunked upload (${receivedCount} chunks, ${(totalBytes / 1024).toFixed(0)} KB)`);
      return { content: [{ type: "text" as const, text }] };
    }
  );

  // --- Tool: load_profile ---
  server.registerTool(
    "load_profile",
    {
      title: "Load Uploaded Profile",
      description: "RECOMMENDED for remote server. Load a genome profile using a code (e.g., pgx-a7b3c) from the /upload endpoint. The user ran a curl command (from get_upload_command) in their terminal or sandbox and received this code. This is the primary way to load genome data on the remote server without reading file contents into context.",
      inputSchema: {
        code: z.string().describe("Profile code from the upload command (e.g., pgx-a7b3c)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ code }) => {
      const profilePath = join(PATIENT_DIR, "..", "uploads", `${code}.json`);
      if (!existsSync(profilePath)) {
        return { content: [{ type: "text" as const, text: `Profile \`${code}\` not found. Make sure you ran the upload command and got this code back.\n\nTo upload, run in your terminal:\n\`\`\`\ncurl -X POST https://mcp.openpgx.ai/upload --data-binary @your_genome_file.txt\n\`\`\`` }] };
      }

      try {
        const data = JSON.parse(readFileSync(profilePath, "utf-8"));
        const patient = data.patient;

        currentPatient = {
          rawDataSource: patient.raw_data_source,
          rawDataFormat: patient.raw_data_format,
          extractionDate: patient.extraction_date,
          totalSnpsExtracted: patient.total_snps_extracted,
          pharmacogenes: patient.pharmacogenes,
          risks: data.risks ?? [],
          traits: data.traits ?? [],
        } as PatientProfile;

        const text = saveAndFormatProfile(currentPatient, `Uploaded profile (code: ${code})`);
        return { content: [{ type: "text" as const, text }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error loading profile: ${e instanceof Error ? e.message : String(e)}` }] };
      }
    }
  );

  // --- Tool: check_medication ---
  server.registerTool(
    "check_medication",
    {
      title: "Check Medication",
      description: `Check how your genes affect a medication. Supports brand names ("Ozempic"), generic names ("semaglutide"), typos ("ozmpic"), and natural language ("weight loss injection", "antidepressivo").`,
      inputSchema: {
        drug_name: z.string().describe("Medication name, brand name, or description"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ drug_name }) => {
      if (!currentPatient) {
        return { content: [{ type: "text" as const, text: "No genetic profile loaded. Please use `upload_genome` first." }] };
      }

      const resolution = await resolveDrugName(drug_name);

      if (resolution.type === "category_match") {
        const text = `# Medication Search: "${drug_name}"\n\nMatches **${resolution.description}**.\n\n## Available:\n\n${resolution.suggestions.map(d => `- **${d}**`).join("\n")}\n\nWhich one would you like me to check?`;
        return { content: [{ type: "text" as const, text }] };
      }

      if (resolution.type === "semantic_suggestions") {
        const text = `# Medication Search: "${drug_name}"\n\nPossible matches:\n\n${resolution.suggestions.map(d => `- **${d}** (${((resolution.scores?.[d] ?? 0) * 100).toFixed(0)}%)`).join("\n")}\n\nWhich one would you like me to check?`;
        return { content: [{ type: "text" as const, text }] };
      }

      if (resolution.type === "not_found") {
        const cached = getCachedDrug(drug_name);
        if (cached) {
          return { content: [{ type: "text" as const, text: formatCachedDrug(drug_name, cached) }] };
        }
        return { content: [{ type: "text" as const, text: `# Medication Search: "${drug_name}"\n\nCouldn't match this to a known medication.\n\n**Tips:**\n- Try the generic name (e.g., "semaglutide")\n- Try a category (e.g., "antidepressant", "weight loss")\n- Check spelling\n\nOr I can search PharmGKB directly — want me to search?` }] };
      }

      const resolvedName = resolution.resolved!;
      let displayInfo = "";
      if (resolution.type === "brand_match") displayInfo = `**${drug_name}** → generic: **${resolvedName}**\n\n`;
      else if (resolution.type === "fuzzy_match") displayInfo = `**${drug_name}** → did you mean **${resolution.matchedBrand ?? resolvedName}**? → **${resolvedName}**\n\n`;
      else if (resolution.type === "semantic_match") displayInfo = `**${drug_name}** → semantic match: **${resolvedName}** (${((resolution.score ?? 0) * 100).toFixed(0)}%)\n\n`;

      const cached = getCachedDrug(resolvedName);
      if (cached) {
        return { content: [{ type: "text" as const, text: displayInfo + formatCachedDrug(resolvedName, cached) }] };
      }

      const brands = Object.entries(BRAND_TO_GENERIC).filter(([_, g]) => g === resolvedName).map(([b]) => b);
      const brandStr = brands.length > 0 ? `Also known as: ${brands.join(", ")}\n` : "";

      // Check study-based drug→gene associations
      const drugLinks = getDrugGeneLinks(resolvedName);

      if (drugLinks.length > 0 && currentPatient) {
        const lines = [
          `# Medication Check: ${resolvedName}`,
          "",
          displayInfo + brandStr,
          "",
        ];

        const patientGeneMap: Record<string, Record<string, string>> = {};
        for (const pg of currentPatient.pharmacogenes) {
          patientGeneMap[pg.gene] = pg.genotypes;
        }

        for (const link of drugLinks) {
          const genos = patientGeneMap[link.gene];
          lines.push(`## ${link.gene}`);

          if (!genos) {
            lines.push(`*No genotype data found for ${link.gene} in your profile.*`);
            lines.push("");
            continue;
          }

          const interps = getAllInterpretations(link.gene, genos);
          if (interps.length > 0) {
            for (const i of interps) {
              lines.push(`### ${i.rsid} — Your genotype: **${i.genotype}**`);
              lines.push(`- **Phenotype:** ${i.interpretation.phenotype}`);
              lines.push(`- **Effect:** ${i.interpretation.effect}`);
              if (i.interpretation.recommendation) lines.push(`- **Recommendation:** ${i.interpretation.recommendation}`);
              if (i.interpretation.severity && i.interpretation.severity !== "info") lines.push(`- **Severity:** ${i.interpretation.severity}`);
              lines.push("");
            }
          } else {
            lines.push(`- **Genotypes:** ${Object.entries(genos).map(([k, v]) => `${k}=${v}`).join(", ")}`);
            lines.push(`- *No specific interpretation available for your genotype combination.*`);
            lines.push("");
          }

          if (link.study.source) {
            lines.push(`**Source:** ${link.study.source.title} (${link.study.source.journal}, ${link.study.source.year})`);
            if (link.study.source.pmid) lines.push(`[PMID: ${link.study.source.pmid}](${link.study.source.url})`);
            if (link.study.evidence_level) lines.push(`**Evidence level:** ${link.study.evidence_level}`);
            lines.push("");
          }
        }

        lines.push(
          "---",
          "",
          "⚠️ Educational purposes only. Discuss with your healthcare provider.",
          "",
          `*Generated by OpenPGx v${OPENPGX_VERSION} — openpgx.ai*`
        );

        return { content: [{ type: "text" as const, text: lines.join("\n") }] };
      }

      const text = `# Medication Check: ${resolvedName}\n\n${displayInfo}${brandStr}\nNo study data found locally for this drug.\n\n**Next step:** Use the \`search_drug_pgx\` tool with drug_name "${resolvedName}" to research this drug online and add it to the knowledge base.`;

      return { content: [{ type: "text" as const, text }] };
    }
  );

  // --- Tool: full_pgx_report ---
  server.registerTool(
    "full_pgx_report",
    {
      title: "Full PGx Report",
      description: "Generate a complete pharmacogenomic report with all your genes, phenotypes, and affected medication categories.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      if (!currentPatient) {
        return { content: [{ type: "text" as const, text: "No genetic profile loaded. Please use `upload_genome` first." }] };
      }

      const categories: Record<string, Array<{ pg: typeof currentPatient.pharmacogenes[0]; def: ReturnType<typeof getGeneDefinition> }>> = {};
      for (const pg of currentPatient.pharmacogenes) {
        const def = getGeneDefinition(pg.gene);
        const cat = def?.category ?? "other";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ pg, def });
      }

      const catLabels: Record<string, string> = {
        drug_metabolism: "Drug Metabolism (CYP Enzymes)",
        drug_target: "Drug Targets",
        drug_transport: "Drug Transport",
        folate_metabolism: "Folate & Methylation",
        catecholamine: "Catecholamine Metabolism",
        vitamin_receptor: "Vitamin Receptors",
        vitamin_conversion: "Vitamin Conversion",
        nutrient_absorption: "Nutrient Absorption",
        methylation: "Methylation Pathway",
        glp1_response: "GLP-1 Response (Emerging)",
      };

      const lines = [
        `# Full Pharmacogenomic Report (OpenPGx v${OPENPGX_VERSION})`,
        `**Generated:** ${new Date().toISOString().split("T")[0]}`,
        `**Source:** ${currentPatient.rawDataSource}`,
        `**Genes analyzed:** ${currentPatient.pharmacogenes.length}`,
        "",
      ];

      for (const [cat, genes] of Object.entries(categories)) {
        lines.push(`## ${catLabels[cat] ?? cat}`, "");
        for (const { pg, def } of genes) {
          lines.push(`### ${pg.gene}`);
          if (def) lines.push(`*${def.description}*`);
          lines.push(`- **Genotypes:** ${Object.entries(pg.genotypes).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
          if (pg.phenotype) lines.push(`- **Phenotype:** ${pg.phenotype}`);
          if (GENE_CONTEXTS[pg.gene]) lines.push(`- **Clinical relevance:** ${GENE_CONTEXTS[pg.gene]}`);
          lines.push("");
        }
      }

      lines.push("---", "", `*Generated by OpenPGx v${OPENPGX_VERSION} — openpgx.ai*`);
      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );

  // --- Tool: supplement_protocol ---
  server.registerTool(
    "supplement_protocol",
    {
      title: "Supplement Protocol",
      description: "Analyze genes related to supplement metabolism: MTHFR, COMT, VDR, BCMO1, FUT2, CBS. Returns personalized suggestions.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      if (!currentPatient) {
        return { content: [{ type: "text" as const, text: "No genetic profile loaded. Please use `upload_genome` first." }] };
      }

      const suppGenes = ["MTHFR", "COMT", "VDR", "BCMO1", "FUT2", "CBS"];
      const found = currentPatient.pharmacogenes.filter(pg => suppGenes.includes(pg.gene));

      if (found.length === 0) {
        return { content: [{ type: "text" as const, text: "No supplement-relevant genes found in your data." }] };
      }

      const lines = [
        `# Supplement Optimization Protocol (OpenPGx v${OPENPGX_VERSION})`,
        `**Based on:** ${currentPatient.rawDataSource}`,
        "",
      ];

      for (const pg of found) {
        const def = getGeneDefinition(pg.gene);
        lines.push(`### ${pg.gene}`);
        if (def) lines.push(`*${def.description}*`);
        lines.push(`- **Your genotype:** ${Object.entries(pg.genotypes).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
        if (pg.phenotype) lines.push(`- **Phenotype:** ${pg.phenotype}`);
        const rec = getSupplementRec(pg.gene, pg.genotypes);
        if (rec) lines.push(`- **Suggestion:** ${rec}`);
        lines.push("");
      }

      lines.push("---", "⚠️ Educational only. Verify with blood tests. Discuss with your healthcare provider.", "", `*Generated by OpenPGx v${OPENPGX_VERSION}*`);
      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );

  // --- Tool: compare_medications ---
  server.registerTool(
    "compare_medications",
    {
      title: "Compare Medications",
      description: "Compare two medications head-to-head based on your genetic profile. Supports brand names.",
      inputSchema: {
        drug1: z.string().describe("First medication (generic or brand)"),
        drug2: z.string().describe("Second medication (generic or brand)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ drug1, drug2 }) => {
      if (!currentPatient) {
        return { content: [{ type: "text" as const, text: "No genetic profile loaded. Please use `upload_genome` first." }] };
      }

      const res1 = await resolveDrugName(drug1);
      const res2 = await resolveDrugName(drug2);
      const name1 = res1.resolved ?? drug1;
      const name2 = res2.resolved ?? drug2;
      const display1 = name1 !== drug1.toLowerCase() ? `${drug1} (${name1})` : name1;
      const display2 = name2 !== drug2.toLowerCase() ? `${drug2} (${name2})` : name2;

      const text = `# Medication Comparison: ${display1} vs ${display2}\n\n## Your Genetic Profile\n\n${getPatientGeneSummary()}\n\n## Search Instructions\n\n### ${name1}\n- PharmGKB: '${name1} pharmacogenomics'\n- CPIC: check guidelines\n\n### ${name2}\n- PharmGKB: '${name2} pharmacogenomics'\n- CPIC: check guidelines\n\nCompare gene-drug associations, evidence levels, and recommendations for this genetic background.\n\n---\n*OpenPGx Cloud has pre-cached profiles for instant comparisons → openpgx.ai*`;

      return { content: [{ type: "text" as const, text }] };
    }
  );

  // --- Tool: check_risk ---
  server.registerTool(
    "check_risk",
    {
      title: "Check Disease Risk",
      description: "Check your genetic risk for a specific disease or condition. Supports: cancer, alzheimer's, diabetes, heart disease, celiac, hemochromatosis, macular degeneration, blood clots, and more.",
      inputSchema: {
        condition: z.string().describe("Disease or condition name (e.g., 'prostate cancer', 'alzheimer', 'diabetes', 'celiac')"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ condition }) => {
      if (!currentPatient) {
        return { content: [{ type: "text" as const, text: "No genetic profile loaded. Please use `upload_genome` first." }] };
      }

      const query = condition.toLowerCase();

      // 1. Direct text match
      let match = currentPatient.risks.find(r =>
        r.condition.toLowerCase().includes(query) ||
        query.includes(r.condition.toLowerCase().split(" ")[0]) ||
        r.category.toLowerCase().includes(query)
      );

      // 2. Semantic search fallback
      if (!match) {
        const semResults = await semanticSearch(condition, "risk", 3, 0.35);
        if (semResults.length > 0) {
          const bestKey = semResults[0].key.replace("risk:", "").replace(":cat", "");
          match = currentPatient.risks.find(r => r.condition === bestKey);

          if (!match && semResults.length > 1) {
            const suggestions = semResults
              .map(r => r.key.replace("risk:", "").replace(":cat", ""))
              .filter((v, i, a) => a.indexOf(v) === i);
            const available = suggestions.join(", ");
            return { content: [{ type: "text" as const, text: `# Disease Risk: "${condition}"\n\nDid you mean one of these?\n\n${suggestions.map(s => `- **${s}** (${Math.round((semResults.find(r => r.key.includes(s))?.score ?? 0) * 100)}% match)`).join("\n")}\n\nTry again with one of these condition names.` }] };
          }
        }
      }

      if (!match) {
        const available = currentPatient.risks.map(r => r.condition).join(", ");
        return { content: [{ type: "text" as const, text: `# Disease Risk: "${condition}"\n\nNo matching condition found.\n\n**Available conditions:** ${available}` }] };
      }

      return { content: [{ type: "text" as const, text: formatRiskResult(match) }] };
    }
  );

  // --- Tool: full_risk_report ---
  server.registerTool(
    "full_risk_report",
    {
      title: "Full Risk Report",
      description: "Generate a comprehensive genetic disease risk report covering all analyzed conditions: cancer, cardiovascular, neurological, metabolic, autoimmune, and more.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      if (!currentPatient) {
        return { content: [{ type: "text" as const, text: "No genetic profile loaded. Please use `upload_genome` first." }] };
      }

      if (currentPatient.risks.length === 0) {
        return { content: [{ type: "text" as const, text: "No disease risk SNPs found in your data. This may indicate limited coverage for risk variants in your raw data file." }] };
      }

      const byCategory: Record<string, RiskResult[]> = {};
      for (const r of currentPatient.risks) {
        if (!byCategory[r.category]) byCategory[r.category] = [];
        byCategory[r.category].push(r);
      }

      const lines = [
        `# Genetic Disease Risk Report (OpenPGx v${OPENPGX_VERSION})`,
        `**Generated:** ${new Date().toISOString().split("T")[0]}`,
        `**Source:** ${currentPatient.rawDataSource}`,
        `**Conditions analyzed:** ${currentPatient.risks.length}`,
        "",
        "## Summary",
        "",
      ];

      const elevated = currentPatient.risks.filter(r => r.overall_risk !== "typical" && r.overall_risk !== "reduced");
      const typical = currentPatient.risks.filter(r => r.overall_risk === "typical" || r.overall_risk === "reduced");

      if (elevated.length > 0) {
        lines.push("### Elevated Risk");
        for (const r of elevated) {
          lines.push(`- ${RISK_LABELS[r.overall_risk]} **${r.condition}** (${RISK_CATEGORY_LABELS[r.category] ?? r.category})`);
        }
        lines.push("");
      }
      if (typical.length > 0) {
        lines.push("### Typical Risk");
        for (const r of typical) {
          lines.push(`- ${RISK_LABELS[r.overall_risk]} **${r.condition}**`);
        }
        lines.push("");
      }

      lines.push("---", "", "## Detailed Analysis", "");

      for (const [cat, risks] of Object.entries(byCategory)) {
        lines.push(`## ${RISK_CATEGORY_LABELS[cat] ?? cat}`, "");
        for (const r of risks) {
          lines.push(`### ${r.condition}`);
          lines.push(`**Risk Level:** ${RISK_LABELS[r.overall_risk]}`);
          if (r.icd10) lines.push(`**ICD-10:** ${r.icd10}`);
          lines.push(`**Evidence:** ${r.evidence.level}`);
          lines.push("");

          for (const snp of r.risk_snps) {
            lines.push(`- **${snp.gene_region}** (${snp.rsid}): ${snp.your_genotype} — risk allele: ${snp.risk_allele} (OR: ${snp.odds_ratio})`);
            lines.push(`  ${snp.effect}`);
          }
          lines.push("");

          lines.push(`**Lifetime risk:** General population: ${r.lifetime_risk.general_population} | Your estimate: ${r.lifetime_risk.your_estimated}`);
          if (r.actionable) lines.push(`**Recommendation:** ${r.recommendation}`);
          lines.push("");
        }
      }

      lines.push(
        "---",
        "",
        "## Important Disclaimers",
        "",
        "1. **Genetic risk is probabilistic, not deterministic.** Having a risk allele does not mean you will develop the condition.",
        "2. **Environment matters.** Lifestyle, diet, exercise, and environmental exposures modify genetic risk significantly.",
        "3. **Family history matters.** Common variants explain only a fraction of heritable risk.",
        "4. **Population specificity.** Most GWAS were conducted in European-ancestry populations. Odds ratios may differ in other populations.",
        "5. **Not a diagnosis.** This is educational information. Clinical genetic testing requires certified laboratories.",
        "",
        `*Generated by OpenPGx v${OPENPGX_VERSION} — openpgx.ai*`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );

  // --- Tool: trait_report ---
  server.registerTool(
    "trait_report",
    {
      title: "Trait Report",
      description: "Discover your genetic traits: caffeine metabolism, lactose tolerance, muscle type, bitter taste, sleep chronotype, alcohol flush, sun sensitivity, and more.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      if (!currentPatient) {
        return { content: [{ type: "text" as const, text: "No genetic profile loaded. Please use `upload_genome` first." }] };
      }

      if (currentPatient.traits.length === 0) {
        return { content: [{ type: "text" as const, text: "No trait SNPs found in your data. This may indicate limited coverage for trait variants in your raw data file." }] };
      }

      const byCategory: Record<string, TraitResult[]> = {};
      for (const t of currentPatient.traits) {
        if (!byCategory[t.category]) byCategory[t.category] = [];
        byCategory[t.category].push(t);
      }

      const lines = [
        `# Genetic Traits Report (OpenPGx v${OPENPGX_VERSION})`,
        `**Generated:** ${new Date().toISOString().split("T")[0]}`,
        `**Source:** ${currentPatient.rawDataSource}`,
        `**Traits analyzed:** ${currentPatient.traits.length}`,
        "",
        "## Your Genetic Traits at a Glance",
        "",
      ];

      for (const t of currentPatient.traits) {
        lines.push(`| **${t.trait}** | ${t.your_phenotype} |`);
      }
      lines.push("");

      for (const [cat, traits] of Object.entries(byCategory)) {
        lines.push(`## ${TRAIT_CATEGORY_LABELS[cat] ?? cat}`, "");
        for (const t of traits) {
          lines.push(`### ${t.trait}`);
          lines.push(`**Your phenotype:** ${t.your_phenotype}`);
          lines.push(`**Evidence:** ${t.evidence.level}`);
          lines.push("");
          lines.push(t.description);
          lines.push("");

          for (const snp of t.snps) {
            lines.push(`- **${snp.gene}** (${snp.rsid}): ${snp.your_genotype} — effect allele: ${snp.effect_allele}`);
          }
          lines.push("");
          lines.push(`**Practical advice:** ${t.practical_advice}`);

          if (t.studies.length > 0) {
            lines.push("");
            lines.push("**Key studies:**");
            for (const s of t.studies) {
              lines.push(`- ${s.title} (${s.journal}, ${s.year})${s.pmid ? ` [PMID: ${s.pmid}]` : ""}`);
            }
          }
          lines.push("");
        }
      }

      lines.push(
        "---",
        "",
        "⚠️ Traits are influenced by many genes and environmental factors. These results reflect common variants with established associations.",
        "",
        `*Generated by OpenPGx v${OPENPGX_VERSION} — openpgx.ai*`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );

  // --- Tool: full_report ---
  server.registerTool(
    "full_report",
    {
      title: "Full Genomic Report",
      description: "Generate a complete genomic intelligence report covering all three modules: medications (PGx), disease risks, and traits. The most comprehensive analysis available.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      if (!currentPatient) {
        return { content: [{ type: "text" as const, text: "No genetic profile loaded. Please use `upload_genome` first." }] };
      }

      const lines = [
        `# Complete Genomic Intelligence Report (OpenPGx v${OPENPGX_VERSION})`,
        `**Generated:** ${new Date().toISOString().split("T")[0]}`,
        `**Source:** ${currentPatient.rawDataSource}`,
        `**Total SNPs extracted:** ${currentPatient.totalSnpsExtracted}`,
        `**Pharmacogenes:** ${currentPatient.pharmacogenes.length} | **Risks:** ${currentPatient.risks.length} conditions | **Traits:** ${currentPatient.traits.length}`,
        "",
        "---",
        "",
      ];

      lines.push("# Part 1: Pharmacogenomics (Medications)", "");

      const categories: Record<string, Array<{ pg: typeof currentPatient.pharmacogenes[0]; def: ReturnType<typeof getGeneDefinition> }>> = {};
      for (const pg of currentPatient.pharmacogenes) {
        const def = getGeneDefinition(pg.gene);
        const cat = def?.category ?? "other";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ pg, def });
      }

      const catLabels: Record<string, string> = {
        drug_metabolism: "Drug Metabolism (CYP Enzymes)",
        drug_target: "Drug Targets",
        drug_transport: "Drug Transport",
        folate_metabolism: "Folate & Methylation",
        catecholamine: "Catecholamine Metabolism",
        vitamin_receptor: "Vitamin Receptors",
        vitamin_conversion: "Vitamin Conversion",
        nutrient_absorption: "Nutrient Absorption",
        methylation: "Methylation Pathway",
        glp1_response: "GLP-1 Response (Emerging)",
      };

      for (const [cat, genes] of Object.entries(categories)) {
        lines.push(`## ${catLabels[cat] ?? cat}`, "");
        for (const { pg, def } of genes) {
          lines.push(`### ${pg.gene}`);
          if (def) lines.push(`*${def.description}*`);
          lines.push(`- **Genotypes:** ${Object.entries(pg.genotypes).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
          if (pg.phenotype) lines.push(`- **Phenotype:** ${pg.phenotype}`);
          if (GENE_CONTEXTS[pg.gene]) lines.push(`- **Clinical relevance:** ${GENE_CONTEXTS[pg.gene]}`);
          lines.push("");
        }
      }

      lines.push("---", "", "# Part 2: Disease Risk Assessment", "");

      if (currentPatient.risks.length > 0) {
        const elevated = currentPatient.risks.filter(r => r.overall_risk !== "typical" && r.overall_risk !== "reduced");
        const typical = currentPatient.risks.filter(r => r.overall_risk === "typical" || r.overall_risk === "reduced");

        if (elevated.length > 0) {
          lines.push("## Conditions with Elevated Risk", "");
          for (const r of elevated) {
            lines.push(`### ${r.condition} — ${RISK_LABELS[r.overall_risk]}`);
            lines.push(`*Category: ${RISK_CATEGORY_LABELS[r.category] ?? r.category} | Evidence: ${r.evidence.level}*`);
            lines.push("");
            for (const snp of r.risk_snps) {
              lines.push(`- **${snp.gene_region}** (${snp.rsid}): ${snp.your_genotype} — ${snp.effect}`);
            }
            lines.push("");
            lines.push(`**Lifetime risk:** Population: ${r.lifetime_risk.general_population} → Your estimate: ${r.lifetime_risk.your_estimated}`);
            lines.push(`**Recommendation:** ${r.recommendation}`);
            lines.push("");
          }
        }

        if (typical.length > 0) {
          lines.push("## Conditions with Typical Risk", "");
          for (const r of typical) {
            lines.push(`- **${r.condition}** — ${RISK_LABELS[r.overall_risk]} (${r.risk_snps.length} SNP(s) checked)`);
          }
          lines.push("");
        }
      } else {
        lines.push("*No risk SNPs found in your raw data.*", "");
      }

      lines.push("---", "", "# Part 3: Genetic Traits", "");

      if (currentPatient.traits.length > 0) {
        for (const t of currentPatient.traits) {
          lines.push(`### ${t.trait} — ${t.your_phenotype}`);
          lines.push(`*${t.category} | Evidence: ${t.evidence.level}*`);
          lines.push("");
          lines.push(t.description);
          lines.push("");
          lines.push(`**Advice:** ${t.practical_advice}`);
          lines.push("");
        }
      } else {
        lines.push("*No trait SNPs found in your raw data.*", "");
      }

      lines.push(
        "---",
        "",
        "## Disclaimers",
        "",
        "- This report is for **educational purposes only** and is not a medical diagnosis.",
        "- Genetic risk is **probabilistic**. Having a risk allele does not guarantee developing a condition.",
        "- **Environment, lifestyle, and family history** significantly modify genetic predispositions.",
        "- Most studies are based on **European-ancestry populations**. Results may vary for other ancestries.",
        "- Discuss significant findings with a **healthcare provider** or **genetic counselor**.",
        "",
        `*Generated by OpenPGx v${OPENPGX_VERSION} — openpgx.ai*`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );

  // --- Tool: diagnostic_all ---
  server.registerTool(
    "diagnostic_all",
    {
      title: "Complete Diagnostic Report",
      description:
        "Generate the most comprehensive genomic report available. Runs ALL modules at once: pharmacogenomics (all genes + clinical context), disease risk assessment (all 19 conditions with study citations and PMIDs), and genetic traits (all 30+ traits with studies). Includes odds ratios, evidence levels, risk allele counts, and full bibliography. This is the 'one-click full diagnostic' — the user does NOT need to ask condition by condition.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      if (!currentPatient) {
        return { content: [{ type: "text" as const, text: "No genetic profile loaded. Please use `upload_genome` first." }] };
      }

      const lines: string[] = [];
      const allStudies: Array<{ pmid: string | null; title: string; journal: string; year: number }> = [];

      // ── Header ──
      lines.push(
        `# 🧬 Complete Genomic Diagnostic Report`,
        `### OpenPGx v${OPENPGX_VERSION}`,
        "",
        `| Field | Value |`,
        `|-------|-------|`,
        `| **Generated** | ${new Date().toISOString().split("T")[0]} |`,
        `| **Source** | ${currentPatient.rawDataSource} |`,
        `| **Total SNPs extracted** | ${currentPatient.totalSnpsExtracted} |`,
        `| **Pharmacogenes** | ${currentPatient.pharmacogenes.length} |`,
        `| **Disease conditions** | ${currentPatient.risks.length} |`,
        `| **Traits** | ${currentPatient.traits.length} |`,
        "",
      );

      // ── Executive Summary ──
      const elevatedRisks = currentPatient.risks.filter(r => r.overall_risk !== "typical" && r.overall_risk !== "reduced");
      const totalRiskAlleles = currentPatient.risks.reduce((sum, r) => {
        return sum + r.risk_snps.filter(s => {
          const gt = s.your_genotype.toUpperCase();
          const ra = s.risk_allele.toUpperCase();
          return gt.includes(ra);
        }).length;
      }, 0);

      lines.push(
        "## Executive Summary",
        "",
        `- **${elevatedRisks.length}** conditions with elevated genetic risk out of ${currentPatient.risks.length} analyzed`,
        `- **${totalRiskAlleles}** risk alleles detected across all conditions`,
        `- **${currentPatient.pharmacogenes.length}** pharmacogenes profiled for drug metabolism`,
        `- **${currentPatient.traits.length}** genetic traits identified`,
        "",
      );

      if (elevatedRisks.length > 0) {
        lines.push("### ⚠️ Conditions Requiring Attention", "");
        for (const r of elevatedRisks) {
          lines.push(`- ${RISK_LABELS[r.overall_risk]} **${r.condition}** — ${r.risk_snps.filter(s => s.your_genotype.toUpperCase().includes(s.risk_allele.toUpperCase())).length} risk allele(s)`);
        }
        lines.push("");
      }

      lines.push("---", "");

      // ════════════════════════════════════════════
      // PART 1: PHARMACOGENOMICS
      // ════════════════════════════════════════════
      lines.push("# Part 1: Pharmacogenomics", "");

      const pgxCategories: Record<string, Array<{ pg: typeof currentPatient.pharmacogenes[0]; def: ReturnType<typeof getGeneDefinition> }>> = {};
      for (const pg of currentPatient.pharmacogenes) {
        const def = getGeneDefinition(pg.gene);
        const cat = def?.category ?? "other";
        if (!pgxCategories[cat]) pgxCategories[cat] = [];
        pgxCategories[cat].push({ pg, def });
      }

      const catLabels: Record<string, string> = {
        drug_metabolism: "Drug Metabolism (CYP Enzymes)",
        drug_target: "Drug Targets",
        drug_transport: "Drug Transport",
        folate_metabolism: "Folate & Methylation",
        catecholamine: "Catecholamine Metabolism",
        vitamin_receptor: "Vitamin Receptors",
        vitamin_conversion: "Vitamin Conversion",
        nutrient_absorption: "Nutrient Absorption",
        methylation: "Methylation Pathway",
        glp1_response: "GLP-1 Response (Emerging)",
      };

      for (const [cat, genes] of Object.entries(pgxCategories)) {
        lines.push(`## ${catLabels[cat] ?? cat}`, "");
        for (const { pg, def } of genes) {
          lines.push(`### ${pg.gene}`);
          if (def) lines.push(`*${def.description}*`);
          lines.push(`- **Genotypes:** ${Object.entries(pg.genotypes).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
          if (pg.phenotype) lines.push(`- **Phenotype:** ${pg.phenotype}`);
          if (GENE_CONTEXTS[pg.gene]) lines.push(`- **Clinical relevance:** ${GENE_CONTEXTS[pg.gene]}`);
          lines.push("");
        }
      }

      lines.push("---", "");

      // ════════════════════════════════════════════
      // PART 2: DISEASE RISK ASSESSMENT
      // ════════════════════════════════════════════
      lines.push("# Part 2: Disease Risk Assessment", "");
      lines.push(`*${currentPatient.risks.length} conditions analyzed with ${totalRiskAlleles} risk alleles detected*`, "");

      const riskByCategory: Record<string, RiskResult[]> = {};
      for (const r of currentPatient.risks) {
        if (!riskByCategory[r.category]) riskByCategory[r.category] = [];
        riskByCategory[r.category].push(r);
      }

      for (const [cat, risks] of Object.entries(riskByCategory)) {
        lines.push(`## ${RISK_CATEGORY_LABELS[cat] ?? cat}`, "");

        for (const r of risks) {
          lines.push(`### ${r.condition} — ${RISK_LABELS[r.overall_risk]}`);
          if (r.icd10) lines.push(`*ICD-10: ${r.icd10} | Evidence: ${r.evidence.level}*`);
          lines.push("");

          for (const snp of r.risk_snps) {
            const carriesRisk = snp.your_genotype.toUpperCase().includes(snp.risk_allele.toUpperCase());
            const marker = carriesRisk ? "⚠️" : "✅";
            lines.push(`- ${marker} **${snp.gene_region}** (${snp.rsid}): ${snp.your_genotype} — risk: ${snp.risk_allele} (OR: ${snp.odds_ratio})`);
            lines.push(`  ${snp.effect}${carriesRisk ? ` You carry ${snp.your_genotype.toUpperCase().split("").filter(a => a === snp.risk_allele.toUpperCase()).length === 2 ? "TWO copies" : "ONE copy"} of the risk allele (${snp.your_genotype}).` : ` You do NOT carry the risk allele (${snp.your_genotype}).`}`);
          }
          lines.push("");

          lines.push(`**Population risk:** ${r.lifetime_risk.general_population} → **Your estimate:** ${r.lifetime_risk.your_estimated}`);
          lines.push(`**Recommendation:** ${r.recommendation}`);

          if (r.studies && r.studies.length > 0) {
            lines.push("");
            for (const s of r.studies) {
              lines.push(`> ${s.title} (${s.journal}, ${s.year})${s.pmid ? ` — PMID: ${s.pmid}` : ""}${s.cohort_size ? ` | n=${s.cohort_size}` : ""}`);
              allStudies.push({ pmid: s.pmid, title: s.title, journal: s.journal, year: s.year });
            }
          }
          lines.push("");
        }
      }

      lines.push("---", "");

      // ════════════════════════════════════════════
      // PART 3: GENETIC TRAITS
      // ════════════════════════════════════════════
      lines.push("# Part 3: Genetic Traits", "");

      if (currentPatient.traits.length > 0) {
        // Quick-look table
        lines.push("## At a Glance", "");
        lines.push("| Trait | Your Phenotype | Category |");
        lines.push("|-------|---------------|----------|");
        for (const t of currentPatient.traits) {
          lines.push(`| ${t.trait} | ${t.your_phenotype} | ${TRAIT_CATEGORY_LABELS[t.category] ?? t.category} |`);
        }
        lines.push("");

        // Detailed by category
        const traitByCategory: Record<string, TraitResult[]> = {};
        for (const t of currentPatient.traits) {
          if (!traitByCategory[t.category]) traitByCategory[t.category] = [];
          traitByCategory[t.category].push(t);
        }

        for (const [cat, traits] of Object.entries(traitByCategory)) {
          lines.push(`## ${TRAIT_CATEGORY_LABELS[cat] ?? cat}`, "");
          for (const t of traits) {
            lines.push(`### ${t.trait}`);
            lines.push(`**Your phenotype:** ${t.your_phenotype}`);
            lines.push(`**Evidence:** ${t.evidence.level}`);
            lines.push("");
            lines.push(t.description);
            lines.push("");

            for (const snp of t.snps) {
              lines.push(`- **${snp.gene}** (${snp.rsid}): ${snp.your_genotype} — effect allele: ${snp.effect_allele}`);
            }
            lines.push("");
            lines.push(`**Practical advice:** ${t.practical_advice}`);

            if (t.studies && t.studies.length > 0) {
              lines.push("");
              for (const s of t.studies) {
                lines.push(`> ${s.title} (${s.journal}, ${s.year})${s.pmid ? ` — PMID: ${s.pmid}` : ""}`);
                allStudies.push({ pmid: s.pmid, title: s.title, journal: s.journal, year: s.year });
              }
            }
            lines.push("");
          }
        }
      } else {
        lines.push("*No trait SNPs found in your raw data.*", "");
      }

      lines.push("---", "");

      // ════════════════════════════════════════════
      // BIBLIOGRAPHY
      // ════════════════════════════════════════════
      const uniqueStudies = allStudies.filter((s, i, arr) =>
        arr.findIndex(x => x.title === s.title) === i
      );

      if (uniqueStudies.length > 0) {
        lines.push("# Bibliography", "");
        lines.push(`*${uniqueStudies.length} peer-reviewed studies cited in this report*`, "");
        const sorted = [...uniqueStudies].sort((a, b) => a.year - b.year);
        for (let i = 0; i < sorted.length; i++) {
          const s = sorted[i];
          lines.push(`${i + 1}. ${s.title}. *${s.journal}*, ${s.year}.${s.pmid ? ` PMID: ${s.pmid}` : ""}`);
        }
        lines.push("");
      }

      // ── Disclaimers ──
      lines.push(
        "---",
        "",
        "## Disclaimers",
        "",
        "- This report is for **educational purposes only** and is not a medical diagnosis.",
        "- Genetic risk is **probabilistic**. Having a risk allele does not guarantee developing a condition.",
        "- **Environment, lifestyle, and family history** significantly modify genetic predispositions.",
        "- Most studies are based on **European-ancestry populations**. Results may vary for other ancestries.",
        "- Discuss significant findings with a **healthcare provider** or **genetic counselor**.",
        "",
        `*Generated by OpenPGx v${OPENPGX_VERSION} — openpgx.ai*`
      );

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );

  // --- Tool: search_drug_pgx ---
  server.registerTool(
    "search_drug_pgx",
    {
      title: "Research Drug PGx Online",
      description: `When no local study data exists for a drug, this tool returns a structured research prompt. Use YOUR web search capability to find pharmacogenomic data, then call save_drug_research with the results.`,
      inputSchema: {
        drug_name: z.string().describe("Generic drug name to research"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ drug_name }) => {
      const patientGenes = currentPatient
        ? currentPatient.pharmacogenes.map(pg => `- **${pg.gene}**: ${Object.entries(pg.genotypes).map(([k, v]) => `${k}=${v}`).join(", ")}${pg.phenotype ? ` → ${pg.phenotype}` : ""}`).join("\n")
        : "No patient profile loaded.";

      const text = `# Research Request: ${drug_name}

## Search these sources (in order of priority):

1. **PharmGKB**: Search "${drug_name}" at https://www.pharmgkb.org — look for Clinical Annotations and Drug Label Annotations
2. **CPIC Guidelines**: Search "${drug_name} CPIC guideline" — look for gene-specific dosing recommendations
3. **PubMed**: Search "${drug_name} pharmacogenomics" OR "${drug_name} CYP polymorphism" — look for studies with rsIDs and clinical outcomes
4. **FDA Label**: Search "${drug_name} FDA label pharmacogenomics" — look for Pharmacogenomics section in drug labeling

## Patient's relevant genes:

${patientGenes}

## What to extract for EACH gene-drug association found:

- **Gene** (e.g., CYP2D6, CYP2C19, HLA-B)
- **rsID** (e.g., rs3892097) — must be a valid dbSNP ID
- **Risk allele** and **reference allele**
- **Genotype interpretations** — for each genotype (e.g., AA, AG, GG): phenotype, clinical effect, recommendation, severity
- **Evidence level**: established (CPIC Level A), moderate (CPIC B/C or PharmGKB 1A-2A), emerging (PharmGKB 2B-3), preliminary (case reports)
- **Source**: PMID, DOI, title, journal, year, cohort size, URL

## Output format — call \`save_drug_research\` with this JSON:

\`\`\`json
{
  "gene": "GENE_SYMBOL",
  "category": "drug_metabolism|drug_target|drug_transport|immune|other",
  "gene_description": "Short description of gene function",
  "drugs": ["${drug_name}"],
  "source": {
    "pmid": "12345678",
    "doi": null,
    "source_type": "pubmed|guideline|fda_label|preprint",
    "title": "Study title",
    "journal": "Journal name",
    "year": 2024,
    "cohort_size": null,
    "url": "https://...",
    "finding": "One-line summary"
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
  "evidence_level": "established|moderate|emerging|preliminary"
}
\`\`\`

**IMPORTANT**: Create one \`save_drug_research\` call PER gene-drug association found. If ${drug_name} involves CYP2D6 AND CYP2C19, make two separate calls.`;

      return { content: [{ type: "text" as const, text }] };
    }
  );

  // --- Tool: save_drug_research ---
  server.registerTool(
    "save_drug_research",
    {
      title: "Save Drug Research",
      description: "Save pharmacogenomic research from web search as a local study. Validates the data, caches it, and returns the medication check result.",
      inputSchema: {
        study_json: z.string().describe("Complete study JSON following the OpenPGx study schema"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ study_json }) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(study_json);
      } catch {
        return { content: [{ type: "text" as const, text: "Error: Invalid JSON. Please check the format and try again." }] };
      }

      // Validate required fields
      const gene = data.gene as string;
      const snps = data.snps as Array<Record<string, unknown>>;
      const source = data.source as Record<string, unknown>;

      if (!gene || typeof gene !== "string") {
        return { content: [{ type: "text" as const, text: "Error: Missing or invalid 'gene' field." }] };
      }
      if (!snps || !Array.isArray(snps) || snps.length === 0) {
        return { content: [{ type: "text" as const, text: "Error: Missing or empty 'snps' array." }] };
      }
      if (!source || !source.title || !source.url) {
        return { content: [{ type: "text" as const, text: "Error: Missing 'source' with title and url." }] };
      }

      for (const snp of snps) {
        if (!snp.rsid || typeof snp.rsid !== "string" || !/^rs\d+$/.test(snp.rsid as string)) {
          return { content: [{ type: "text" as const, text: `Error: Invalid rsid '${snp.rsid}'. Must match pattern rs[0-9]+.` }] };
        }
        if (!snp.interpretations || typeof snp.interpretations !== "object") {
          return { content: [{ type: "text" as const, text: `Error: Missing 'interpretations' for ${snp.rsid}.` }] };
        }
      }

      // Build StudyContribution
      const study: StudyContribution = {
        gene,
        category: (data.category as string) ?? undefined,
        gene_description: (data.gene_description as string) ?? undefined,
        drugs: (data.drugs as string[]) ?? undefined,
        source: {
          pmid: (source.pmid as string) ?? null,
          doi: (source.doi as string) ?? null,
          source_type: source.source_type as string,
          title: source.title as string,
          journal: (source.journal as string) ?? "",
          year: (source.year as number) ?? new Date().getFullYear(),
          cohort_size: (source.cohort_size as number) ?? null,
          url: source.url as string,
          finding: (source.finding as string) ?? "",
        },
        snps: snps.map(s => ({
          rsid: s.rsid as string,
          risk_allele: s.risk_allele as string | undefined,
          reference_allele: s.reference_allele as string | undefined,
          interpretations: s.interpretations as Record<string, SnpInterpretation>,
        })),
        evidence_level: (data.evidence_level as StudyContribution["evidence_level"]) ?? "preliminary",
      };

      // Save to cache
      const cacheDir = join(homedir(), ".openpgx", "cache", "studies");
      mkdirSync(cacheDir, { recursive: true });

      const drugs = study.drugs ?? ["unknown"];
      const filename = `${gene.toLowerCase()}_${drugs[0].toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.json`;
      writeFileSync(join(cacheDir, filename), JSON.stringify(data, null, 2));

      // Hot-reload into indexes
      ingestStudy(study);

      // Now format the result as if check_medication found data
      const lines = [
        `# Drug Research Saved: ${drugs.join(", ")} ↔ ${gene}`,
        `*Cached to ~/.openpgx/cache/studies/${filename}*`,
        `*Source: ${study.source.title} (${study.source.year})*`,
        `*Evidence level: ${study.evidence_level ?? "preliminary"} — from web search*`,
        "",
      ];

      if (currentPatient) {
        const patientGenos = currentPatient.pharmacogenes.find(pg => pg.gene === gene);
        if (patientGenos) {
          const interps = getAllInterpretations(gene, patientGenos.genotypes);
          if (interps.length > 0) {
            lines.push(`## Your Results for ${gene}`, "");
            for (const i of interps) {
              lines.push(`### ${i.rsid} — Your genotype: **${i.genotype}**`);
              lines.push(`- **Phenotype:** ${i.interpretation.phenotype}`);
              lines.push(`- **Effect:** ${i.interpretation.effect}`);
              if (i.interpretation.recommendation) lines.push(`- **Recommendation:** ${i.interpretation.recommendation}`);
              if (i.interpretation.severity && i.interpretation.severity !== "info") lines.push(`- **Severity:** ${i.interpretation.severity}`);
              lines.push("");
            }
          } else {
            lines.push(`## ${gene}`, `Your genotypes: ${Object.entries(patientGenos.genotypes).map(([k, v]) => `${k}=${v}`).join(", ")}`, "No specific interpretation matched your genotype.", "");
          }
        } else {
          lines.push(`*Note: Gene ${gene} not found in your genetic profile. The data is saved for future use.*`, "");
        }
      }

      lines.push("---", "", "⚠️ Web search data has lower confidence than curated studies. Verify with your healthcare provider.", "", `*Saved by OpenPGx v${OPENPGX_VERSION}*`);

      return { content: [{ type: "text" as const, text: lines.join("\n") }] };
    }
  );

  return server;
}
