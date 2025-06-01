import { ConversationalRetrievalQAChain } from "langchain/chains";
import { getVectorStore } from "./vector-store";
import { getPineconeClient } from "./pinecone-client";
import {
  StreamingTextResponse,
  experimental_StreamData,
  LangChainStream,
} from "ai-stream-experimental";
import { streamingModel, nonStreamingModel } from "./llm";
import { STANDALONE_QUESTION_TEMPLATE, QA_TEMPLATE } from "./prompt-templates";

type callChainArgs = {
  question: string;
  chatHistory: string;
};

export async function callChain({ question, chatHistory }: callChainArgs) {
  try {
    console.log("callChain: Sanitizing question...");
    const sanitizedQuestion = question.trim().replaceAll("\n", " ");
    console.log(`callChain: Sanitized question: ${sanitizedQuestion}`);

    console.log("callChain: Initializing Pinecone client...");
    const pineconeClient = await getPineconeClient();
    console.log("callChain: Pinecone client initialized.");

    console.log("callChain: Getting vector store...");
    const vectorStore = await getVectorStore(pineconeClient);
    console.log("callChain: Vector store retrieved.");
    
    console.log("callChain: Creating ConversationalRetrievalQAChain...");
    const chain = ConversationalRetrievalQAChain.fromLLM(
      streamingModel,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vectorStore.asRetriever({ k: 2 }) as any,
      {
        qaTemplate: QA_TEMPLATE,
        questionGeneratorTemplate: STANDALONE_QUESTION_TEMPLATE,
        returnSourceDocuments: true,
        questionGeneratorChainOptions: {
          llm: nonStreamingModel,
        },
        verbose: true,
      }
    );
    console.log("callChain: ConversationalRetrievalQAChain created.");

    console.log("callChain: Calling chain with question and chat history...");
    const res = await chain.call({
      question: sanitizedQuestion,
      chat_history: chatHistory,
    });
    console.log("callChain: Chain call successful. Processing response...");

    const responseText = res.text;
    interface Source {
      content: string;
      url: string | null;
    }
    let sources: Source[] = [];

    if (res?.sourceDocuments && res.sourceDocuments.length > 0) {
      const sourceDocument = res.sourceDocuments[0];
      console.log(`callChain: Source document: ${JSON.stringify(sourceDocument)}`);
      sources = [{
        content: sourceDocument.pageContent,
        url: sourceDocument.metadata?.sourceURL || sourceDocument.metadata?.source || null,
      }];
      console.log(`callChain: Processed sources: ${JSON.stringify(sources)}`);
    }

    // Construct a non-streaming response manually
    // The `ai` package's `useChat` hook expects a stream, even for non-streaming full responses.
    // We can simulate a stream that emits the full response at once.
    const data = new experimental_StreamData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.append({ sources: sources as any }); // Append sources if you have them
    data.close();

    // Create a ReadableStream that sends the whole response text at once
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(responseText));
        controller.close();
      },
    });
    
    console.log("callChain: Returning new Response with simulated stream.");
    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (e) {
    console.error("callChain: Unhandled error in callChain:", e);
    // Ensure a response is sent even in case of an error to prevent hanging
    return new Response(JSON.stringify({ error: "Call chain method failed to execute successfully!!", message: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
