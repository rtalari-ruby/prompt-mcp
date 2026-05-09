import { z } from "zod";
import { complete, llmConfigured, extractJson, LlmError } from "../llm/client.js";
import { lookup } from "../kb/index.js";

const inputSchema = {
  prompt: z.string().describe("The prompt to critique."),
};

export type Severity = "blocker" | "major" | "minor" | "nit";
export type Finding = {
  severity: Severity;
  category: string;
  finding: string;
  suggested_fix: string;
};

const SEVERITY_ORDER: Record<Severity, number> = {
  blocker: 0,
  major: 1,
  minor: 2,
  nit: 3,
};

/** Static checks that don't need an LLM. Cheap, complementary to the LLM pass. */
function staticChecks(prompt: string): Finding[] {
  const findings: Finding[] = [];
  const text = prompt.trim();
  const lower = text.toLowerCase();

  // 1. Output contract
  const expectsJson = /\bjson\b/i.test(text);
  const hasFormatBlock = /(output[_\s-]?(format|schema)|return only|return ONLY)/i.test(text);
  if (expectsJson && !/[{[]/.test(text)) {
    findings.push({
      severity: "major",
      category: "missing-output-contract",
      finding:
        "Prompt mentions JSON but does not show a schema or example object/array.",
      suggested_fix:
        "Add a JSON schema or example. End with 'Return ONLY the JSON object. No prose.'",
    });
  }
  if (!hasFormatBlock && /\b(return|output|reply|respond)\b/.test(lower) && text.length > 200) {
    findings.push({
      severity: "minor",
      category: "missing-output-contract",
      finding: "No explicit output format / 'Return ONLY ...' discipline.",
      suggested_fix:
        "State the exact output shape. Add 'Return ONLY <format>. No prose.'",
    });
  }

  // 2. XML structure
  const sections = text.split(/\n\s*\n/).length;
  const hasXmlTags = /<[a-z_][a-z0-9_-]*>/i.test(text);
  if (sections > 2 && !hasXmlTags) {
    findings.push({
      severity: "major",
      category: "structure",
      finding:
        "Multi-section prompt without XML tags to delimit sections (input, examples, instructions).",
      suggested_fix:
        "Wrap each section in tags: <input>, <examples>, <task>, <output_schema>. See claude-specific/xml-tags.",
    });
  }

  // 3. Vague verbs
  for (const m of [
    /\banalyze\b/i,
    /\bsummarize\b/i,
    /\bimprove\b/i,
    /\boptimize\b/i,
    /\bhelp me\b/i,
  ]) {
    if (m.test(text)) {
      findings.push({
        severity: "minor",
        category: "vague-instructions",
        finding: `Vague verb detected (${m.source}). Generic verbs underspecify the task.`,
        suggested_fix:
          "Replace with concrete verbs + criteria. E.g., 'list', 'classify into [...]', 'rate 1–5 against criteria X, Y, Z'.",
      });
      break;
    }
  }

  // 4. Escape hatch
  if (!/(if .* (ambiguous|unclear|empty|off.topic|unsupported))|(don't guess)|(low.?confidence)/i.test(
    text,
  )) {
    findings.push({
      severity: "minor",
      category: "missing-escape-hatch",
      finding:
        "No explicit instruction for what to do when input is empty, off-topic, or ambiguous.",
      suggested_fix:
        "Add an escape hatch: 'If <input> is ambiguous or off-topic, return {...low-confidence form...}.'",
    });
  }

  // 5. Ambiguous pronouns
  const pronounMatches = (text.match(/\b(this|it|that|the above|the below)\b/gi) ?? []).length;
  if (pronounMatches >= 3) {
    findings.push({
      severity: "nit",
      category: "ambiguous-pronouns",
      finding: `${pronounMatches} ambiguous references ("this", "it", "above"). Likely under-specified antecedents.`,
      suggested_fix:
        "Replace with named tag references: <input>, <document index='1'>, <example>.",
    });
  }

  // 6. Persona theatre
  if (/you are a (passionate|enthusiastic|expert) /i.test(text)) {
    findings.push({
      severity: "nit",
      category: "persona-theatre",
      finding: "Persona prose (passionate/enthusiastic/expert) without measurable rules.",
      suggested_fix:
        "Replace adjectives with concrete rules ('you cite line numbers', 'you flag low confidence').",
    });
  }

  return findings;
}

const SYSTEM = `You are a senior prompt-engineering reviewer. You audit prompts intended for
Claude (Opus 4.7 / Sonnet 4.6). Apply this checklist rigorously:

- Role specified (system prompt or first turn)?
- XML tags used to delimit document/examples/task/output?
- Output contract specified (schema/example/length)?
- 3+ examples present when output format/edge handling matters? At least
  one edge case and one negative example?
- Escape hatch defined for empty/off-topic/ambiguous input?
- Conflicting instructions resolved or priority documented?
- Multi-step task uses extended thinking or explicit <thinking>?
- Concrete verbs (no vague "analyze"/"improve")?
- Claude-specific levers used (XML, prefill, document-first ordering)?

Return strict JSON, no prose, no markdown fences. Schema:
{
  "findings": [
    {
      "severity": "blocker" | "major" | "minor" | "nit",
      "category": "<short kebab-case>",
      "finding": "<one sentence — what's wrong>",
      "suggested_fix": "<one sentence — what to do>"
    }
  ],
  "summary": "<one paragraph — overall verdict and top 2 fixes>"
}

Use "blocker" only when output will be wrong or unparseable.
Use "major" when quality will materially degrade.
Use "minor" for clarity issues.
Use "nit" for style/preference.
Avoid duplicating findings the static linter has already flagged (the user
will receive both lists). Focus on substantive issues a linter can't see.`;

function buildUser(prompt: string, staticFindings: Finding[]): string {
  return [
    `<prompt_under_review>`,
    prompt.trim(),
    `</prompt_under_review>`,
    "",
    `<static_findings_already_reported>`,
    staticFindings.length === 0
      ? "(none)"
      : staticFindings
          .map(
            (f) =>
              `- [${f.severity}] ${f.category}: ${f.finding}`,
          )
          .join("\n"),
    `</static_findings_already_reported>`,
  ].join("\n");
}

function renderFindings(findings: Finding[], summary: string): string {
  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const lines: string[] = [];
  lines.push(`# Critique`);
  lines.push("");
  if (summary) {
    lines.push(`**Summary:** ${summary.trim()}`);
    lines.push("");
  }
  if (findings.length === 0) {
    lines.push("_No findings. The prompt looks solid._");
    return lines.join("\n");
  }
  const counts: Record<Severity, number> = { blocker: 0, major: 0, minor: 0, nit: 0 };
  for (const f of findings) counts[f.severity]++;
  lines.push(
    `**Counts:** ${counts.blocker} blocker · ${counts.major} major · ${counts.minor} minor · ${counts.nit} nit`,
  );
  lines.push("");
  for (const f of findings) {
    lines.push(`## [${f.severity}] ${f.category}`);
    lines.push(f.finding);
    lines.push(`*Fix:* ${f.suggested_fix}`);
    const ref = lookup(f.category);
    if (ref) lines.push(`*Reference:* \`${ref.id}\` (${ref.title})`);
    lines.push("");
  }
  return lines.join("\n");
}

export const critiquePromptTool = {
  name: "critique_prompt",
  title: "Critique a prompt",
  description:
    "Review a prompt against a Claude-aware checklist of failure modes: vague instructions, missing examples or output contract, missing role, ambiguous pronouns, conflicting instructions.",
  inputSchema,
  async handler(input: { prompt: string }) {
    const prompt = String(input.prompt ?? "").trim();
    if (!prompt) {
      return {
        markdown: "Pass a `prompt` string to critique.",
        structured: { findings: [], summary: "no prompt provided" },
      };
    }
    const staticFindings = staticChecks(prompt);
    let llmFindings: Finding[] = [];
    let summary = "";
    if (llmConfigured()) {
      try {
        const out = await complete(SYSTEM, buildUser(prompt, staticFindings), {
          maxTokens: 4096,
          cacheKey: `critique:${prompt}`,
        });
        const parsed = extractJson<{ findings: Finding[]; summary?: string }>(out);
        llmFindings = (parsed.findings ?? []).filter((f) => f && f.severity);
        summary = parsed.summary ?? "";
      } catch (err) {
        if (err instanceof LlmError) {
          summary = `(LLM check skipped: ${err.message})`;
        } else throw err;
      }
    } else {
      summary =
        "(LLM check skipped: no AZURE_OPENAI_API_KEY in env. Static lint only.)";
    }
    const allFindings = [...staticFindings, ...llmFindings];
    return {
      markdown: renderFindings(allFindings, summary),
      structured: { findings: allFindings, summary },
    };
  },
};
