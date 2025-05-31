import { env } from './config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from '@langchain/core/documents';

export async function embedAndStoreDocs(
  pinecone: Pinecone,
  docs: Document[]
) {
  /*create and store the embeddings in the vectorStore*/
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
    });
    
    const pineconeIndex = pinecone.Index(env.PINECONE_INDEX_NAME);

    //embed the PDF documents
    await PineconeStore.fromDocuments(
      docs,
      embeddings,
      {
        pineconeIndex,
        namespace: env.PINECONE_NAMESPACE || undefined,
      }
    );
    console.log("Documents embedded and stored successfully.");

  } catch (error) {
    console.error('Error in embedAndStoreDocs:', error);
    throw new Error('Failed to embed and store documents!');
  }
}

// Returns vector-store handle to be used a retrievers on langchains
export async function getVectorStore(pinecone: Pinecone): Promise<PineconeStore> {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
    });
    const pineconeIndex = pinecone.Index(env.PINECONE_INDEX_NAME);

    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      {
        pineconeIndex,
        namespace: env.PINECONE_NAMESPACE || undefined,
      }
    );
    console.log("Vector store retrieved successfully.");
    return vectorStore;
  } catch (error) {
    console.error('Error in getVectorStore:', error);
    throw new Error('Something went wrong while getting vector store!');
  }
}
