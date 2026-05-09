# prompt-mcp

A personal MCP server that exposes 8 surgical, Claude-native prompting commands behind `/prompt:*` in Claude Code (and Claude Chat once wired).

## Quickstart (30 seconds)

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run build
```

Add to `~/.claude.json` (or this repo's `.mcp.json`):

```json
{
  "mcpServers": {
    "prompt": {
      "command": "node",
      "args": ["/absolute/path/to/prompt-mcp/dist/server.js"],
      "env": { "ANTHROPIC_API_KEY": "..." }
    }
  }
}
```

Restart Claude Code. The 8 tools appear as `/prompt:scaffold`, `/prompt:improve`, etc.

## Tools

| Slash command | Tool | Purpose |
|---|---|---|
| `/prompt:scaffold` | `scaffold_prompt` | Generate a structured Claude-native prompt from a one-line task. |
| `/prompt:improve` | `improve_prompt` | Rewrite an existing prompt against best practices. |
| `/prompt:critique` | `critique_prompt` | Static + LLM-assisted review against a checklist. |
| `/prompt:technique` | `apply_technique` | Apply one of: cot, few-shot, react, tot, self-consistency, prompt-chaining, rag, prefill, extended-thinking, xml-tags. |
| `/prompt:examples` | `generate_examples` | Generate multishot examples (with edge + negative cases). |
| `/prompt:eval` | `build_eval` | Build a 10–20 case eval suite with rubric. |
| `/prompt:chain` | `design_chain` | Decompose a complex task into a multi-step prompt chain. |
| `/prompt:explain` | `explain_concept` | KB lookup: TL;DR, when to use, Claude notes, pattern, example. |

## Knowledge base

Sources:
- [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) (academic taxonomy)
- [Anthropic prompt engineering docs](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/)

Scrape with:

```bash
npm run scrape
```

Re-run quarterly. Output lives under `kb/`.

## Development

```bash
npm run dev    # tsx run, no build step
npm run build  # tsc → dist/
npm test       # build + smoke tests
```
