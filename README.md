# prompt-mcp

A local MCP server that gives Claude 8 Claude-native prompt-engineering tools — scaffold, improve, critique, eval, chain, generate examples, apply techniques, look up concepts — backed by a 55-file knowledge base curated from [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) and [Anthropic's prompt engineering docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/).

**No API key required** by default. The tools use **MCP sampling** to call back into the same Claude that's running your session (Claude Code or Desktop). Optional Azure OpenAI fallback for environments that don't support sampling.

```text
  ┌──────────────────────┐         ┌─────────────────────┐
  │ Claude Code          │  stdio  │                     │  sampling/createMessage
  │ Claude Desktop       │◀────────│   prompt-mcp        │◀──────────┐
  └─────┬────────────────┘         │   (Node, local)     │           │
        │                          │                     │           │
        │ user says "scaffold a    │   8 tools           │           │
        │ prompt for..."           │   55-file KB        │           │
        ▼                          └─────────────────────┘           │
   tool call ─────────────────────────────────────────────────────────┘
   (the tool asks the host Claude to do the LLM work — zero extra cost)


  optional, only when sampling isn't available:
                                   ┌─────────────────────┐
                                   │   prompt-mcp        │──▶  Azure OpenAI gpt-5.5
                                   └─────────────────────┘     (your key)
```

---

## Why this exists

Most prompt-engineering tools are generic. Claude has specific levers — XML tags, `<thinking>` blocks, prefilling, document-first ordering, extended thinking — that a generic tool dilutes. The 8 tools in this server are tuned for those levers, and the KB is annotated with `claude_notes:` for every technique.

The tool calls Claude (or any model — see [providers](#provider-setup)). The MCP layer sits between your editor and your prompts so you can scaffold → critique → improve → eval without leaving chat.

---

## When to use this (and when NOT to)

> Honest take from someone who built the tool: **most prompting should stay free-range.** Reach for prompt-mcp only when you've typed the same prompt 3+ times and gotten slightly different output each time.

**Default to free-range.** Just type what you want to Claude.

- One-off tasks
- Exploration ("I'm not sure what I want yet")
- Quick Q&A, summaries, rewrites
- Creative writing where surprise matters
- Anything where Claude's clarifying questions are useful

**Reach for prompt-mcp when 2+ of these are true:**

- You'll run the task **3+ times**
- Someone else needs to run it and get the *same shape* output
- Output is **parsed or consumed** by another tool (eval runner, doc generator, downstream prompt)
- **Failure has real cost** (investor doc, customer email, legal review, financial check)
- You want to **schedule or automate** it
- You've already felt the prompt drift between attempts

### Concrete examples

| Task | Templated? |
|---|---|
| "Rewrite this paragraph less corporately" | No — free-range, one shot |
| "What are the 3 biggest objections from a Series B partner?" | No — exploration |
| Weekly investor update | Yes — recurring + multi-stakeholder |
| Discovery call prep | Yes — recurring, team uses it |
| Monthly Fireflies call review | Yes — multi-step + parseable contracts |
| Customer-intro 1-pager | Yes — you'll send N of these |
| Financial-model pressure-test | Yes — high stakes + evidence rules required |
| Data-room DD audit | Yes — repeat per investor + consistency matters |
| "Brainstorm a Series B pitch narrative" | No — creative, exploratory |
| Candidate rejection email | Yes if you reject >2/week, otherwise no |

> The tool's biggest risk is becoming engineering theatre. Building a perfect prompt for something you'll do once is procrastination. The value shows up in the 2nd, 5th, 20th run.
>
> **Don't template prematurely. Don't free-range the things you do every week.**

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

That's it for the default flow. **No `.env` setup needed** — the tools will use your running Claude session via MCP sampling. Skip to step 2.

### 2. Wire into your Claude client — pick one

### A. Claude Code (CLI / VS Code)

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

### B. Claude Desktop (macOS chat app)

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

### C. claude.ai web (browser chat)

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

## How the LLM tools get their model

Two backends, chosen automatically at call time:

### Default: MCP sampling (no setup, no key)

When a tool runs inside Claude Code or Claude Desktop, it calls `sampling/createMessage` back through the MCP transport. The host Claude does the LLM work using whichever model your session is running. The tool gets the response and renders it.

- **Cost:** counted against your existing Claude subscription. No separate API spend.
- **Key:** none required.
- **Model:** whatever you're running in the session (Opus / Sonnet / Haiku).
- **UX note:** the host may show a one-time approval per session ("the prompt server wants to ask Claude to do X — allow?"). Approve once; it remembers.

### Fallback: Azure OpenAI (or any chat-completions API)

For environments without sampling support (HTTP server hit directly, scripts like `enrich-kb.ts`, future raw MCP clients), the server falls back to whatever's configured in `.env`:

```bash
LLM_PROVIDER=azure-openai
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=gpt-5.5-3
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

The Azure backend uses the chat-completions REST API directly via `fetch` — no SDK, no provider abstraction.

### Cost (only applies to the fallback path)

- KB tools (`explain_concept`, `apply_technique`): free, instant either way.
- Single-call LLM tools: ~$0.005–$0.05 per call on `gpt-5.5`.
- Heavy LLM tools: up to ~$0.10.
- All disk-cached on inputs — re-runs are free.

When using sampling, your tool calls show up in your Claude usage instead. No new bill.

### Using Anthropic for the fallback

Replace `src/llm/client.ts` (~150 lines). Keep the same `chat(messages, opts)` signature. Wire `@anthropic-ai/sdk`'s `messages.create()` underneath. Everything downstream is provider-agnostic.

---

## Troubleshooting

| Problem | Cause / Fix |
|---|---|
| `/mcp` doesn't show `prompt` | Server failed to start. Run `node dist/server.js < /dev/null` manually — it should print `prompt-mcp ready (8 tools, stdio)` to stderr. Errors will tell you what's missing. |
| "no sampling-capable host and no AZURE_OPENAI_* in env" | Your MCP client doesn't support sampling AND you haven't set up the Azure fallback. Either upgrade Claude Code/Desktop, or add `AZURE_OPENAI_*` to `.env`. |
| Sampling permission prompt every call | Some hosts ask once per session, some ask each time. Look in your Claude Code settings for a "trust this MCP server's sampling" toggle. |
| First LLM call is slow | Expected. The host's reasoning model can take 5–40s on heavy tools. Subsequent identical calls hit the disk cache and return instantly. |
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

## Ready-made templates

Drop-in prompts under [`templates/`](./templates) — copy, fill the `{{vars}}`, send. Each was produced by `scaffold_prompt` (or `scaffold` → `improve`) and hardened with the patterns in [EXAMPLES.md](./EXAMPLES.md).

- 📞 **[`fireflies-call-analysis.md`](./templates/fireflies-call-analysis.md)** — Audit every Fireflies meeting transcript in a date range. Classifies each as Sales / Customer / Internal / Other, scores Sales+Customer calls across 5 quality dimensions with cited evidence, produces per-call action items, then rolls up into a team-level scorecard with the top systemic gaps and 5 prioritized team-wide actions. Built as a 5-step chain with strict JSON contracts between steps.
- 🤝 **[`relvino-customer-intro-1pager.md`](./templates/relvino-customer-intro-1pager.md)** — One-page customer-intro brief that an investor will forward to companies in their network. Anti-fabrication: only claims what's actually in the attached materials. Escape hatch if materials are insufficient.
- 💰 **[`financial-model-pressure-test.md`](./templates/financial-model-pressure-test.md)** — Unbiased CFO-grade pressure-test of a financial model AND an analyst's written feedback on it. Evidence-cited PASS / CONDITIONAL_PASS / FAIL verdict, materiality-ranked findings, max 5 bullets per section, three confidence levels, escape hatch when inputs are unparseable.
- 🗄️ **[`relvino-data-room-audit.md`](./templates/relvino-data-room-audit.md)** — Full due-diligence audit of a data room folder. G/Y/R scorecard across 10 categories, file-cited gaps and risks, diligence-blocker list, quick-fix list (≤1 week), and pre-empted "open questions for management."

Add your own — they're just markdown. The pattern is: `<system>` role + `<documents>` block + `<task>` + `<constraints>` + `<output_contract>` + `<escape_hatch>`.

### How to use one

1. Open Claude Code or Claude Desktop.
2. Drag in any source materials (PDFs, docs, spreadsheets).
3. Open the template file, copy the section between the triple backticks labeled "The prompt".
4. Paste into Claude. Replace each `{{var}}` with your input (or write "see attached files").
5. Send.

For iterating on a template (tighten tone, add a section, change the rubric), say:

> "Use `critique_prompt` on this prompt, then `improve_prompt`. Focus on `<your focus>`."

You'll get a diff with what changed and why.

---

## Credits

- Knowledge base techniques: [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) (MIT). Re-organized into Claude-aware reference cards.
- Claude-specific patterns: [Anthropic's prompt-engineering docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/). Summarized and Claude-noted in this repo's KB.
- MCP SDK: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk).

---

## License

MIT. See [LICENSE](./LICENSE).
