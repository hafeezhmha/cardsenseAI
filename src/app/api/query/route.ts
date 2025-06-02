import { NextRequest, NextResponse } from "next/server";
// Ensure callChainAsJson is exported from langchain.ts and imported here
import { callChainAsJson } from "@/lib/langchain"; 

// Helper to format messages for callChainAsJson, similar to your /api/chat
// This matches the expected format for `chat_history` in `callChainAsJson`
const formatMessageForHistory = (message: { role: "user" | "assistant" | "system" | "function" | "tool" | "api" ; content: string }) => {
  // `callChainAsJson` (via `ConversationalRetrievalQAChain`) expects a string history.
  // The roles "Human" and "Assistant" are common conventions.
  return `${message.role === "user" ? "Human" : "Assistant"}: ${message.content}`;
};

interface QueryRequestBodyMessages {
  role: "user" | "assistant" | "system" | "function" | "tool" | "api"; // More complete role list from 'ai' package Message type
  content: string;
  id?: string; // Optional fields from 'ai' package Message type
  name?: string;
  function_call?: any;
  tool_calls?: any;
  tool_call_id?: string;
  created_at?: Date;
}
interface QueryRequestBody {
  messages: Array<QueryRequestBodyMessages>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QueryRequestBody;
    const messages = body.messages ?? [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // The last message is the current question
    const currentMessage = messages[messages.length - 1];
    if (currentMessage.role !== 'user') {
        return NextResponse.json(
            { error: "Last message must be from user" },
            { status: 400 }
        );
    }
    const question = currentMessage.content;

    // Messages before the last one form the history
    const historyMessages = messages.slice(0, -1);
    const formattedChatHistory = historyMessages
      .map(formatMessageForHistory) // Use the updated formatter
      .join("\n");

    if (!question) {
      return NextResponse.json(
        { error: "No content in the last message (question)" },
        { status: 400 }
      );
    }

    console.log(`API /api/query: Question: "${question}"`);
    if (formattedChatHistory) {
      console.log(`API /api/query: History: "${formattedChatHistory}"`);
    }


    const ragResponse = await callChainAsJson({
      question: question,
      chatHistory: formattedChatHistory,
    });

    return NextResponse.json(ragResponse);

  } catch (error) {
    console.error("Error in /api/query:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Check if the error is from callChainAsJson and already formatted
    if (errorMessage.startsWith("Call chain method (JSON) failed:")) {
        return NextResponse.json(
          { error: "Failed to get response from RAG chain", details: errorMessage },
          { status: 500 }
        );
    }
    return NextResponse.json(
      { error: "Failed to process request in /api/query", details: errorMessage },
      { status: 500 }
    );
  }
} 