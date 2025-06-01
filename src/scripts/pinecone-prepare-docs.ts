import { getChunkedDocsFromDirectories } from "@/lib/json-loader";
import { embedAndStoreDocs } from "@/lib/vector-store";
import { getPineconeClient } from "@/lib/pinecone-client";
import { env } from "@/lib/config";
import { Document } from "@langchain/core/documents";

// This operation might fail because indexes likely need
// more time to init, so give some 5 mins after index
// creation and try again.
(async () => {
  try {
    const pineconeClient = await getPineconeClient();
    let docs: Document[] | undefined;

    // Prioritize DATA_DIRECTORIES
    if (env.DATA_DIRECTORIES) {
      console.log(`Preparing chunks from directories: ${env.DATA_DIRECTORIES}`);
      docs = await getChunkedDocsFromDirectories();
      if (docs && docs.length > 0) {
        console.log(`Processed ${docs.length} chunks from directories.`);
      } else {
        console.log(`No documents found or processed from directories: ${env.DATA_DIRECTORIES}`);
      }
    } 
    // Fallback to other sources if you wish to keep them
    // For now, let's assume DATA_DIRECTORIES is the primary and potentially only source for this script
    // You can add back `else if (env.DATA_SOURCE_URL)` or `else if (env.PDF_PATH)` here if needed.

    if (!docs || docs.length === 0) {
      // Check if DATA_DIRECTORIES was provided but yielded no docs, or if it wasn't provided at all.
      if (env.DATA_DIRECTORIES) {
        // Already logged about no docs from directories
      } else {
        console.error(
          "Error: No primary data source specified. Set DATA_DIRECTORIES in your .env file."
          // You can extend this message if you re-add fallbacks:
          // "Set DATA_DIRECTORIES, DATA_SOURCE_URL, or PDF_PATH in your .env file."
        );
      }
      return; // Exit if no documents were processed
    }

    if (docs && docs.length > 0) {
      console.log(`Loading ${docs.length} chunks into pinecone...`);
      await embedAndStoreDocs(pineconeClient, docs);
      console.log("Data embedded and stored in pinecone index");
    } else {
      console.log("No documents to process.");
    }
  } catch (error) {
    console.error("Data preparation script failed ", error);
  }
})();
