import { ChatOpenAI } from "@langchain/openai";
import { env } from "./config";

export const streamingModel = new ChatOpenAI({
  modelName: "mistralai/mistral-7b-instruct-v0.3",
  streaming: true,
  verbose: true,
  temperature: 0,
  openAIApiKey: env.OPENROUTER_API_KEY,
  maxTokens: 2048,
  modelKwargs: { 
    "tiktoken_model_name": "gpt-3.5-turbo",
  },
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://localhost:3000",
      "X-Title": "Credit Card Bot",
    },
  },
});

export const nonStreamingModel = new ChatOpenAI({
  modelName: "mistralai/mistral-7b-instruct-v0.3",
  verbose: true,
  temperature: 0,
  openAIApiKey: env.OPENROUTER_API_KEY,
  maxTokens: 2048,
  modelKwargs: { 
    "tiktoken_model_name": "gpt-3.5-turbo",
  },
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://localhost:3000",
      "X-Title": "Credit Card Bot",
    },
  },
});
