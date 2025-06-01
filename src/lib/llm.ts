import { ChatOpenAI } from "@langchain/openai";
import { env } from "./config";

export const streamingModel = new ChatOpenAI({
  modelName: "mistralai/mistral-7b-instruct:free",
  streaming: false,
  verbose: true,
  temperature: 0,
  openAIApiKey: env.OPENROUTER_API_KEY,
  maxTokens: 1024,
  modelKwargs: { 
    "tiktoken_model_name": "gpt-3.5-turbo",
  },
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://localhost:3000",
      "X-Title": "CardSense AI",
    },
  },
});

export const nonStreamingModel = new ChatOpenAI({
  modelName: "mistralai/mistral-7b-instruct:free",
  verbose: true,
  temperature: 0,
  openAIApiKey: env.OPENROUTER_API_KEY,
  maxTokens: 512,
  modelKwargs: { 
    "tiktoken_model_name": "gpt-3.5-turbo",
  },
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://localhost:3000",
      "X-Title": "CardSense AI",
    },
  },
});
