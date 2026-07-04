# Bugbot Loop

Drive Bugbot's comments on the current PR to zero and leave it merge-ready — no manual triage.

Use this when Bugbot has flagged your open PR and you want to loop fetch → classify → fix → verify → push → wait until it stops finding things, instead of babysitting each round yourself.

## How to use

1. Open Claude Code in the repo, on the branch whose PR you want cleaned up.
2. There is nothing to fill in — the PR is auto-detected from the current branch.
3. Copy the prompt below (everything inside the fence).
4. Paste it into Claude Code and send.
5. Read the final **Merge Verdict** section; if it says NOT MERGE-READY, follow the listed blockers.

## The prompt

````
You are a senior engineer closing out the current PR by driving Bugbot comments to zero. Work rigorously and cite evidence for every call you make. Loop — fetch all open Bugbot comments, classify each, fix the real bugs, dismiss false positives with a concrete reason, push, wait for Bugbot to re-review, repeat — until the PR is clean and ready to merge. Never claim a comment is resolved without either addressing it in code or giving a specific, code-cited dismissal reason. Prefer the smallest correct change over a broad rewrite.

There are no variables to fill in. Auto-detect everything below.

<context>
- repo: current working tree (the git repo you are running in)
- pr: auto-detect from the current branch via `gh pr view --json number,url,headRefName,mergeStateStatus`. If no PR is found for the branch, STOP and report it (see escape hatch).
- branch: current branch (`git rev-parse --abbrev-ref HEAD`)
- test_cmd: auto-detect in this order — package.json scripts (bun test / npm test) → Makefile (make test) → pyproject.toml (pytest) → go.mod (go test ./...). If several stacks are present, run each relevant suite.
- max_loops: 5
- wait_between_pushes: ~120s (poll for a fresh Bugbot re-review; don't just sleep blindly)
</context>

<workflow>
1. DETECT: resolve the PR from the current branch. Record its number, URL, and mergeStateStatus. Snapshot the current test suite as the GREEN baseline by running test_cmd once. If the baseline is already failing, note it — you must not attribute pre-existing failures to your fixes.

2. FETCH: pull every open, unresolved Bugbot comment on the PR (review comments plus PR-level comments authored by Bugbot). Record the file, line, and the exact quoted text of each so nothing is paraphrased away.

3. CLASSIFY (parallel — one sub-agent per Bugbot comment, dispatched in one message): each sub-agent reads the cited code plus surrounding context and returns exactly one label with evidence:
   - REAL_BUG — the code is genuinely wrong; include the failing scenario.
   - FALSE_POSITIVE — Bugbot is mistaken; include why, citing the code.
   - ALREADY_FIXED — a later commit already resolves it; cite the commit/lines.
   - NEEDS_DISCUSSION — legitimate but ambiguous, or requires a product or design call; state the open question.

4. FIX (parallel — one sub-agent per REAL_BUG, dispatched in one message): each sub-agent makes the smallest correct change to resolve its bug and adds or updates a test that would have caught it. Sub-agents must touch disjoint areas; if two REAL_BUGs overlap the same code, fix them sequentially to avoid clobbering.

5. VERIFY: run test_cmd. If any test that passed at baseline now fails, this is a NEW TEST REGRESSION — HALT the loop immediately, do not push, and report the regression alongside the offending fix.

6. DISMISS: for each FALSE_POSITIVE and ALREADY_FIXED, post a concise reply on the Bugbot comment stating the concrete reason (cite code/commit) and resolve it. Leave NEEDS_DISCUSSION items open with a comment framing the decision needed — do not guess.

7. PUSH: commit the fixes with a message that references the addressed comments, and push to the PR branch.

8. WAIT + REPOLL: wait ~120s while Bugbot re-reviews the new commit, then re-fetch open Bugbot comments. If any remain (and it is not a repeat of a NEEDS_DISCUSSION item), go back to step 3. Stop when: zero unaddressed Bugbot comments remain, OR only NEEDS_DISCUSSION items remain, OR max_loops (5) is reached, OR a test regression halted you.

9. FINAL CHECK: re-read mergeStateStatus and confirm the suite is GREEN. Produce the merge-ready verdict.
</workflow>

<output_contract>
Return exactly these numbered markdown sections:
1. **PR** — number, URL, branch, detected test_cmd, and baseline suite status.
2. **Loop Log** — per iteration: comments fetched, classification counts (REAL_BUG / FALSE_POSITIVE / ALREADY_FIXED / NEEDS_DISCUSSION), fixes pushed, commit SHA.
3. **Classifications** — a table of every Bugbot comment: file:line, label, one-line evidence, resolution (fixed / dismissed-with-reason / open).
4. **Fixes** — for each REAL_BUG: what was wrong, the change, and the test that now guards it.
5. **Open Items** — any NEEDS_DISCUSSION comments with the decision required, or "none".
6. **Merge Verdict** — MERGE-READY or NOT MERGE-READY, mergeStateStatus, suite status, and if not ready, the exact remaining blockers.
</output_contract>

<escape_hatch>
If no PR exists for the current branch, the branch is detached, Bugbot has never reviewed, `gh` is unauthenticated, or the working tree is dirty in a way that blocks committing — STOP. Do not invent a PR or fabricate comments. Report what you found, what you need (e.g. "push the branch and open a PR first"), and exit without pushing.
</escape_hatch>

Think privately about classification and fixes; do not dump your full scratchpad. Return only the six output_contract sections plus brief supporting evidence.
````

## Tips

- Bugbot re-reviews on each push, so let the loop run — resist fixing round two by hand before it reposts.
- If it HALTs on a test regression, the offending fix is named in the Loop Log; revert just that fix and re-run rather than restarting the whole loop.
- NEEDS_DISCUSSION is a feature, not a failure — those are the calls that genuinely need you, so the loop correctly leaves them open instead of guessing.
- A MERGE-READY verdict still respects branch protections; if mergeStateStatus is BLOCKED for reasons unrelated to Bugbot (e.g. required reviews), that surfaces as a blocker rather than a silent pass.
