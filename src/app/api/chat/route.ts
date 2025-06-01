import { NextRequest, NextResponse } from "next/server";
import { callChain } from "@/lib/langchain";
import { Message, StreamingTextResponse } from "ai";

const formatMessage = (message: Message) => {
  return `${message.role === "user" ? "Human" : "Assistant"}: ${
    message.content
  }`;
};

const simpleGreetings = [
  "hi",
  "hello",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
  "greetings",
  "sup",
  "yo",
  "what's up",
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages: Message[] = body.messages ?? [];
  console.log("Messages ", messages);
  const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
  const question = messages[messages.length - 1].content;

  console.log("Chat history ", formattedPreviousMessages.join("\n"));

  if (!question) {
    return NextResponse.json("Error: No question in the request", {
      status: 400,
    });
  }

  const normalizedQuestion = question.trim().toLowerCase();
  if (simpleGreetings.includes(normalizedQuestion)) {
    // Return a simple greeting response directly, bypassing the RAG chain
    const greetingText = "Hello there! I'm CardSense AI. How can I help you with your credit card questions today?";
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(greetingText));
        controller.close();
      },
    });
    return new StreamingTextResponse(stream);
  }

  try {
    // If not a simple greeting, proceed with the RAG chain
    const streamingTextResponse = await callChain({ // Ensure callChain is awaited if it's async
      question,
      chatHistory: formattedPreviousMessages.join("\n"),
    });

    return streamingTextResponse;
  } catch (error) {
    console.error("Internal server error ", error);
    return NextResponse.json("Error: Something went wrong. Try again!", {
      status: 500,
    });
  }
}
