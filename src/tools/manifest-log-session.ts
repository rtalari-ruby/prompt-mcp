import { z } from "zod";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { sessionsDir } from "../manifests/paths.js";
import { slugifyTitle, todayIso } from "../manifests/manifest.js";

const inputSchema = {
  transcript: z
    .string()
    .describe("Raw transcript text OR an absolute file path to a transcript."),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
};

type Input = {
  transcript: string;
  title?: string;
  tags?: string[];
};

export const logSessionTool = {
  name: "pf_log_session",
  title: "Log a session transcript to the KB",
  description:
    "Store a Claude Code (or atlas/Forge) session transcript under $PROMPTFORGE_HOME/sessions/ with frontmatter. Pass either the raw text or an absolute path; if it looks like an existing path the file is read.",
  inputSchema,
  handler: async (input: Input) => {
    let body = input.transcript;
    if (input.transcript.startsWith("/") && existsSync(resolve(input.transcript))) {
      body = readFileSync(resolve(input.transcript), "utf8");
    }
    const title = input.title ?? `session ${todayIso()}`;
    const tags = input.tags ?? [];
    const id = `${todayIso()}-${slugifyTitle(title)}`;
    const out = join(sessionsDir(), `${id}.md`);
    const frontmatter = [
      "---",
      `id: ${id}`,
      `title: ${title}`,
      `date: ${todayIso()}`,
      `tags: [${tags.join(", ")}]`,
      "kind: session",
      "---",
      "",
    ].join("\n");
    writeFileSync(out, frontmatter + body, "utf8");
    return {
      markdown: `Logged session **${id}** → \`${out}\` (${body.length} bytes).`,
      structured: { id, path: out, bytes: body.length },
    };
  },
};
