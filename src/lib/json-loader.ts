import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { promises as fs } from "fs";
import path from "path";
import { env } from "./config";

// Interface for the structure of individual card objects
interface CreditCardData {
  card_name: string;
  rewards?: string;
  annual_fee?: string;
  interest_rate?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow other properties
}

// Interface for the expected top-level structure of the JSON file
// This is less strictly enforced now, as we dynamically find the cards array
interface BankJsonWrapper {
  [key: string]: CreditCardData[]; // Expecting some key to hold the array of cards
}

export async function getChunkedDocsFromDirectories(): Promise<Document[]> {
  try {
    const directoriesString = env.DATA_DIRECTORIES;
    if (!directoriesString) {
      throw new Error(
        "DATA_DIRECTORIES is not defined in the environment variables."
      );
    }
    const directories = directoriesString.split(",").map((dir) => dir.trim());

    const allDocs: Document[] = [];

    for (const dir of directories) {
      console.log(`Processing directory: ${dir}`);
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (path.extname(file).toLowerCase() === ".json") {
            const filePath = path.join(dir, file);
            console.log(`Processing file: ${filePath}`);
            try {
              const fileContent = await fs.readFile(filePath, "utf-8");
              const parsedJsonArray: BankJsonWrapper[] = JSON.parse(fileContent);

              if (!Array.isArray(parsedJsonArray) || parsedJsonArray.length === 0) {
                console.warn(`File ${filePath} does not contain the expected top-level array structure. Skipping.`);
                continue;
              }

              const bankDataObject = parsedJsonArray[0]; // Get the first object from the top-level array
              let cardsArray: CreditCardData[] | undefined = undefined;

              if (bankDataObject) {
                // Dynamically find the key that holds the array of credit cards
                for (const key in bankDataObject) {
                  if (Object.prototype.hasOwnProperty.call(bankDataObject, key) && Array.isArray(bankDataObject[key])) {
                    // Assume the first array found is the credit_cards array
                    cardsArray = bankDataObject[key] as CreditCardData[];
                    // Validate if the items in the array look like CreditCardData (e.g., have card_name)
                    if (cardsArray.length > 0 && typeof cardsArray[0].card_name === 'string') {
                      console.log(`Found credit cards array under key '${key}' in ${filePath}`);
                      break; // Found a suitable array, stop looking
                    } else {
                      // This array doesn't seem to contain valid card data, continue searching
                      cardsArray = undefined;
                    }
                  }
                }
              }

              if (cardsArray) {
                for (const card of cardsArray) {
                  if (typeof card.card_name !== 'string') {
                    console.warn(`Skipping card in ${filePath} due to missing or invalid card_name.`);
                    continue;
                  }
                  let pageContent = `Card Name: ${card.card_name}`;
                  if (card.rewards) {
                    pageContent += `\nRewards: ${card.rewards}`;
                  }
                  if (card.annual_fee) {
                    pageContent += `\nAnnual Fee: ${card.annual_fee}`;
                  }
                  if (card.interest_rate) {
                    pageContent += `\nInterest Rate: ${card.interest_rate}`;
                  }
                  // Add any other relevant fields to pageContent as needed

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const finalMetadata: Record<string, any> = {
                    source: filePath,
                    title: card.card_name, // Use card_name as title
                    bank: path.basename(filePath, ".json").replace("-json", ""), // Extract bank name from filename
                  };
                  
                  for (const key in card) {
                    if (Object.prototype.hasOwnProperty.call(card, key) && !(key in finalMetadata)) {
                        finalMetadata[key] = card[key];
                    }
                  }

                  allDocs.push(
                    new Document({
                      pageContent: pageContent,
                      metadata: finalMetadata,
                    })
                  );
                }
              } else {
                console.warn(
                  `Could not dynamically find a valid credit_cards array in the first object of ${filePath}. Ensure the JSON structure contains an array of card objects. Skipping.`
                );
              }
            } catch (jsonError) {
              console.error(`Error processing JSON file ${filePath}:`, jsonError);
            }
          }
        }
      } catch (dirError) {
        console.error(`Error reading directory ${dir}:`, dirError);
      }
    }

    if (allDocs.length === 0) {
      console.log("No documents created from the specified directories.");
      return [];
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, 
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(allDocs);
    console.log(
      `Successfully chunked ${chunkedDocs.length} documents from ${allDocs.length} source entries.`
    );
    return chunkedDocs;
  } catch (e) {
    console.error(e);
    throw new Error("Docs chunking from directories failed!");
  }
} 