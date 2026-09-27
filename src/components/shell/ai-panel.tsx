"use client";

import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useUi } from "@/lib/store/ui";
import { useActiveQueryTab } from "@/lib/store/tabs";
import { Bot } from "lucide-react";
import { Panel, PanelHeader } from "./panel";
import * as React from "react";

const SUGGESTIONS = [
  "Show critical alerts from the last 24 hours",
  "Which hosts had the most 5xx errors this week?",
  "Find Cisco devices seen in the last 7 days",
];

type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

/**
 * Placeholder assistant. Purely client-side: no model is called yet. It keeps
 * the AI Elements chrome in place so the real agent can be wired in later.
 */
export function AiPanel() {
  const setAiOpen = useUi((s) => s.setAiOpen);
  const models = useActiveQueryTab()?.models ?? [];
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [status, setStatus] = React.useState<"ready" | "submitted">("ready");

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: t }]);
    setStatus("submitted");
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `The assistant is not connected yet. When it is, I will turn “${t}” into a query over ${
            models.length ? models.map((x) => `\`${x}\``).join(", ") : "all models"
          } and offer to run it in a new tab.`,
        },
      ]);
      setStatus("ready");
    }, 500);
  };

  return (
    <Panel className="pl-0">
      <PanelHeader title="AI assistant" icon={<Bot className="size-4" />} onClose={() => setAiOpen(false)} />
      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<Bot className="size-8" />}
              title="Ask about your data"
              description="Describe what you want to find and the assistant will propose a query."
            />
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                <MessageResponse>{m.text}</MessageResponse>
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t p-2">
        {messages.length === 0 && (
          <Suggestions className="mb-2">
            {SUGGESTIONS.map((s) => (
              <Suggestion key={s} suggestion={s} onClick={send} />
            ))}
          </Suggestions>
        )}
        <PromptInput onSubmit={(msg) => send(msg.text)}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Ask a question about your data..." />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </Panel>
  );
}
