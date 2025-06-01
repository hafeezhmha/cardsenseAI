# Implementing Conversation History in a Python RAG Bot

This document outlines the methodology and logic for adding a conversation history feature to a Python-based Retrieval Augmented Generation (RAG) bot.

## 1. Goal of Conversation History

The primary goal is to enable the RAG bot to "remember" previous turns in the conversation (both user inputs and bot responses). This allows the bot to:

*   Understand follow-up questions that refer to earlier parts of the dialogue (e.g., "What about its side effects?" after discussing a medication).
*   Maintain context over multiple interactions, leading to more coherent and natural conversations.
*   Avoid asking for information the user has already provided.
*   Personalize responses based on the ongoing interaction.

## 2. Core Components and Logic

Implementing conversation history involves several key components and logical steps:

### A. History Storage

You need a mechanism to store the conversation turns. Each turn typically consists of the user's message and the bot's corresponding reply.

*   **Data Structure**: A list of objects or dictionaries is common, where each element represents a turn:
    ```python
    # Example turn structure
    turn = {
        "user": "What is the capital of France?",
        "bot": "The capital of France is Paris."
    }
    chat_history = [turn1, turn2, ...]
    ```
    Or, if using a framework like Langchain, you might use specific message objects (e.g., `HumanMessage`, `AIMessage`).

*   **Storage Mechanisms**:
    1.  **In-Memory (Simple List)**:
        *   **Logic**: Maintain a Python list within your bot's runtime.
        *   **Pros**: Simple to implement for single-session, non-persistent bots.
        *   **Cons**: History is lost when the bot restarts or the session ends. Not suitable for multi-user or persistent scenarios.
    2.  **Session-Based (Web Frameworks)**:
        *   **Logic**: If your bot is part of a web application (e.g., using Flask, Django), store the history in the user's session.
        *   **Pros**: Handles multiple users separately, history persists for the duration of the user's session.
        *   **Cons**: History might still be lost if the session expires or the server restarts (depending on session backend).
    3.  **Database (Persistent)**:
        *   **Logic**: Store conversation history in a database (SQL like PostgreSQL, SQLite; or NoSQL like MongoDB). Each conversation could have a unique ID, and turns are stored linked to this ID.
        *   **Pros**: Fully persistent, supports long-term memory and multi-session conversations.
        *   **Cons**: More complex to set up and manage.
    4.  **File-Based (Simple Persistence)**:
        *   **Logic**: Save conversation history to a file (e.g., JSON, CSV) for each user or session.
        *   **Pros**: Simpler than a full database for basic persistence.
        *   **Cons**: Can be inefficient for frequent read/writes and complex queries.

### B. Formatting History for LLMs

LLMs typically expect history to be formatted in a specific way, often as a sequence of messages indicating who said what.

*   **Langchain Example**:
    ```python
    from langchain_core.messages import HumanMessage, AIMessage

    chat_history = [
        HumanMessage(content="What is the capital of France?"),
        AIMessage(content="The capital of France is Paris."),
        HumanMessage(content="What is its population?"),
    ]
    ```
*   **Generic Formatting**: A simple string where turns are clearly delineated:
    ```
    Human: What is the capital of France?
    AI: The capital of France is Paris.
    Human: What is its population?
    ```

### C. Integrating History into the RAG Pipeline

The history is used at two critical points in a conversational RAG system:

1.  **Standalone Question Generation (Question Condensing/Rephrasing)**:
    *   **Purpose**: To make the user's latest query understandable on its own, incorporating context from the history.
    *   **Logic**:
        1.  Take the current `chat_history` and the `current_user_query`.
        2.  Feed them to an LLM with a prompt specifically designed for this task.
        3.  **Prompt Example**:
            ```
            Given the following conversation history and a follow-up question, rephrase the follow-up question to be a standalone question that incorporates all relevant context from the history.

            Chat History:
            {chat_history}

            Follow Up Input: {current_user_query}
            Standalone question:
            ```
        4.  The LLM's output is the `standalone_question`. This is then used for document retrieval.

