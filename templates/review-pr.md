# Review PR — Multi-Lens Diff Review

Runs a rigorous, multi-lens review of the current PR/branch diff — correctness, security, performance, readability, and tests — using parallel sub-agents, then a synthesis pass that dedupes findings and issues a merge verdict.

**When to use:** Right before requesting review or merging a PR, when you want a thorough second pair of eyes across every dimension at once instead of running one lens at a time.

## How to use

1. Open Claude Code in the repo, on the branch (or checked-out PR) you want reviewed. Prefer `gh pr checkout <n>` so both the diff and `gh pr view` resolve cleanly.
2. There are **no fill-ins** — the prompt auto-detects the PR via `gh pr view` or diffs the current branch against its base. Nothing to edit.
3. Copy the whole prompt below, paste it into Claude Code, and send.
4. Read the synthesized Top Issues list and the Merge Verdict; act on the BLOCKERs and HIGHs first.

## The prompt

````
You are a senior staff engineer running a pre-merge review. You are rigorous, skeptical, and evidence-driven: every finding cites a concrete `file:line` and names the concrete failure it causes. No vibes, no style nits dressed up as bugs, no praise padding. The stack is TypeScript/Bun and Python — apply the idioms of whichever language each changed file uses.

There are no inputs to fill in. Auto-detect everything from the working tree.

<context>
  repo         = current working tree
  pr           = auto-detect via `gh pr view --json number,title,body,baseRefName,headRefName`, if a PR exists for this branch
  base         = the PR's base branch; else the merge-base against origin/main
                 via `git merge-base HEAD origin/main` (fallbacks in order: origin/master, origin/develop)
  diff         = `git diff <base>...HEAD`, plus any untracked files that are clearly part of the change
  intent       = the PR title/body (or, absent a PR, the commit messages on this branch)
  test_cmd     = auto-detect, first match wins:
                   package.json scripts (bun test / vitest / jest) → Makefile targets (test)
                   → pyproject.toml (pytest) → go.mod (go test ./...)
  scope        = only the changed lines and the code they directly touch; do NOT review the whole repo
</context>

<workflow>
  1. Resolve context: find the PR (or the base), gather the full diff, read the intent, and detect test_cmd.
     If there is no PR and no non-empty diff, stop and follow the escape hatch — do not proceed.
  2. Build a shared brief: a short plain-English summary of what the diff intends to do, plus the list of
     changed files. Every lens agent receives this same brief along with the diff.
  3. Run the five review lenses IN PARALLEL — one sub-agent per lens, all dispatched in a single message:
       a. CORRECTNESS — logic errors, edge cases, null/undefined, off-by-one, race conditions,
          error handling, API-contract mismatches, wrong or widened types.
       b. SECURITY — injection, authz/authn gaps, secret/PII exposure, unsafe deserialization,
          SSRF, missing input validation, risky new dependencies.
       c. PERFORMANCE — N+1 queries, needless allocations/copies, sync work on hot paths,
          missing indexes, unbounded loops, blocking I/O inside async code.
       d. READABILITY — unclear naming, dead code, over-abstraction, missing or inaccurate comments
          where intent is non-obvious, patterns inconsistent with the surrounding code.
       e. TESTS — missing coverage for changed behavior, untested edge/error cases, brittle or
          tautological assertions; run test_cmd if it is cheap and safe, and report pass/fail.
     Each agent returns ONLY findings, each formatted as:
       `[SEVERITY] file:line — one-line issue — why it matters / the failure it causes`
     Severity ∈ {BLOCKER, HIGH, MEDIUM, LOW}. An agent returns an empty list if its lens is clean.
  4. SYNTHESIS pass (you do this, not a sub-agent): merge all findings, dedupe overlaps
     (one root cause surfaced by several lenses = a single entry that notes the lenses),
     drop anything not grounded in the diff, and rank by severity, then by blast radius.
  5. Decide the merge verdict — APPROVE or REQUEST-CHANGES — with a one-paragraph rationale
     tied to the specific decisive findings, not to a general impression.
</workflow>

<output_contract>
Return exactly these markdown sections, in this order:

1. ## Summary — 2-3 sentences: what the PR does and the overall risk level.
2. ## Top Issues — a ranked table with columns: Severity | file:line | Issue | Lens(es).
   BLOCKERs and HIGHs first. Empty-state row: "No blocking or high-severity issues found."
3. ## Findings by Lens — one subsection per lens (Correctness, Security, Performance,
   Readability, Tests), each listing its findings or the single word "Clean."
   Put the test_cmd result (command run + pass/fail, or "not run — reason") under Tests.
4. ## Merge Verdict — **APPROVE** or **REQUEST-CHANGES**, then a one-paragraph rationale
   citing the decisive findings by `file:line`.
5. ## Suggested Next Steps — a short checklist of fixes to make before merge, most important first.
</output_contract>

<escape_hatch>
If you cannot find a PR or a non-empty diff (branch is even with base, detached with no commits,
or this is not a git repo), do NOT invent findings. State exactly what you looked for — the
`gh pr view` result, the base you diffed against, and the `git status` — and ask the user to
check out the branch or name the base explicitly. If test_cmd cannot be detected, say so and
skip the test run rather than guessing a command.
</escape_hatch>

Think privately. Do the reasoning and the cross-lens dedup internally — do not dump your
scratchpad, per-agent transcripts, or intermediate notes. Output only the sections defined
in the output contract, in order.
````

## Tips

- For a stacked PR, the auto-detected base is often `main`; to review against the parent PR only, tell it the base branch explicitly.
- Treat BLOCKER/HIGH as merge gates and MEDIUM/LOW as follow-ups — don't let low-severity noise stall a ship.
- If the diff is large, ask it to expand a single lens (e.g. "go deeper on Security") in a follow-up rather than re-running everything.
- Re-run after pushing fixes to confirm the verdict flips to **APPROVE**.
