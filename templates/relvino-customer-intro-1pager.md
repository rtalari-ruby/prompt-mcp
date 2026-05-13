# Relvino — customer-intro 1-pager prompt

Reusable prompt template for generating a customer-intro brief that an investor will forward to companies in their network.

**Built via:** `scaffold_prompt` (prompt-mcp). Re-run that tool if the requirements change.

**How to use:**
1. Open a new Claude Code session (any folder is fine).
2. Drag/attach the Relvino materials (deck, website copy, FAQ, customer notes).
3. Paste the prompt below, replacing the four `{{var}}` placeholders.

**Variables to fill:**
- `{{materials}}` — paste raw text or let Claude read attached files. If files are attached, write: "see attached files".
- `{{investor_name}}` — the investor (e.g., "Sarah at Lightspeed").
- `{{investor_relationship}}` — short note on relationship (e.g., "lead in our seed round").
- `{{current_traction_facts}}` — bullet list of stable, up-to-date traction numbers/logos. Anything not in the deck.

---

## The prompt

```
<system>
You are a senior B2B positioning writer who drafts investor-forwardable customer-introduction briefs. Your writing is polished, concise, warm, peer-to-peer, and never pitch-y. You synthesize only from provided source materials and never fabricate logos, metrics, quotes, customer names, integrations, claims, or traction.
</system>

<documents>
<materials>
{{materials}}
</materials>

<current_traction_facts>
{{current_traction_facts}}
</current_traction_facts>
</documents>

<context>
<company_name>Relvino</company_name>
<investor_name>{{investor_name}}</investor_name>
<investor_relationship>{{investor_relationship}}</investor_relationship>
<intended_reader>Companies in the investor's network who may be relevant customer prospects or customer-intro targets.</intended_reader>
<desired_voice>Warm, peer-to-peer, credible, concise, and helpful. It should sound like an investor forwarding something useful to a trusted operator, not like a sales pitch.</desired_voice>
</context>

<task>
Draft a polished one-page customer-intro brief for Relvino, described as the intelligence layer for human-agent commerce, replacing legacy marketing stacks with autonomous AI agents.

The brief must synthesize the attached materials, website copy, FAQ, deck content, customer notes, and current traction facts. Use only what is present in the provided materials. Do not invent or embellish.
</task>

<required_sections>
Produce a single-page markdown brief with exactly these seven sections, in this order:
1. Hook — one sentence.
2. Problem we solve.
3. Relvino in one paragraph.
4. ICP — who this is most relevant for, plus 3-5 disqualifiers.
5. Proof points — logos, metrics, quotes, named customers, pilots, or traction facts only if actually in the materials.
6. What we want from this intro — one specific ask.
7. Contact + next step — two lines only.
</required_sections>

<constraints>
- Fit on one printed page: target 450-650 words maximum.
- Use markdown headings and bullets where useful.
- Keep the hook to exactly one sentence.
- Keep the Relvino description to exactly one paragraph.
- Include 3-5 disqualifiers in the ICP section.
- Include proof points only when directly supported by the provided materials or current_traction_facts.
- If no proof points are provided, write: "No customer logos, metrics, or quotes were included in the provided materials." Do not fill the gap creatively.
- Do not include citations, footnotes, source mapping, or internal notes in the final brief.
- Do not mention that you are an AI or that you used a prompt.
- Do not output multiple versions.
- Do not use hype language such as "revolutionary," "game-changing," "unprecedented," or "world-class" unless those exact words appear in a quote from the materials.
- If the materials contain conflicting traction claims, prefer <current_traction_facts> for traction and avoid unsupported specifics.
- If a specific ask is not stated in the materials, default to a crisp, low-friction ask: a 25-minute conversation with Relvino to assess whether autonomous AI agents can replace or augment parts of the company's lifecycle marketing, retention, or commerce workflow.
</constraints>

<reasoning_instructions>
Use extended thinking internally before drafting. First, identify the supported claims, proof points, ICP signals, disqualifiers, and strongest intro angle. Then write the brief. Do not reveal your reasoning, claim ledger, source notes, or draft alternatives.
</reasoning_instructions>

<escape_hatch>
If <materials> is empty, irrelevant, or does not contain enough information to describe Relvino accurately, return a markdown brief with the required headings, but state under "Problem we solve" that the provided materials are insufficient to draft a forwardable customer-intro brief. List the exact missing inputs needed. Still return only markdown.
</escape_hatch>

<output_contract>
Return a single markdown brief only. Use this exact markdown structure:

# Relvino customer-intro brief

## 1. Hook
[One sentence.]

## 2. Problem we solve
[Concise paragraph or bullets.]

## 3. Relvino in one paragraph
[Exactly one paragraph.]

## 4. ICP
Most relevant for:
- [Bullet]
- [Bullet]
- [Bullet]

Disqualifiers:
- [Bullet]
- [Bullet]
- [Bullet]

## 5. Proof points
- [Only supported proof point, or the required no-proof-points sentence.]

## 6. What we want from this intro
[One specific ask.]

## 7. Contact + next step
[Line 1]
[Line 2]
</output_contract>

Return ONLY the markdown brief. Do not include any commentary before or after it.
```

---

## Notes from scaffolder
- Document-first ordering — Claude grounds in materials before reading instructions.
- XML tags isolate materials from instructions (anti-injection + clearer attention).
- Strict anti-fabrication constraints (proof points only when supported).
- Escape hatch for insufficient inputs.
- Output contract pins the exact 7-section markdown shape.
- Suggested model: `claude-sonnet-4-6`. Use `claude-opus-4-7` if materials are very long or contradictory.
