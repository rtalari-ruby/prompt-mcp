# prompt-mcp

A personal MCP server that exposes 8 surgical, Claude-native prompting commands behind `/prompt:*` in Claude Code.

The server's tool prompts are tailored for Claude (XML tags, prefilling, extended thinking, document-first ordering). The internal LLM that powers `scaffold`/`improve`/`critique`/etc. runs against **Azure OpenAI gpt-5.5** by default — swap to Anthropic by editing `src/llm/client.ts` if you prefer.

## Quickstart

```bash
git clone <this repo>
cd prompt-mcp
npm install
cp .env.example .env   # fill in AZURE_OPENAI_* (or ANTHROPIC_*)
npm run build
```

Then add this entry to `~/.claude.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "prompt": {
      "command": "node",
      "args": ["/Users/you/path/to/prompt-mcp/dist/server.js"]
    }
  }
}
```

Restart Claude Code. The 8 tools appear as `/prompt:scaffold_prompt`, `/prompt:improve_prompt`, etc.

> **Secrets** live in `.env` (gitignored). The server's `loadEnv()` reads it on startup, so you don't need to put keys in `.mcp.json`.

## The 8 tools

| Slash | Tool | Purpose |
|---|---|---|
| `/prompt:scaffold_prompt` | `scaffold_prompt` | Generate a Claude-native prompt from a one-line task. |
| `/prompt:improve_prompt` | `improve_prompt` | Rewrite a prompt against best practices. |
| `/prompt:critique_prompt` | `critique_prompt` | Static + LLM review against the prompt-review checklist. |
| `/prompt:apply_technique` | `apply_technique` | Apply: cot, few-shot, react, tot, self-consistency, prompt-chaining, rag, prefill, extended-thinking, xml-tags. |
| `/prompt:generate_examples` | `generate_examples` | Generate multishot examples (with edge + negative). |
| `/prompt:build_eval` | `build_eval` | Build a 6–20 case eval suite with rubric. |
| `/prompt:design_chain` | `design_chain` | Decompose a task into a multi-step prompt chain. |
| `/prompt:explain_concept` | `explain_concept` | KB lookup: TL;DR, when to use, Claude notes, pattern, example. |

## Knowledge base

Sources:
- [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) — academic taxonomy.
- [Anthropic prompt-engineering docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/) — the master "claude-prompting-best-practices" doc.
- Hand-written reference cards under `kb/claude-specific/`, `kb/failure-modes/`, `kb/checklists/`.

Re-scrape (no LLM):

```bash
npm run scrape          # dair-ai + anthropic
```

Optional LLM enrichment (fills `when_to_use` / `claude_notes` for files still marked TODO):

```bash
npx tsx scripts/enrich-kb.ts
```

Run quarterly. Output is committed to `kb/`.

## Development

```bash
npm run dev             # tsx run, no build
npm run build           # tsc → dist/
npm test                # build + smoke
npx tsx scripts/smoke/run-all.ts       # MCP server lists 8 tools
npx tsx scripts/smoke/kb.ts            # KB index works
npx tsx scripts/smoke/technique.ts     # all 10 transforms work
npx tsx scripts/smoke/llm-tools.ts     # critique → examples → scaffold → improve → eval → chain (live LLM)
```

LLM responses are cached on disk under `.cache/llm/`. Identical inputs reuse the cached answer. Delete the directory to force re-runs.

## Cost & latency

- Tools without LLM (`explain_concept`, `apply_technique`): instant, free.
- Single-LLM tools (`critique_prompt`, `generate_examples`, `improve_prompt`): ~5–20s on gpt-5.5 (reasoning model).
- Heavy tools (`scaffold_prompt`, `design_chain`): ~20–40s.
- After first call, cache hits are instant.

## Project structure

```
prompt-mcp/
├── src/
│   ├── server.ts              # MCP entry; stdio transport
│   ├── tools/                 # 8 tool implementations
│   ├── kb/                    # loader + in-memory index
│   └── llm/                   # client + env loader
├── kb/                        # knowledge base (Markdown, frontmatter)
│   ├── techniques/            # CoT, few-shot, ReAct, ToT, RAG, ...
│   ├── claude-specific/       # XML tags, prefilling, extended thinking, ...
│   ├── failure-modes/         # vague instructions, missing contract, ...
│   ├── checklists/            # prompt-review, eval-design
│   ├── applications/          # coding, function-calling, ...
│   └── risks/                 # adversarial, biases, factuality
├── scripts/
│   ├── scrape-dair-ai.ts      # one-shot scraper
│   ├── scrape-anthropic.ts    # one-shot scraper
│   ├── enrich-kb.ts           # LLM enrichment pass
│   └── smoke/                 # smoke tests per phase
└── .mcp.json                  # ready-to-copy Claude Code snippet
```
