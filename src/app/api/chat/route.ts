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

  // Sliding window implementation: Keep the last 10 messages for history
  const historyMessages = messages.length > 1 ? messages.slice(Math.max(0, messages.length - 11), -1) : [];
  const formattedPreviousMessages = historyMessages.map(formatMessage);
  
  const question = messages[messages.length - 1].content;

  console.log("Chat history (last 10 messages max): ", formattedPreviousMessages.join("\n"));

  if (!question) {
    return NextResponse.json("Error: No question in the request", {
      status: 400,
    });
  }

  const normalizedQuestion = question.trim().toLowerCase();

  // Handle specific meta-questions about conversation history
  if (normalizedQuestion === "what was my first question?") {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 1) { // Need at least current question and one prior
      const firstUserMessage = userMessages[0];
      // Check if the "first question" is the current question itself
      if (userMessages.length === 2 && firstUserMessage.content.toLowerCase() === normalizedQuestion) {
         const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(`You just asked that! Your first question in our current exchange was: "${firstUserMessage.content}"`));
              controller.close();
            },
          });
          return new StreamingTextResponse(stream);
      }
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`Your first question was: "${firstUserMessage.content}"`));
          controller.close();
        },
      });
      return new StreamingTextResponse(stream);
    } else {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("I don't have a record of your first question in this session yet."));
          controller.close();
        },
      });
      return new StreamingTextResponse(stream);
    }
  }

  if (normalizedQuestion === "what was my previous question?") {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 1) {
      // The previous question is the second to last user message
      const previousUserMessage = userMessages[userMessages.length - 2];
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`Your previous question was: "${previousUserMessage.content}"`));
          controller.close();
        },
      });
      return new StreamingTextResponse(stream);
    } else {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("You haven't asked a previous question in this session yet."));
          controller.close();
        },
      });
      return new StreamingTextResponse(stream);
    }
  }
  
  // Generic catch for other unanswerable meta-questions (optional, can be refined)
  // For example, if it contains "my question" but isn't one of the above
  if (normalizedQuestion.includes("my question") && (normalizedQuestion.includes("what was") || normalizedQuestion.includes("tell me"))) {
    const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("I can remember our recent conversation to help answer your credit card questions, but I'm not designed to recall specific previous questions outside of that context. How can I help you with credit cards?"));
          controller.close();
        },
      });
    return new StreamingTextResponse(stream);
  }

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
