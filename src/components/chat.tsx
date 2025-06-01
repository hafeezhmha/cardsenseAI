"use client";

import { scrollToBottom, initialMessages, getSources } from "@/lib/utils";
import { ChatLine } from "./chat-line";
import { useChat, Message } from "ai-stream-experimental/react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { useEffect, useRef, useState } from "react";

export function Chat() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, data, setMessages } =
    useChat({
      initialMessages: initialMessages,
      id: chatId?.toString(),
      onFinish: () => {
        setIsSubmitting(false);
        setErrorMessage(null);
      },
      onError: (error) => {
        setIsSubmitting(false);
        setErrorMessage(error.message || "An error occurred while fetching the response");
        console.error("Chat error:", error);
      }
    });

  const resetChat = () => {
    // Generate a new random chat ID to force a new conversation
    setChatId(Date.now().toString());
    // Reset to initial greeting message
    setMessages(initialMessages);
    // Clear any error messages
    setErrorMessage(null);
  };

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    handleSubmit(e);
  };

  useEffect(() => {
    setTimeout(() => scrollToBottom(containerRef), 100);
  }, [messages]);

  return (
    <div className="rounded-2xl border h-[75vh] flex flex-col justify-between">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-medium">Chat with CardSense AI</h2>
        <Button 
          onClick={resetChat} 
          variant="outline" 
          size="sm"
          className="text-red-500 hover:text-red-700"
        >
          Clear Chat
        </Button>
      </div>
      <div className="p-6 overflow-auto" ref={containerRef}>
        {messages.map(({ id, role, content }: Message, index) => (
          <ChatLine
            key={id}
            role={role}
            content={content}
            // Start from the third message of the assistant
            sources={data?.length ? getSources(data, role, index) : []}
          />
        ))}
        
        {errorMessage && (
          <div className="p-3 my-2 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <p className="font-medium">Error:</p>
            <p className="text-sm">{errorMessage}</p>
            <p className="text-sm mt-2">
              Try clearing the chat or using a different question.
            </p>
          </div>
        )}
      </div>

      {(isLoading || isSubmitting) && !errorMessage && (
        <div className="p-4 text-center text-sm text-gray-500">
          Fetching your answer, please wait...
        </div>
      )}

      <form onSubmit={handleChatSubmit} className="p-4 flex clear-both">
        <Input
          value={input}
          placeholder={"Type to chat with AI..."}
          onChange={handleInputChange}
          className="mr-2"
          disabled={isLoading || isSubmitting}
        />

        <Button type="submit" className="w-24" disabled={isLoading || isSubmitting}>
          {isLoading || isSubmitting ? <Spinner /> : "Ask"}
        </Button>
      </form>
    </div>
  );
}
