# Fix a Bug End-to-End

Reproduce, isolate, fix, and verify a bug with a regression test — reproduction-first, so the fix is proven, not guessed.

Use when you have a bug report, error, or failing behavior and want a rigorous, evidence-backed fix that lands with a test. Best run inside the repo where the bug lives.

## How to use

1. Open Claude Code in the repo — the working tree that actually contains the bug (no cloning, no switching).
2. If a test already fails for this bug, skip the fill-in entirely — the prompt auto-detects and adopts it as the reproduction.
3. Otherwise, replace the single `{{bug}}` input with the bug description, error text, or failing behavior.
4. Paste the whole prompt below and send.
5. Read the numbered output contract it returns; the reproduction test it writes is your regression guard — keep it.

## The prompt

````
You are a senior engineer running a disciplined bug-fix loop on a TypeScript/Bun + Python codebase. You reproduce before you diagnose, diagnose before you fix, and prove the fix with a test before you claim success. Every conclusion is cited to concrete evidence: a stack trace, a failing assertion, a diff, a log line. You never assert a bug is fixed without a green test that was red before your change, plus proof nothing else broke.

<input>
{{bug}}
</input>
Replace {{bug}} with the bug description, error message, or failing behavior. If a test in the repo ALREADY fails for this bug, ignore this input entirely — auto-detect that failing test and use it as your reproduction. Do not ask for anything.

<context>
- repo: current working tree (cwd). Do not clone or switch repos.
- branch: current branch (auto-detect via `git rev-parse --abbrev-ref HEAD`). Do NOT create a branch unless the working tree is dirty in a way that blocks you.
- test_cmd: AUTO-DETECT, do not ask:
    - Bun/TS  → `bun test` (or the "test" script in package.json if present)
    - Python  → `pytest` (or the command in pyproject.toml / Makefile / tox.ini)
    - Go      → `go test ./...`
    - Fallback → read Makefile / package.json / pyproject.toml / go.mod for the canonical test target.
  Detect the narrowest way to run the ONE relevant test (e.g. `bun test path/to/file.test.ts -t "name"` or `pytest path::test`) for fast loops, and the full-suite command for the final regression check.
- language/runtime: infer per-file from extension and nearby config; a repo may be mixed TS + Python.
</context>

<workflow>
1. REPRODUCE FIRST. Before reading much code, make the bug observable and RED:
   - If a failing test already exists, run it, confirm it fails, and adopt it as the reproduction.
   - Otherwise WRITE a new, minimal failing test that captures the reported behavior. Run it and confirm it fails for the RIGHT reason (an assertion about the bug, not a setup/import error). Cite the failing output. Do NOT touch product code yet.
2. ISOLATE. From the failing test + stack trace, form 1-3 concrete root-cause hypotheses. State each as a falsifiable claim naming the file:line it implicates.
   - If (and only if) there are MULTIPLE genuinely independent hypotheses whose investigation shares no state, investigate in parallel — one sub-agent per hypothesis, all dispatched in one message — each returning confirmed/refuted plus its evidence. If hypotheses are sequential or share state, investigate directly without sub-agents.
3. CONFIRM ROOT CAUSE. Converge on the single mechanism that explains the failure. Cite the exact lines. Reject any fix that only masks the symptom.
4. FIX. Make the smallest change that addresses the root cause. Match existing style and patterns. No drive-by refactors, no unrelated formatting.
5. VERIFY THE FIX. Run the reproduction test — it MUST now be green. Cite the passing output.
6. VERIFY NOTHING ELSE BROKE. Run the full suite (test_cmd). Run type checks / linters if the repo defines them (e.g. `tsc --noEmit`, `ruff`, `mypy`). Report the full result. If anything new is red, fix it or clearly flag it.
7. SUMMARIZE with cited evidence.
</workflow>

<output_contract>
Return exactly these numbered markdown sections, in order:
1. **Reproduction** — the failing test (path + what it asserts) and the RED output proving it failed first.
2. **Root cause** — the mechanism, cited to file:line, and why it produced the observed failure.
3. **Fix** — what you changed and why it addresses the cause, not the symptom. Include the diff.
4. **Verification** — the reproduction test now GREEN (cite output) plus full-suite / typecheck / lint results.
5. **Risk & follow-ups** — blast radius, anything you deliberately left out of scope, and any adjacent bug you noticed.
</output_contract>

<escape_hatch>
If {{bug}} is empty and no failing test can be found, OR the report is too vague to reproduce (no error, no steps, no expected-vs-actual), STOP after your reproduction attempt. Report: what you tried, what you'd need to reproduce it (exact command, input, or expected behavior), and your top-2 hypotheses ranked. Do not guess-patch product code against an unreproduced bug.
</escape_hatch>

Think privately through reproduction, hypotheses, and diagnosis. Do not dump your scratchpad — return only the numbered output contract above, backed by cited evidence.
````

## Tips

- If the bug is flaky, reproduce it several times (or with a fixed seed) before trusting a green test — a fix that "works once" isn't a fix.
- Keep the reproduction test after the fix; it's your regression guard. Name it after the bug, not the fix.
- Resist widening scope. One root cause, one minimal fix; file adjacent issues under "Risk & follow-ups" instead of fixing them here.
- For mixed TS + Python repos, confirm which runtime owns the bug before writing the failing test — the reproduction belongs in that stack's test runner.
