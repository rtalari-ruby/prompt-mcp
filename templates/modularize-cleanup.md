# Modularize & Dead-Code Cleanup

Safely remove provably-unused code and split a sprawling area into clean, well-separated modules — with zero behavior change.

**When to use:** A directory or module has accreted dead code, tangled responsibilities, and giant files, and you want a rigorous, test-guarded cleanup that never changes behavior. Reach for it before feature work in a crufty area, or as scheduled debt paydown.

## How to use

1. Open Claude Code in the repo you want to clean (the repo is auto-detected as the current working tree).
2. Copy the prompt in **The prompt** below.
3. Replace the one input `{{scope}}` with the directory/module/area to clean — or the literal phrase `the whole repo, conservatively`.
4. Paste into Claude Code and send.
5. Review the plan and the small commits it produces; approve deletions it flagged as uncertain before they're removed.

## The prompt

````
You are a senior engineer doing a rigorous, behavior-preserving cleanup: remove provably-dead code and modularize a sprawling area into clean, well-separated modules. You are conservative and evidence-cited — you never delete code you cannot prove is unused, and you never change observable behavior. Every deletion and every move is justified with concrete evidence (grep results, import graphs, entry-point analysis). Small, reviewable commits. Tests green before you start, green after every commit, and green at the end.

SINGLE INPUT — replace this, nothing else:
- {{scope}} = the directory / module / area to clean. If you were handed the literal phrase "the whole repo, conservatively", treat the entire working tree as scope but bias every judgment call toward FLAG-don't-delete.

<context>
- repo = current working tree (cwd). Do not clone or switch repos.
- branch = current git branch. Create a new branch `cleanup/<scope-slug>` before any edit; never commit cleanup directly to main/master/default.
- test_cmd = AUTO-DETECT, do not ask. Resolve in this order and record what you found:
    - package.json scripts.test (Bun/TS: prefer `bun test`, else `npm test` / `pnpm test` / `yarn test`)
    - Makefile target `test`
    - pyproject.toml / tox.ini / pytest config (Python: `pytest`, or `uv run pytest` / `poetry run pytest` if those managers are in use)
    - go.mod present -> `go test ./...`
  If multiple stacks exist (TS + Python), detect and run ALL relevant test commands.
- lint/typecheck = AUTO-DETECT and run as a secondary gate if present: `tsc --noEmit`, `bun run lint`, `ruff`/`mypy`, etc. A dead-code removal that breaks typecheck is not dead code.
- entry points = things that are used but never imported by name. Detect and treat as ROOTS (never delete, never assume unreferenced): package.json bin/exports/main, framework routes/pages, CLI entry files, test files, migrations, `__init__.py` re-exports, plugin/registry auto-loaders, anything referenced from config, CI, Dockerfiles, or serverless manifests.
</context>

<safety_rules>
CRITICAL — read before touching anything:
1. Only delete code PROVEN unused: no references anywhere, not an entry point, and not dynamically loaded (string-based imports, reflection, `getattr`, `require(variable)`, dependency-injection registries, decorators that register by side effect, glob/auto-import).
2. When uncertain, FLAG — do not delete. A false deletion is far worse than leftover dead code. "I couldn't find a reference" is NOT proof when dynamic loading is possible; downgrade to FLAG.
3. Modularization MUST preserve public interfaces. Keep old import paths working via re-export shims when anything outside {{scope}} imports the moved symbol. Never rename or change the signature of an exported symbol in this pass.
4. Behavior is frozen. No logic changes, no "while I'm here" fixes, no dependency bumps. Pure move/delete/reorganize only.
5. Tests green throughout: run test_cmd before the first change and after every commit. If red, stop and revert the last step.
</safety_rules>

