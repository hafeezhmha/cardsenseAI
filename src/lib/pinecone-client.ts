import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "./config";

let pineconeClientInstance: Pinecone | null = null;

async function initPineconeClient(): Promise<Pinecone> {
  try {
    const pinecone = new Pinecone({
      apiKey: env.PINECONE_API_KEY,
      // environment is not directly used in Pinecone v2 client constructor
      // it's typically part of the index endpoint or handled differently.
      // We'll rely on the API key for authentication for now.
    });
    
    // In Pinecone SDK v2+, direct connection test isn't usually done at client init.
    // The connection happens when you interact with an index.
    // We can add a simple check if needed, e.g., listing indexes.
    // For now, we'll assume successful initialization if no error is thrown.
    console.log("Pinecone client initialized (v2+).");
    return pinecone;
  } catch (error) {
    console.error("Failed to initialize Pinecone Client (v2+):", error);
    throw new Error("Failed to initialize Pinecone Client");
  }
}

export async function getPineconeClient(): Promise<Pinecone> {
  if (!pineconeClientInstance) {
    pineconeClientInstance = await initPineconeClient();
  }
  return pineconeClientInstance;
}
