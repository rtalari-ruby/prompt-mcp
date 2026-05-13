// LLM client with two backends:
//
// 1) MCP sampling (preferred): the server asks the *host* MCP client
//    (Claude Code, Claude Desktop) to do the completion using whichever
//    model the user is already running. No API key required.
//
// 2) Azure OpenAI chat completions (fallback): used when the host doesn't
//    support sampling, or when no `extra` request handler is in scope
//    (e.g. scripts/enrich-kb.ts, which runs outside a tool handler).
//
// Both backends share a disk cache keyed on inputs + backend.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { sampleViaClient, type SamplingExtra } from "./sampling.js";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export type CompletionOptions = {
  /** Max tokens (includes hidden reasoning tokens for reasoning models). Default 8192. */
  maxTokens?: number;
  /** Disk-cache key. If set, identical inputs reuse a cached response. */
  cacheKey?: string;
  /**
   * MCP request-handler extra. If present and the host client advertises
   * sampling capability, the completion runs via the host's LLM (no API
   * key needed). Otherwise we fall back to Azure.
   */
  extra?: SamplingExtra;
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

export function azureConfigured(): boolean {
  const c = cfg();
  return Boolean(c.endpoint && c.key && c.deployment);
}

/** True if any backend is usable in the given context. */
export function llmAvailable(extra?: SamplingExtra): boolean {
  if (extra && samplingAvailable(extra)) return true;
  return azureConfigured();
}

/** Back-compat alias used by scripts that pre-date the sampling backend. */
export const llmConfigured = azureConfigured;

function samplingAvailable(extra: SamplingExtra): boolean {
  // The host's capabilities are surfaced via the protocol layer. We check
  // for the `sampling` capability the client advertised at `initialize`.
  try {
    const server: any = (extra as any).server ?? (extra as any).sendRequest?.server;
    // The simpler path: peek at the in-scope sendRequest. If the client
    // didn't advertise sampling, the request will fail with method-not-found.
    // We optimistically attempt sampling and let the catch fall through.
    return typeof extra.sendRequest === "function";
  } catch {
    return false;
  }
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

/** Run a chat completion. Prefers MCP sampling; falls back to Azure. */
export async function chat(
  messages: ChatMsg[],
  opts: CompletionOptions = {},
): Promise<string> {
  // Try sampling first if we have an `extra` to call back through.
  if (opts.extra && samplingAvailable(opts.extra)) {
    const samplingKey =
      opts.cacheKey != null
        ? `sample:${opts.cacheKey}`
        : `sample:${JSON.stringify({ m: messages, t: opts.maxTokens ?? 4096 })}`;
    const cached = readCache(samplingKey);
    if (cached !== null) return cached;
    try {
      const text = await sampleViaClient(opts.extra, messages, {
        maxTokens: opts.maxTokens ?? 4096,
      });
      writeCache(samplingKey, text);
      return text;
    } catch (err) {
      // If sampling is rejected (e.g. client doesn't actually support it,
      // or user denied), fall through to Azure if it's configured.
      if (!azureConfigured()) {
        throw new LlmError(
          `Sampling failed and Azure is not configured: ${(err as Error).message}`,
        );
      }
      // else: fall through
    }
  }

  if (!azureConfigured()) {
    throw new LlmError(
      "LLM not configured. Either run inside a sampling-capable MCP client (Claude Code / Desktop), or set AZURE_OPENAI_* in .env.",
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

/** Re-export so tools and scripts can type their handlers without reaching into sampling.ts. */
export type { SamplingExtra } from "./sampling.js";

/** Parse the first ```json ... ``` block, or fall back to JSON.parse on the whole string. */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim()) as T;
}
