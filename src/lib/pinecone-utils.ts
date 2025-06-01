import { getPineconeClient } from "./pinecone-client";
import { env } from "./config";

/**
 * Clears vectors from the Pinecone index.
 * If a namespace is specified in the environment variables (PINECONE_NAMESPACE),
 * only that namespace will be cleared. Otherwise, all vectors in the index will be deleted.
 */
export async function clearPineconeIndex(): Promise<void> {
  try {
    const pinecone = await getPineconeClient();
    const indexName = env.PINECONE_INDEX_NAME;
    const namespace = env.PINECONE_NAMESPACE || undefined; // Use undefined if not set, for clarity

    if (!indexName) {
      throw new Error("PINECONE_INDEX_NAME environment variable is not set.");
    }

    console.log(`Accessing Pinecone index: ${indexName}...`);
    const index = pinecone.Index(indexName);

    if (namespace) {
      console.log(`Clearing namespace: '${namespace}' in index '${indexName}'...`);
      // The describeIndexStats check is good practice before a delete operation
      const stats = await index.describeIndexStats();
      if (stats.namespaces && stats.namespaces[namespace]) {
        await index.namespace(namespace).deleteAll();
        console.log(`Namespace '${namespace}' cleared successfully.`);
      } else {
        console.log(`Namespace '${namespace}' not found or already empty.`);
      }
    } else {
      console.log(`Clearing all vectors from index '${indexName}' (default namespace or all namespaces if deleteAll works across them)...`);
      // Note: deleteAll on the index object might clear all namespaces.
      // If you strictly want to clear only the default namespace and PINECONE_NAMESPACE is empty,
      // you might need to explicitly target it if your Pinecone client version supports it differently.
      // For most common use cases, index.deleteAll() is intended to clear the entire index.
      await index.deleteAll(); 
      console.log(`All vectors cleared from index '${indexName}' successfully.`);
    }
  } catch (error) {
    console.error("Error clearing Pinecone index:", error);
    throw new Error("Failed to clear Pinecone index.");
  }
} 