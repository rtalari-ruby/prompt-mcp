# prompt-mcp

8 Claude-native prompting commands behind a local MCP server. Use it from Claude Code (CLI or IDE) to scaffold, improve, critique, eval, and chain prompts — without leaving your editor.

> **Stack:** TypeScript MCP server (stdio), Azure OpenAI gpt-5.5 for the LLM-backed tools, 55-file local knowledge base.

---

## Activate (3 steps, ~2 minutes)

### 1. Build (one-time)

```bash
cd /Users/rahulraju93/Documents/GitHub/prompt-mcp
npm install
npm run build
```

You should see `dist/server.js`.

### 2. Tell Claude Code about the server

Open `~/.claude.json` and add this entry under `mcpServers` (create the field if it doesn't exist):

```json
{
  "mcpServers": {
    "prompt": {
      "command": "node",
      "args": ["/Users/rahulraju93/Documents/GitHub/prompt-mcp/dist/server.js"]
    }
  }
}
```

The server reads its API key from `prompt-mcp/.env` (already configured, gitignored). You don't need to put the key in `~/.claude.json`.

### 3. Restart Claude Code

Quit and re-launch (or `claude --reset` if you have a session open). Verify:

```
/mcp
```

You should see `prompt` listed with status **connected** and 8 tools.

---

## Use it

You can drive the tools two ways. Both work; pick whichever feels natural.

### A. Natural language (recommended)

Just describe what you want. Claude routes to the right tool.

> "Scaffold me a prompt that extracts product attributes from a PDP and returns JSON."

> "Critique this prompt: `Analyze this and improve it.`"

> "Explain extended-thinking from the prompt KB."

### B. Direct tool call

If you want to be explicit, name the tool. Claude Code exposes MCP tools as `mcp__prompt__<tool>`:

> "Run `mcp__prompt__scaffold_prompt` with task='extract product attributes' and output_format='json'."

---

## The 8 tools at a glance

| Tool | What it does | Has LLM | Latency |
|---|---|---|---|
| `scaffold_prompt` | One-line task → full Claude-native prompt with XML tags, examples slot, output contract. | yes | ~25s |
| `improve_prompt` | Existing prompt → critiqued + rewritten with rationale. | yes | ~20s |
| `critique_prompt` | Static lint + LLM checklist review. | yes | ~10s |
| `apply_technique` | Apply one of: `cot`, `few-shot`, `react`, `tot`, `self-consistency`, `prompt-chaining`, `rag`, `prefill`, `extended-thinking`, `xml-tags`. Pure transform. | no | instant |
| `generate_examples` | n multishot examples (with edge + negative cases) as XML. | yes | ~6s |
| `build_eval` | 6–20 case eval suite + rubric + YAML. | yes | ~15s |
| `design_chain` | Complex task → 2–10 step prompt chain with mermaid diagram. | yes | ~35s |
| `explain_concept` | KB lookup. TL;DR, when to use, Claude notes, pattern, example. | no | instant |

See **[EXAMPLES.md](./EXAMPLES.md)** for a worked example of each.

---

## Common workflows

| Goal | Tools, in order |
|---|---|
| Build a prompt from scratch | `scaffold_prompt` → `generate_examples` → `critique_prompt` |
| Fix a flaky prompt | `critique_prompt` → `improve_prompt` |
| Ship a prompt to production | `scaffold_prompt` → `improve_prompt` → `build_eval` |
| Decompose a hard task | `design_chain` → `scaffold_prompt` per step |
| Look up a technique | `explain_concept` |
| Quick structure fix | `apply_technique` (cot, xml-tags, prefill) |

---

## Troubleshooting

**Tools don't show up after restart**
- Run `/mcp` in Claude Code. If `prompt` is missing, the path in `~/.claude.json` is wrong or `dist/server.js` doesn't exist. Run `npm run build`.
- If status is **failed**, run the server manually: `node /Users/rahulraju93/Documents/GitHub/prompt-mcp/dist/server.js < /dev/null` — it should print `prompt-mcp ready (8 tools)` to stderr and hang. If it errors, the message tells you what's wrong.

**LLM-backed tools return "LLM not configured"**
- The server can't read `.env`. Make sure `prompt-mcp/.env` exists with `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`. Compare against `.env.example`.

**Tool calls feel slow on first run**
- Expected. gpt-5.5 is a reasoning model. After the first run, identical inputs hit the disk cache (`.cache/llm/`) and return instantly.

**KB content is stale**
- `npm run scrape` re-pulls dair-ai and Anthropic docs.
- `npx tsx scripts/enrich-kb.ts` re-fills any TODO frontmatter via LLM.

---

## Cost & limits

- KB tools (`explain_concept`, `apply_technique`): free, instant.
- LLM tools: ~$0.005–$0.05 per call against gpt-5.5. Cached on disk, so iterative runs are free.
- Heaviest tool (`design_chain`): ~$0.10 worst case.

---

## Project layout

```
prompt-mcp/
├── src/server.ts           # MCP entry (stdio)
├── src/tools/              # 8 tool implementations
├── src/kb/                 # loader + in-memory index
├── src/llm/                # Azure OpenAI client + .env loader
├── kb/                     # 55 markdown files (techniques, claude-specific, failure-modes, ...)
├── scripts/scrape-*.ts     # one-shot KB scrapers
├── scripts/enrich-kb.ts    # LLM-fill TODO frontmatter
├── scripts/smoke/          # phase tests
└── .mcp.json               # ready-to-copy snippet
```

Smoke tests (run any time):

```bash
npx tsx scripts/smoke/run-all.ts       # MCP server lists 8 tools
npx tsx scripts/smoke/kb.ts            # KB index works
npx tsx scripts/smoke/technique.ts     # 10 transforms
npx tsx scripts/smoke/llm-tools.ts     # all 6 LLM tools (uses cache after first run)
```

---

See **[EXAMPLES.md](./EXAMPLES.md)** for end-to-end usage walk-throughs.
