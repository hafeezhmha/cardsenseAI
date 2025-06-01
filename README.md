# CardSense - RAG Implementation

Built with:

✅ Next.js 13
✅ Vercel's AI SDK
✅ Shadcn-ui
✅ Langchain TypeScript integration
✅ PineconeDB as the knowledge store
✅ Dark Mode with persistent theme-switching

🗃️ Pre-requisites

Create a free account and get an OPEN_AI key from platform.openai.com
Create a free account and get access to PineconeDB
And populate your .env file with the required information.
Make sure to set the `DATA_DIRECTORIES` environment variable in your `.env` file. This should be a comma-separated list of paths to the directories containing your source JSON files (e.g., `DATA_DIRECTORIES=axis,hdfc,icici`).

💬 Good to know

The PineconeDB index creation happens when we run npm run prepare:data, but its better to create it manually if you dont want the command to fail.
If the command fails, then give sometime for pinecone index to get initialized and try to run the command again, it should work eventually.

🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command | Action |
|---|---|
| npm install | Installs dependencies |
| npm run prepare:data | Scans directories specified in `DATA_DIRECTORIES`, processes JSON files, splits them into chunks, embeds them, and uploads them to Pinecone. |
| npm run dev | Starts the local dev server at localhost:3000 |

🚸 Roadmap

✅ Add sources to the streamed chat bubble
🚧 Clean up and show proper error messages
🚧 Sanitize input and output source documents 