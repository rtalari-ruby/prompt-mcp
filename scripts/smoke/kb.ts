// Phase-2 smoke: KB loader + index.
import { loadEnv } from "../../src/llm/env.js";
import { allDocs, lookup, byCategory, search } from "../../src/kb/index.js";

loadEnv();

const docs = allDocs();
console.log(`loaded ${docs.length} docs`);
const cot = lookup("chain-of-thought");
if (!cot) throw new Error("expected chain-of-thought");
console.log(`lookup chain-of-thought → ${cot.title} (${cot.category})`);
console.log(`  when_to_use: ${cot.whenToUse.slice(0, 60)}...`);

const cs = byCategory("claude-specific");
console.log(`claude-specific count: ${cs.length}`);

const fm = byCategory("failure-mode");
console.log(`failure-mode count: ${fm.length}`);

const hits = search("xml tags", { limit: 3 });
console.log(`search "xml tags" → ${hits.map((h) => h.doc.id).join(", ")}`);

console.log("PASS phase-2");
