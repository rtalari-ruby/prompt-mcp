// Minimal LLM client. Single provider — Azure OpenAI Chat Completions —
// reads config from env and calls the deployment via fetch. The plan was
// originally Claude-only at the model layer; the user provided an Azure
// gpt-5.5 deployment, so we use it here. The MCP server is still
// Claude-Code-facing; only the internal tool prompts run through this client.
//
// gpt-5.5 is a reasoning model: reasoning tokens count toward
// max_completion_tokens. Default budget is generous (8192).

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export type CompletionOptions = {
  /** Max tokens (includes hidden reasoning tokens for reasoning models). Default 8192. */
  maxTokens?: number;
  /** Disk-cache key. If set, identical inputs reuse a cached response. */
  cacheKey?: string;
};

export class LlmError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

function cfg() {
  return {
    endpoint: (process.env.AZURE_OPENAI_ENDPOINT ?? "").replace(/\/+$/, ""),
    key: process.env.AZURE_OPENAI_API_KEY ?? "",
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT ?? "",
    apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-12-01-preview",
    cacheDir: process.env.PROMPT_MCP_CACHE_DIR ?? ".cache",
  };
}

export function llmConfigured(): boolean {
  const c = cfg();
  return Boolean(c.endpoint && c.key && c.deployment);
}

function cachePath(key: string): string {
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 24);
  return resolve(cfg().cacheDir, "llm", `${hash}.json`);
}

function readCache(key: string): string | null {
  const p = cachePath(key);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")).text as string;
  } catch {
    return null;
  }
}

function writeCache(key: string, text: string): void {
  const p = cachePath(key);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify({ text }));
}

/** Run a chat completion. Returns assistant message content as a string. */
export async function chat(
  messages: ChatMsg[],
  opts: CompletionOptions = {},
): Promise<string> {
  if (!llmConfigured()) {
    throw new LlmError(
      "LLM not configured. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT in .env.",
    );
  }
  const c = cfg();

  const cacheKey =
    opts.cacheKey ??
    JSON.stringify({ d: c.deployment, m: messages, t: opts.maxTokens ?? 8192 });
  const cached = readCache(cacheKey);
  if (cached !== null) return cached;

  const url = `${c.endpoint}/openai/deployments/${c.deployment}/chat/completions?api-version=${c.apiVersion}`;
  const body = {
    messages,
    max_completion_tokens: opts.maxTokens ?? 8192,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": c.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new LlmError(`LLM HTTP ${res.status}: ${errText.slice(0, 400)}`, res.status);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    usage?: unknown;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const finish = data.choices?.[0]?.finish_reason;
  if (!content && finish === "length") {
    throw new LlmError(
      "LLM ran out of tokens before producing visible output (reasoning model). Increase maxTokens.",
    );
  }
  writeCache(cacheKey, content);
  return content;
}

/** Convenience: run with system + user, return text. */
export async function complete(
  system: string,
  user: string,
  opts: CompletionOptions = {},
): Promise<string> {
  return chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    opts,
  );
}

/** Parse the first ```json ... ``` block, or fall back to JSON.parse on the whole string. */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim()) as T;
}
