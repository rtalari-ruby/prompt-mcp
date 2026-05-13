# prompt-mcp

A local MCP server that gives Claude 8 Claude-native prompt-engineering tools — scaffold, improve, critique, eval, chain, generate examples, apply techniques, look up concepts — backed by a 55-file knowledge base curated from [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) and [Anthropic's prompt engineering docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/).

Use it from **Claude Code**, **Claude Desktop**, or **claude.ai web** (with one extra hop). One install, all three surfaces.

```text
  ┌──────────────────────┐         ┌─────────────────────┐
  │ Claude Code (CLI)    │ stdio  │                     │
  │ Claude Desktop       ├────────▶│   prompt-mcp        │──▶  Azure OpenAI gpt-5.5
  │ MCP Inspector        │         │   (Node, local)     │     (or Anthropic — your choice)
  └──────────────────────┘         │                     │
                                   │   8 tools           │
  ┌──────────────────────┐ HTTPS   │   55-file KB        │
  │ claude.ai web        ├────────▶│                     │
  │ (via ngrok + OAuth)  │         └─────────────────────┘
  └──────────────────────┘
```

---

## Why this exists

Most prompt-engineering tools are generic. Claude has specific levers — XML tags, `<thinking>` blocks, prefilling, document-first ordering, extended thinking — that a generic tool dilutes. The 8 tools in this server are tuned for those levers, and the KB is annotated with `claude_notes:` for every technique.

The tool calls Claude (or any model — see [providers](#provider-setup)). The MCP layer sits between your editor and your prompts so you can scaffold → critique → improve → eval without leaving chat.

---

## The 8 tools

| Slash invocation | Tool name | Purpose | Calls LLM? |
|---|---|---|---|
| "Scaffold a prompt that..." | `scaffold_prompt` | Generate a structured Claude-native prompt from a one-line task. | yes |
| "Improve this prompt..." | `improve_prompt` | Critique then rewrite an existing prompt. | yes |
| "Critique this prompt..." | `critique_prompt` | Static lint + LLM checklist review. | yes |
| "Apply `cot` / `xml-tags` / ..." | `apply_technique` | One of 10 deterministic transforms. | no |
| "Generate examples for..." | `generate_examples` | n multishot examples (with edge + negative). | yes |
| "Build an eval for..." | `build_eval` | 6–20 case eval suite + rubric + YAML. | yes |
| "Design a chain for..." | `design_chain` | Decompose a hard task into 2–10 prompt steps + mermaid diagram. | yes |
| "Explain `extended-thinking`" | `explain_concept` | KB reference card lookup. | no |

LLM tools take ~5–40s per call on `gpt-5.5` (reasoning model). Disk-cached on inputs, so re-runs are instant. See [EXAMPLES.md](./EXAMPLES.md) for worked walk-throughs of each.

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/rtalari-ruby/prompt-mcp.git
cd prompt-mcp
npm install
npm run build
```

### 2. Configure your LLM provider

Copy `.env.example` to `.env` and fill in one provider. The default is Azure OpenAI; Anthropic also works.

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# --- Option A: Azure OpenAI (default) ---
LLM_PROVIDER=azure-openai
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=gpt-5.5-3            # whatever your deployment is named
AZURE_OPENAI_API_VERSION=2024-12-01-preview

# --- Option B: HTTP server only (skip if stdio-only) ---
PROMPT_MCP_TOKEN=                            # openssl rand -hex 24
```

> **Anthropic instead?** The current client (`src/llm/client.ts`) calls Azure's Chat Completions API. Swap in `@anthropic-ai/sdk` (~20 lines of code) to use `claude-sonnet-4-6` / `claude-opus-4-7` directly. PRs welcome.

### 3. Wire into your Claude client — pick one

#### A. Claude Code (CLI / VS Code)

One command:

```bash
claude mcp add --scope user prompt node $(pwd)/dist/server.js
```

Verify:

```bash
claude mcp list
# → prompt: node /path/to/prompt-mcp/dist/server.js - ✓ Connected
```

The tools are available in every project from now on. Restart any open Claude Code sessions to pick them up.

#### B. Claude Desktop (macOS chat app)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (create it if it doesn't exist):

```json
{
  "mcpServers": {
    "prompt": {
      "command": "node",
      "args": ["<absolute-path-to-prompt-mcp>/dist/server.js"]
    }
  }
}
```

Restart Claude Desktop. The tools appear in the slash-command palette.

#### C. claude.ai web (browser chat)

Requires the HTTP transport and an OAuth wrapper — see [REMOTE.md](./REMOTE.md). For most users, Claude Desktop is the easier path and identical experience.

---

## Smoke test

After wiring, in a fresh chat:

> "Explain `chain-of-thought` from the prompt KB."

You should get a reference card with TL;DR, when-to-use, when-not-to-use, Claude-specific notes, pattern, and example. That hits `explain_concept` — KB lookup, no LLM, instant. If you see this, the connection is good.

Then try:

> "Use scaffold_prompt to build a prompt that extracts the top 3 customer pain points from a support call transcript."

First run: ~25s (gpt-5.5 reasoning). Cached after.

---

## Real example: building a 1-pager from materials

A reusable workflow for any company brief, customer-intro doc, or investor handout:

1. In Claude Code or Desktop, ask:
   > "Use scaffold_prompt to build a prompt that takes attached materials (deck, website, FAQ) and produces a 1-page markdown brief with hook, problem, solution, ICP, proof points, ask, and contact. Anti-fabrication: only claim what's in the materials."

2. The tool returns a full prompt with `{{materials}}`, `{{audience}}` placeholders, XML structure, output contract, and escape hatch.

3. Save the prompt as a template (we keep [templates/](./templates/) for this).

4. In a new chat: drag your materials in, paste the template with vars filled, send.

A worked version of this — `templates/relvino-customer-intro-1pager.md` — ships with the repo as a concrete example.

---

## Knowledge base

55 markdown files organized by category:

```
kb/
├── techniques/         (25 files: cot, few-shot, react, tot, rag, prompt-chaining, ...)
├── claude-specific/    (10 files: xml-tags, prefilling, extended-thinking, ...)
├── failure-modes/      (6 files: vague-instructions, missing-output-contract, ...)
├── checklists/         (2 files: prompt-review, eval-design)
├── applications/       (9 files: coding, function-calling, generating, ...)
└── risks/              (3 files: adversarial, biases, factuality)
```

Each file has frontmatter (`id`, `title`, `category`, `tags`, `sources`, `when_to_use`, `when_not_to_use`, `claude_notes`, `related`) and a Markdown body.

Re-pull sources:

```bash
npm run scrape                 # dair-ai + Anthropic
npx tsx scripts/enrich-kb.ts   # LLM-fill any TODO frontmatter (~$0.50 one-time)
```

Add your own technique? Drop a `kb/<category>/your-technique.md` with frontmatter. The loader picks it up on next server restart.

---

## Provider setup

Default: Azure OpenAI `gpt-5.5` deployment. The client is ~150 lines (`src/llm/client.ts`), uses `fetch` directly, has a disk cache (`.cache/llm/`).

Cost per call:
- KB tools (`explain_concept`, `apply_technique`): free, instant.
- Single-call tools (`critique_prompt`, `generate_examples`, `improve_prompt`): ~$0.005–$0.05.
- Heavy tools (`scaffold_prompt`, `design_chain`): up to ~$0.10.
- All disk-cached on inputs — re-runs are free.

Personal heavy use: under $20/month.

### Using Anthropic instead

Replace `src/llm/client.ts` (~150 lines). Keep the same `chat(messages, opts)` signature. Wire `@anthropic-ai/sdk`'s `messages.create()` underneath. Everything downstream (the 6 LLM-backed tools) is provider-agnostic.

---

## Troubleshooting

| Problem | Cause / Fix |
|---|---|
| `/mcp` doesn't show `prompt` | Server failed to start. Run `node dist/server.js < /dev/null` manually — it should print `prompt-mcp ready (8 tools, stdio)` to stderr. Errors will tell you what's missing. |
| "LLM not configured" | The server can't read `.env`. Check `AZURE_OPENAI_*` vars are present. Restart Claude Code/Desktop. |
| First LLM call is slow | Expected. `gpt-5.5` is a reasoning model: 5–40s. Subsequent identical calls hit the disk cache and return instantly. |
| Tool returns JSON-parse error | Rare. The model occasionally wraps JSON in prose. Just re-run — the cache misses on the next phrasing. |
| Want to clear the cache | `rm -rf .cache/llm`. Next runs will hit the LLM fresh. |
| KB changed but server doesn't see it | Restart Claude Code/Desktop. The KB loads once at startup. |

---

## Development

```bash
npm run dev               # tsx, no build — fastest iteration on stdio
npm run dev:http          # tsx for HTTP transport
npm run build             # tsc → dist/
npm test                  # build + smoke

# individual smokes
npx tsx scripts/smoke/run-all.ts       # MCP server lists 8 tools
npx tsx scripts/smoke/kb.ts            # KB index works
npx tsx scripts/smoke/technique.ts     # all 10 deterministic transforms
npx tsx scripts/smoke/llm-tools.ts     # all 6 LLM tools (uses cache after first run)
```

Project layout:

```
prompt-mcp/
├── src/
│   ├── server.ts            # stdio entry
│   ├── http-server.ts       # HTTP entry (claude.ai / remote)
│   ├── build-server.ts      # shared tool registration
│   ├── tools/               # 8 tool implementations
│   ├── kb/                  # loader + in-memory index
│   └── llm/                 # provider client + .env loader
├── kb/                      # 55 Markdown files (the knowledge base)
├── templates/               # ready-to-use prompt templates
├── scripts/
│   ├── scrape-*.ts          # one-shot KB scrapers
│   ├── enrich-kb.ts         # LLM fill of TODO frontmatter
│   └── smoke/               # phase smoke tests
├── README.md                # this file
├── EXAMPLES.md              # worked example per tool
├── REMOTE.md                # HTTP transport / ngrok / claude.ai web
└── .mcp.json                # Claude Code snippet template
```

---

## Security

- **Never commit `.env`.** It's in `.gitignore`. The Azure key and bearer token live there.
- The HTTP server refuses to start without `PROMPT_MCP_TOKEN` (no anonymous public access). Generate one with `openssl rand -hex 24`.
- If you fork this and run a public instance, rotate the token regularly and watch your LLM quota — the token is the only thing between the internet and your API spend.
- All LLM responses are cached on disk (`.cache/llm/`). These caches may contain prompts you've reviewed. They're gitignored, but be aware.

---

## What's in `templates/`

Concrete prompt templates that scaffold_prompt has produced or that we've hand-tuned. Use them as starting points; replace the `{{var}}` placeholders with your inputs.

- `relvino-customer-intro-1pager.md` — 1-page customer-intro brief from materials, designed for investor forward-along.

Add your own — they're just text. The pattern is: `<system>` role + `<documents>` block + `<task>` + `<constraints>` + `<output_contract>` + `<escape_hatch>`.

---

## Credits

- Knowledge base techniques: [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) (MIT). Re-organized into Claude-aware reference cards.
- Claude-specific patterns: [Anthropic's prompt-engineering docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/). Summarized and Claude-noted in this repo's KB.
- MCP SDK: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk).

---

## License

MIT. See [LICENSE](./LICENSE).
