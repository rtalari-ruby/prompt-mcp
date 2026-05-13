// MCP sampling — the server asks the *client*'s LLM to do the completion.
// In practice this means: when a user calls a tool in Claude Code, the tool
// can call back through the MCP transport to ask Claude (the same model the
// user is already running) to do internal work. No API key needed.
//
// Requires the client to advertise the `sampling` capability during init.
// Claude Code + Claude Desktop support this. Bare MCP clients may not.

import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js";
import type { ChatMsg } from "./client.js";

export type SamplingExtra = RequestHandlerExtra<any, any>;

/** Run a chat completion via the host client's LLM (MCP sampling). */
export async function sampleViaClient(
  extra: SamplingExtra,
  messages: ChatMsg[],
  opts: { maxTokens?: number } = {},
): Promise<string> {
  // Sampling spec puts the system prompt in a separate field, not in messages.
  const systemPrompt = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const samplingMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: { type: "text" as const, text: m.content },
    }));

  const result = await extra.sendRequest(
    {
      method: "sampling/createMessage",
      params: {
        messages: samplingMessages,
        systemPrompt: systemPrompt || undefined,
        maxTokens: opts.maxTokens ?? 4096,
        // Hint to the client that we want a smart model. Most clients ignore this.
        modelPreferences: {
          intelligencePriority: 0.7,
          speedPriority: 0.3,
        },
      },
    } as any,
    CreateMessageResultSchema,
  );

  const content = result.content as { type: string; text?: string };
  if (content.type !== "text" || typeof content.text !== "string") {
    throw new Error(
      `Sampling returned non-text content (type=${content.type}). The host client may not support text sampling.`,
    );
  }
  return content.text;
}
