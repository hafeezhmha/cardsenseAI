import { getChunkedDocsFromPDF } from "@/lib/pdf-loader";
import { getChunkedDocsFromURL } from "@/lib/web-loader";
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
    let docs: Document[];

    if (env.DATA_SOURCE_URL) {
      console.log(`Preparing chunks from URL: ${env.DATA_SOURCE_URL}`);
      docs = await getChunkedDocsFromURL(env.DATA_SOURCE_URL);
      console.log(`Processed ${docs.length} chunks from URL.`);
    } else if (env.PDF_PATH) {
      console.log(`Preparing chunks from PDF file: ${env.PDF_PATH}`);
      docs = await getChunkedDocsFromPDF();
      console.log(`Processed ${docs.length} chunks from PDF.`);
    } else {
      console.error(
        "Error: No data source specified. Set either PDF_PATH or DATA_SOURCE_URL in your .env file."
      );
      return; // Exit if no data source is provided
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