<workflow>
1. BASELINE. Detect stack(s) and test_cmd(s). Run the full test suite (and typecheck/lint if present). Record the green baseline — commit hash, pass counts. If the baseline is already red, STOP and report; do not clean on top of a broken tree.
2. MAP {{scope}}. Inventory files, exports, and the import graph. Identify entry points / roots per <context>.
3. DETECT DEAD CODE — parallel, one sub-agent per signal, all dispatched in one message. Each returns candidates with file:line evidence, never edits:
     a. Unused exports — exported symbols with zero external references (reconcile against dynamic-loading and re-export patterns).
     b. Unreferenced files — modules never imported/required by any root, transitively from entry points.
     c. Dead branches / unreachable code — impossible conditions, constant-false guards, code after unconditional return/throw, obsolete feature flags.
   Merge the three reports. Cross-check every candidate against <safety_rules> #1–2. Split into DELETE (proven) vs FLAG (uncertain, with the specific reason it's uncertain).
4. DELETE (proven only). Remove DELETE candidates in small, cohesive commits (one logical group each). After EACH commit: run test_cmd (+ typecheck). Green -> keep; red -> revert that commit and reclassify the candidate as FLAG.
5. MODULARIZE. Propose a target module layout for {{scope}} (clear names, one responsibility each, explicit public surface via an index/`__init__`). Move code in small commits, adding re-export shims so existing import paths outside {{scope}} keep working. Preserve every public interface. Run test_cmd (+ typecheck) after each move; revert on red.
6. FINAL GATE. Run the full suite and typecheck/lint again. Confirm green matches or exceeds the baseline pass counts. Produce a diffstat and the ordered commit list.
</workflow>

<output_contract>
Return markdown with these numbered sections, in order:
1. **Summary** — scope, stack(s) detected, test_cmd(s), baseline vs final test result (green->green).
2. **Dead code removed** — table: symbol/file | signal (unused export / unreferenced file / dead branch) | evidence | commit.
3. **Flagged, NOT deleted** — table: symbol/file | why uncertain (dynamic load? external ref? entry point?) | recommended manual check. This is the safety valve — be generous here.
4. **Modularization** — before/after module map, the public interfaces preserved, and where re-export shims were added.
5. **Commits** — ordered list (hash + one-line message), each independently reviewable.
6. **Verification** — exact commands run and their pass/fail output at baseline and final.
7. **Follow-ups** — anything out of scope for a behavior-preserving pass (real refactors, interface changes, dep upgrades).

Provide a PR description too, in its own fenced block:

```
## What
Behavior-preserving cleanup of {{scope}}: removed proven-dead code, modularized into clean modules.

## Proof of safety
- Tests: <baseline> -> <final> (green throughout)
- No public interface changed; moved symbols keep old import paths via shims
- N candidates FLAGGED not deleted (see below) — deleted only what was provably unused

## Review guide
<ordered commits, what to look at in each>
```
</output_contract>

<escape_hatch>
- If {{scope}} is missing, empty, or doesn't resolve to a path in the tree: list the top-level directories/modules with rough size and cruft signals, ask which to target, and STOP.
- If no test command can be auto-detected: STOP before deleting anything. Report what you looked for and ask for the test command — dead-code removal without a green suite is unsafe.
- If the baseline suite is red: STOP and report the failures; do not clean on a broken tree.
- If a "dead" symbol might be dynamically loaded and you can't disprove it: FLAG it, don't delete.
</escape_hatch>

Think privately about the import graph, dynamic-loading risks, and module boundaries. Do NOT dump your scratchpad or chain-of-thought — return only the structured output above plus the small commits.
````

## Tips

- Land the delete phase and the modularize phase as separate PRs when the scope is large — reviewers can reason about "nothing left" and "same thing, moved" independently.
- If the tree has both Bun/TS and Python, confirm both suites are detected in section 1 before approving any deletion; a symbol dead in TS may be live via a Python FFI or subprocess call.
- Be suspicious of anything touched by decorators, DI containers, or string-keyed registries — those are the classic false-positive "dead" exports. Push them to the FLAG list.
- Keep re-export shims for at least one release, then remove them in a follow-up once you've confirmed no external importer remains.
