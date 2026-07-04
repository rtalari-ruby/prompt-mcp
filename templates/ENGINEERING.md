# Engineering templates

Reusable prompts for everyday engineering work. **You do not need the prompt-mcp server wired to use these** — they're plain markdown. Open Claude Code in your repo, copy the block under "The prompt" in any file below, fill the one labeled input if there is one, and send.

Every template is designed to be **low-variable**: it auto-detects the repo (current working tree), the branch, the PR (where relevant), and the test/lint command (from `package.json` / `Makefile` / `pyproject.toml` / `go.mod`). Most spawn parallel sub-agents where it helps and end with an explicit verdict.

| Template | What it does | Fill-in |
|---|---|---|
| [`fix-bug.md`](./fix-bug.md) | Reproduce with a failing test → isolate → fix → confirm green. | `{{bug}}` (or a failing test) |
| [`refactor.md`](./refactor.md) | Behavior-preserving cleanup. Tests green before + after, small commits. | `{{target}}` |
| [`implement-feature.md`](./implement-feature.md) | Clarify criteria → plan → implement → test → self-review. | `{{feature}}` |
| [`review-pr.md`](./review-pr.md) | Multi-lens review (correctness/security/perf/readability/tests) → verdict. | none (auto-detects PR) |
| [`handoff-feedback.md`](./handoff-feedback.md) | Use a colleague's feedback → fix → PR description + Slack message back. | `{{colleague_name}}` + feedback |
| [`bugbot-loop.md`](./bugbot-loop.md) | Loop fetch→classify→fix→verify→push→wait until Bugbot is clean. | none (auto-detects PR) |
| [`modularize-cleanup.md`](./modularize-cleanup.md) | Delete proven-dead code + modularize an area, behavior-preserving. | `{{scope}}` |

## The shared shape

Every prompt follows the same contract so the output is predictable:

- **Role line** — senior engineer, rigorous, evidence-cited, never claims done without proof.
- **`<context>`** — sensible defaults (repo = cwd, tests auto-detected, branch = current).
- **`<workflow>`** — numbered steps; parallel sub-agents where the work is independent.
- **`<output_contract>`** — numbered markdown sections the model must return.
- **`<escape_hatch>`** — asks for the specific missing piece instead of guessing.
- **Private reasoning** — thinks privately, returns only the contracted report.

## Tips

- **Open Claude Code in the actual repo.** These templates read and edit files; they need file access to do real work (diffs, not plans).
- **Chain them.** `implement-feature.md` → then `review-pr.md` → then `bugbot-loop.md` is a full ship cycle.
- **Tune once.** If a template's rubric or steps don't fit your stack, edit the file — it's yours. Or ask Claude: *"Use `critique_prompt` then `improve_prompt` on this, focus on <x>."*
