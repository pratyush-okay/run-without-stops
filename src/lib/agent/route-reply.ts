import { createUIMessageStream, createUIMessageStreamResponse, generateId } from "ai";
import { routeReplyText } from "@/lib/agent/chat-ui";
import type { AgentRouteProposal } from "@/lib/schemas/agent";

export { routeReplyText };

export function streamBuiltRoute(proposal: AgentRouteProposal, requestText = "") {
  const toolCallId = generateId();
  const textId = generateId();
  const reply = routeReplyText(proposal);

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute({ writer }) {
        writer.write({ type: "start" });
        writer.write({ type: "start-step" });
        writer.write({
          type: "tool-input-available",
          toolCallId,
          toolName: "planRun",
          input: requestText ? { requestText } : {},
        });
        writer.write({
          type: "tool-output-available",
          toolCallId,
          output: proposal,
        });
        writer.write({ type: "text-start", id: textId });
        writer.write({ type: "text-delta", id: textId, delta: reply });
        writer.write({ type: "text-end", id: textId });
        writer.write({ type: "finish-step" });
        writer.write({ type: "finish", finishReason: "stop" });
      },
    }),
  });
}
