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

interface RagJsonResponse {
  answer: string;
  sources: Array<{
    content: string;
    url: string | null;
  }>;
}

export async function callChainAsJson({ question, chatHistory }: callChainArgs): Promise<RagJsonResponse> {
  try {
    console.log("callChainAsJson: Sanitizing question...");
    const sanitizedQuestion = question.trim().replaceAll("\n", " ");
    console.log(`callChainAsJson: Sanitized question: ${sanitizedQuestion}`);

    console.log("callChainAsJson: Initializing Pinecone client...");
    const pineconeClient = await getPineconeClient();
    console.log("callChainAsJson: Pinecone client initialized.");

    console.log("callChainAsJson: Getting vector store...");
    const vectorStore = await getVectorStore(pineconeClient);
    console.log("callChainAsJson: Vector store retrieved.");
    
    console.log("callChainAsJson: Creating ConversationalRetrievalQAChain...");
    // Note: Using nonStreamingModel here as we are not streaming the final response to the client in this JSON version.
    // The original callChain used streamingModel for the main LLM. If your LLM provider charges differently
    // or has different characteristics for streaming vs non-streaming, you might adjust this.
    // For simplicity, let's use nonStreamingModel for the main response generation in this JSON variant.
    const chain = ConversationalRetrievalQAChain.fromLLM(
      nonStreamingModel, // Changed from streamingModel
      vectorStore.asRetriever({ k: 2 }) as any, // k: 2 means 2 source documents
      {
        qaTemplate: QA_TEMPLATE,
        questionGeneratorTemplate: STANDALONE_QUESTION_TEMPLATE,
        returnSourceDocuments: true,
        questionGeneratorChainOptions: {
          llm: nonStreamingModel,
        },
        // verbose: true, // You can enable this for more detailed logs if needed
      }
    );
    console.log("callChainAsJson: ConversationalRetrievalQAChain created.");

    console.log("callChainAsJson: Calling chain with question and chat history...");
    const res = await chain.call({
      question: sanitizedQuestion,
      chat_history: chatHistory,
    });
    console.log("callChainAsJson: Chain call successful. Processing response...");

    const responseText = res.text;
    let sources: RagJsonResponse['sources'] = [];

    if (res?.sourceDocuments && res.sourceDocuments.length > 0) {
      // Processing all source documents returned, not just the first one.
      sources = res.sourceDocuments.map((doc: any) => ({ // Use 'any' for now or define a proper type for sourceDocument
        content: doc.pageContent,
        url: doc.metadata?.sourceURL || doc.metadata?.source || null,
      }));
      console.log(`callChainAsJson: Processed sources: ${JSON.stringify(sources)}`);
    }

    return {
      answer: responseText,
      sources: sources,
    };

  } catch (e) {
    console.error("callChainAsJson: Unhandled error:", e);
    // Instead of returning a Response, we throw an error that the API route can catch
    const errorMessage = e instanceof Error ? e.message : "Unknown error in callChainAsJson";
    throw new Error(`Call chain method (JSON) failed: ${errorMessage}`);
  }
}
