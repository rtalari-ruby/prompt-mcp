import { z } from "zod";
import { lookup, search, allDocs } from "../kb/index.js";
import type { KbDoc } from "../kb/types.js";

const inputSchema = {
  concept: z
    .string()
    .describe(
      "Concept id or fuzzy name, e.g. 'extended-thinking', 'react', 'xml-tags'.",
    ),
};

function renderCard(doc: KbDoc): string {
  const lines: string[] = [];
  lines.push(`# ${doc.title}`);
  lines.push("");
  lines.push(`*${doc.category} · id: \`${doc.id}\`*`);
  if (doc.tags.length) lines.push(`*tags: ${doc.tags.join(", ")}*`);
  lines.push("");
  if (doc.whenToUse) {
    lines.push("## When to use");
    lines.push(doc.whenToUse);
    lines.push("");
  }
  if (doc.whenNotToUse) {
    lines.push("## When NOT to use");
    lines.push(doc.whenNotToUse);
    lines.push("");
  }
  if (doc.claudeNotes) {
    lines.push("## Claude-specific notes");
    lines.push(doc.claudeNotes);
    lines.push("");
  }
  // Body. Strip the duplicate `# Title` heading since we already showed title.
  const bodyNoTitle = doc.body.replace(/^#\s+[^\n]*\n+/, "");
  lines.push("## Reference");
  lines.push(bodyNoTitle.trim());
  lines.push("");
  if (doc.related.length) {
    lines.push("## Related");
    lines.push(doc.related.map((r) => `- \`${r}\``).join("\n"));
    lines.push("");
  }
  if (doc.sources.length) {
    lines.push("## Sources");
    lines.push(doc.sources.map((s) => `- ${s}`).join("\n"));
  }
  return lines.join("\n").trim() + "\n";
}

function renderNotFound(query: string, suggestions: KbDoc[]): string {
  const lines = [
    `# No exact match for \`${query}\``,
    "",
    "Closest matches:",
    "",
  ];
  if (suggestions.length === 0) {
    lines.push("_(none)_");
  } else {
    for (const d of suggestions) {
      const blurb = (d.whenToUse || d.body).split("\n")[0].slice(0, 100);
      lines.push(`- **${d.id}** — ${d.title}. ${blurb}`);
    }
  }
  lines.push("");
  lines.push("Try one of the ids above.");
  return lines.join("\n");
}

export const explainConceptTool = {
  name: "explain_concept",
  title: "Explain a prompting concept",
  description:
    "Look up a technique or concept in the prompt-engineering KB and return a concise reference card: TL;DR, when to use, when not to use, Claude notes, pattern, example, related concepts.",
  inputSchema,
  async handler(input: { concept: string }) {
    const concept = String(input.concept ?? "").trim();
    if (!concept) {
      return {
        markdown:
          "Pass a concept id (e.g. `chain-of-thought`, `xml-tags`, `extended-thinking`).",
        structured: { found: false },
      };
    }
    const doc = lookup(concept);
    if (doc) {
      return {
        markdown: renderCard(doc),
        structured: {
          found: true,
          id: doc.id,
          title: doc.title,
          category: doc.category,
          when_to_use: doc.whenToUse,
          when_not_to_use: doc.whenNotToUse,
          claude_notes: doc.claudeNotes,
          related: doc.related,
          sources: doc.sources,
        },
      };
    }
    const hits = search(concept, { limit: 5 });
    const suggestions = hits.length
      ? hits.map((h) => h.doc)
      : allDocs()
          .slice()
          .sort((a, b) => a.id.localeCompare(b.id))
          .slice(0, 5);
    return {
      markdown: renderNotFound(concept, suggestions),
      structured: {
        found: false,
        suggestions: suggestions.map((d) => ({ id: d.id, title: d.title })),
      },
    };
  },
};
