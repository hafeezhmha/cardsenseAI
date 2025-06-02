# CardSense AI - Your Intelligent Credit Card Assistant

CardSense AI is a RAG (Retrieval Augmented Generation) application designed to answer questions about credit cards. It uses a language model augmented with information retrieved from a Pinecone vector database, which is populated with your credit card data.

**Live Application:** [cardsense-ai.vercel.app](https://cardsense-ai.vercel.app/)

## ✨ Features

*   **Next.js 14 App Router:** Modern React framework for building the user interface and API.
*   **Vercel AI SDK:** For streaming chat responses in the UI.
*   **Shadcn/ui:** Beautifully designed UI components.
*   **Langchain (TypeScript):** For orchestrating the RAG pipeline (embedding, retrieval, generation).
*   **PineconeDB:** Vector store for efficient similarity search of credit card information.
*   **OpenAI / OpenRouter LLMs:** For generating answers and embeddings.
*   **Dark Mode:** Persistent theme switching for user preference.
*   **Dual API Endpoints:**
    *   Streaming chat API for the web interface.
    *   JSON API for programmatic access to the RAG chain.

##  prerequisite-setup Prerequisites & Setup

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-repository-name>
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root of your project by copying the `.env.example` file (if one exists) or by creating it manually. Populate it with the following:

    ```env
    # OpenAI API Key (for embeddings and/or generation if not using OpenRouter for all)
    OPENAI_API_KEY=sk-your_openai_api_key

    # OpenRouter API Key (optional, if using OpenRouter for LLM access)
    # Get from https://openrouter.ai/keys
    OPENROUTER_API_KEY=sk-or-v1-your_openrouter_api_key

    # Pinecone Configuration
    PINECONE_API_KEY=your_pinecone_api_key
    PINECONE_ENVIRONMENT=your_pinecone_environment # e.g., "gcp-starter" or "us-east-1" etc.
    PINECONE_INDEX_NAME=your_pinecone_index_name   # e.g., "cardsense"
    PINECONE_NAMESPACE=your_pinecone_namespace     # Optional: for multi-tenancy within an index

    # Data Source Configuration
    # Comma-separated list of directory names under a base 'docs' or 'data' directory
    # (e.g., if your data is in 'docs/axis', 'docs/hdfc', set to "axis,hdfc")
    # The script 'pinecone-prepare-docs.ts' assumes these are subdirectories of a common path.
    # Please verify the script `src/scripts/pinecone-prepare-docs.ts` for exact path construction if needed.
    DATA_DIRECTORIES=your_data_subdirectories # e.g., axis,hdfc,icici

    # Timeout for Pinecone index initialization (in milliseconds)
    INDEX_INIT_TIMEOUT=60000
    ```
    *   Get your OpenAI API key from [platform.openai.com](https://platform.openai.com/).
    *   Get your Pinecone API key and environment details from [app.pinecone.io](https://app.pinecone.io/).
    *   Get your OpenRouter API key from [openrouter.ai](https://openrouter.ai/keys) (if you're using it).

4.  **Prepare Data for Pinecone:**
    *   Place your credit card information as JSON files into respective directories (e.g., `docs/hdfc/my_hdfc_cards.json`, `docs/axis/axis_cards.json`).
    *   The `pinecone-prepare-docs.ts` script processes these files.
    *   **Important:** It's recommended to create your Pinecone index manually through the Pinecone console *before* running the data preparation script. Ensure the index dimensions match your embedding model (e.g., OpenAI `text-embedding-3-small` has 1536 dimensions).
    *   Run the data preparation script:
        ```bash
        npm run prepare:data
        ```
        This script will:
        *   Scan the directories specified in `DATA_DIRECTORIES`.
        *   Process the JSON files.
        *   Split the content into chunks.
        *   Generate embeddings using OpenAI.
        *   Upload the embedded chunks to your Pinecone index.

    *   **Note:** If the `prepare:data` script fails, it might be because the Pinecone index is not yet fully initialized. Wait a few minutes and try again.

## 🧞 Available Commands

All commands are run from the root of the project in your terminal:

| Command            | Action                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `npm install`      | Installs project dependencies.                                                                                                       |
| `npm run dev`        | Starts the local development server at `http://localhost:3000`.                                                                    |
| `npm run build`      | Builds the application for production.                                                                                               |
| `npm run start`      | Starts the production server (after running `npm run build`).                                                                      |
| `npm run lint`       | Lints the codebase.                                                                                                                  |
| `npm run prepare:data` | Processes local JSON data, embeds it, and uploads it to the Pinecone index. (See "Prepare Data for Pinecone" section for details). |
| `npm run clear:index`| **Caution:** Deletes all vectors from the configured Pinecone index (or a specific namespace if `PINECONE_NAMESPACE` is set).    |

## 🤖 API Endpoints

### 1. Chat API (for Web UI)

*   **Endpoint:** `/api/chat`
*   **Method:** `POST`
*   **Description:** Powers the streaming chat interface on the website. Uses Vercel's AI SDK.
*   **Request Body (example):**
    ```json
    {
      "messages": [
        { "role": "user", "content": "Hello" },
        { "role": "assistant", "content": "Hi there! How can I help you with credit cards today?" },
        { "role": "user", "content": "Tell me about the Pixel Play Card." }
      ]
    }
    ```
*   **Response:** A streaming text response.

### 2. Query API (for Programmatic Access)

*   **Endpoint:** `/api/query`
*   **Method:** `POST`
*   **Description:** Provides a non-streaming JSON response for programmatic RAG queries. Ideal for backend integrations or external tools.
*   **Request Body (example):**
    ```json
    {
      "messages": [
        { "role": "assistant", "content": "Previously, I mentioned the NovaSpark card is good for cashback." },
        { "role": "user", "content": "What about its annual fee?" }
      ]
    }
    ```
    *   The `messages` array should contain the chat history (if any) followed by the current user question as the last message.
*   **Response (example on success `200 OK`):**
    ```json
    {
      "answer": "The NovaSpark card has no annual fee.",
      "sources": [
        {
          "content": "The NovaSpark card offers 2% cashback on all purchases and no annual fee. It also includes...",
          "url": "docs/novaspark_card_details.json"
        }
      ]
    }
    ```
*   **Response (example on error):**
    ```json
    {
      "error": "Failed to process request",
      "details": "Specific error message here"
    }
    ```

## 🚸 Roadmap & Known Issues

*   Enhance error handling and provide more user-friendly messages.
*   Further sanitize input and output, especially source document presentation.
*   Investigate more sophisticated chunking and retrieval strategies.
*   Add comprehensive unit and integration tests.