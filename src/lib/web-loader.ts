import { FireCrawlLoader } from "./firecrawl-loader";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";

export async function getChunkedDocsFromURL(url: string): Promise<Document[]> {
  try {
    const loader = new FireCrawlLoader({
      url,
      mode: "scrape", // Or "crawl" if you want to crawl all subpages
    });
    const docs = await loader.load();

    // Firecrawl returns markdown, so we can use the same text splitter settings
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(docs);

    return chunkedDocs;
  } catch (e) {
    console.error(e);
    throw new Error(`Failed to get chunked docs from URL: ${url}`);
  }
} 