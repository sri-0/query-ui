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
import { Button } from "@/components/ui/button";
import { useUi } from "@/lib/store/ui";
import { Bot, X } from "lucide-react";
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
export function AiPanel({ models }: { models: string[] }) {
  const setAiOpen = useUi((s) => s.setAiOpen);
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
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bot className="size-4" /> AI assistant
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setAiOpen(false)} aria-label="Close panel">
          <X className="size-4" />
        </Button>
      </div>
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
    </div>
  );
}