2.  **Contextual Answer Generation**:
    *   **Purpose**: To generate a final answer using the retrieved documents, the (possibly rephrased) question, AND the conversation history for conversational coherence.
    *   **Logic**:
        1.  Retrieve relevant `documents` using the `standalone_question`.
        2.  Feed the `chat_history`, the `standalone_question` (or original question if rephrasing isn't strictly needed for simple RAGs), and the `retrieved_documents_context` to another LLM.
        3.  **Prompt Example**:
            ```
            You are a helpful AI assistant. Use the following pieces of context and the chat history to answer the question at the end.
            If you don't know the answer, just say that you don't know, don't try to make up an answer.
            If the question is not related to the context or chat history, politely respond that you are tuned to only answer questions related to the provided information.

            Context:
            {retrieved_documents_context}

            Chat History:
            {chat_history}

            Question: {standalone_question}
            Helpful Answer:
            ```

## 3. Step-by-Step Implementation Flow

1.  **Initialization**:
    *   Choose a history storage mechanism.
    *   Initialize an empty history for a new user/session.

2.  **User Sends a Message**:
    *   Receive `current_user_query`.
    *   Retrieve `chat_history` from storage.

3.  **Generate Standalone Question (Conditional or Always)**:
    *   If `chat_history` is not empty:
        *   Format `chat_history` and `current_user_query` for the question-rephrasing LLM.
        *   Call the LLM to get the `standalone_question`.
    *   Else (history is empty):
        *   `standalone_question = current_user_query`

4.  **Retrieve Documents**:
    *   Use the `standalone_question` to query your vector store and get relevant `retrieved_documents`.

5.  **Generate Bot Response**:
    *   Format `chat_history`, `standalone_question`, and `retrieved_documents` for the answer-generation LLM.
    *   Call the LLM to get the `bot_response`.

6.  **Update History**:
    *   Create a new turn: `new_turn = {"user": current_user_query, "bot": bot_response}` (or use `HumanMessage`/`AIMessage`).
    *   Append `new_turn` to `chat_history`.
    *   Save the updated `chat_history` to your chosen storage.

7.  **Send Response to User**:
    *   Display/send `bot_response`.

## 4. Key Considerations and Best Practices

*   **History Length / Windowing**:
    *   LLMs have token limits. Very long histories can exceed these limits or introduce noise.
    *   **Strategies**:
        *   **Fixed Window**: Only keep the last N turns (e.g., last 5-10 turns).
        *   **Token-Based Window**: Keep as many recent turns as fit within a certain token budget.
        *   **Summarization**: For very long conversations, periodically use an LLM to summarize older parts of the history, replacing multiple turns with a concise summary. Langchain has `ConversationSummaryMemory` and `ConversationSummaryBufferMemory` for this.

*   **Prompt Engineering**:
    *   The prompts for both question rephrasing and answer generation are crucial. Experiment with different phrasings to get the desired behavior.
    *   Clearly instruct the LLM on how to use the history (e.g., "refer to the chat history to understand pronoun references").

*   **Handling the First Turn**:
    *   The logic should gracefully handle cases where the history is empty (i.e., the first message from the user). Typically, no question rephrasing is needed.

*   **User Experience**:
    *   Consider if/how the bot should indicate it's using history (e.g., subtle phrasing, or implicit understanding).

*   **Cost and Latency**:
    *   Passing history to LLMs increases the number of tokens processed, which can affect cost and latency. Implement windowing or summarization to manage this.

## 5. Python Implementation with Langchain (Conceptual)

Langchain provides abstractions that simplify history management:

*   **Memory Modules**:
    *   `ConversationBufferMemory`: Stores messages in a buffer and makes them available as a variable.
    *   `ConversationBufferWindowMemory`: Keeps a window of the last K interactions.
    *   `ConversationSummaryMemory` / `ConversationSummaryBufferMemory`: Uses an LLM to create a summary of the conversation over time.
*   **Chains**:
    *   `ConversationalRetrievalChain`: An end-to-end chain that combines a retriever with a chat model and memory to handle conversational RAG. It internally manages question rephrasing and contextual answering using history.

    ```python
    # Highly conceptual example using Langchain
    from langchain.memory import ConversationBufferMemory
    from langchain.chains import ConversationalRetrievalChain
    from langchain_openai import ChatOpenAI # Or your preferred LLM
    # from your_project import get_vector_store # Your vector store retriever

    # llm = ChatOpenAI(model_name="gpt-3.5-turbo")
    # retriever = get_vector_store().as_retriever()
    # memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    # qa_chain = ConversationalRetrievalChain.from_llm(
    #     llm=llm,
    #     retriever=retriever,
    #     memory=memory
    # )

    # # First interaction
    # response1 = qa_chain.invoke({"question": "What is Langchain?"})
    # print(response1['answer'])

    # # Second interaction (history is automatically used)
    # response2 = qa_chain.invoke({"question": "How does it help with RAG?"})
    # print(response2['answer'])
    ```

This structure should provide a solid foundation for implementing conversation history in your Python RAG bot. You can adapt the complexity of the storage and history management techniques based on your project's specific requirements. 