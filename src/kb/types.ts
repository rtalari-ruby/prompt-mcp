export type KbCategory =
  | "technique"
  | "claude-specific"
  | "failure-mode"
  | "checklist"
  | "applications"
  | "risks"
  // dair-ai default until normalized:
  | "techniques";

export type KbDoc = {
  id: string;
  title: string;
  category: KbCategory;
  tags: string[];
  sources: string[];
  whenToUse: string;
  whenNotToUse: string;
  claudeNotes: string;
  related: string[];
  body: string;       // raw markdown body (without frontmatter)
  rawText: string;    // body lower-cased for substring search
  path: string;       // absolute file path
};

export type KbSearchHit = {
  doc: KbDoc;
  score: number;
};
