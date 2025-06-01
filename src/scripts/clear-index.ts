import { clearPineconeIndex } from "../lib/pinecone-utils";

async function main() {
  console.log("Starting the process to clear the Pinecone index...");
  try {
    await clearPineconeIndex();
    console.log("Pinecone index clearing process completed successfully.");
  } catch (error) {
    console.error("Failed to complete the Pinecone index clearing process:", error);
    process.exit(1); // Exit with an error code
  }
}

main(); 