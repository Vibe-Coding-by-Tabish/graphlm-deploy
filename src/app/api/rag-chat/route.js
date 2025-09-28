import "dotenv/config";
import { Agent, Runner, tool } from "@openai/agents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { z } from "zod";

// Initialize clients
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const runner = new Runner({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

const RagTool = tool({
  name: "rag_tool",
  description:
    "Retrieve relevant context from uploaded research papers based on the user query",
  parameters: z.object({
    query: z
      .string()
      .describe("The search query to find relevant research context"),
    collection: z
      .string()
      .describe("The collection name to search in")
      .default("research_papers"),
    limit: z
      .number()
      .int("Must be an integer")
      .positive("Must be a positive number")
      .default(5),
  }),
  async execute({ query, collection = "research_papers", limit = 3 }) {
    try {
      // Create vector store from existing collection
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL || "http://localhost:6333",
          collectionName: collection,
        }
      );

      // Create retriever with specified limit
      const vectorRetriever = vectorStore.asRetriever({
        k: limit,
      });

      // Retrieve relevant chunks
      const relevantChunks = await vectorRetriever.invoke(query);

      // Format the results to match the expected structure
      const contexts = relevantChunks.map((doc, idx) => ({
        text: doc.pageContent,
        score: doc.metadata.score || 0.8, // LangChain doesn't always provide scores
        metadata: {
          source: doc.metadata.source || doc.metadata.filename || "Unknown",
          page: doc.metadata.page || doc.metadata.pageNumber || "N/A",
          ...doc.metadata, // Include any additional metadata
        },
      }));

      return contexts;
    } catch (error) {
      console.error("RAG retrieval error:", error);
      return [];
    }
  },
});

export async function POST(request) {
  try {
    const { message, collection = "research_papers" } = await request.json();

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const systemPrompt = `You are a research assistant AI that helps users understand and analyze research papers. 

You have access to a tool called 'rag_tool' that can search through uploaded research papers to find relevant information.

When a user asks a question:
1. Use the rag_tool with the collection "${collection}" to find relevant information from the research papers
2. Always specify collection="${collection}" when calling the rag_tool
3. Analyze the retrieved context carefully
4. Provide comprehensive, accurate answers based on the research content
5. Always cite sources when referencing specific information
6. If no relevant context is found, clearly state that you don't have information about that topic in the uploaded papers

Be helpful, accurate, and scholarly in your responses.`;

    // Create research assistant agent with RAG tool
    const researchAgent = new Agent({
      name: "Research Assistant",
      instructions: systemPrompt,
      tools: [RagTool],
      tool_choice: "auto",
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Start the agent run with streaming
          const agentStream = await runner.run(
            researchAgent,
            message,
            {
              stream: true,
              // Pass collection context to the agent
              context: {
                collection: collection,
                timestamp: new Date().toISOString()
              }
            }
          );

          const agentTextStream = agentStream.toTextStream({
            compatibleWithNodeStreams: false, // Use web streams
          });

          const reader = agentTextStream.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log("✅ Stream completed");
                break;
              }

              // Encode text chunks and send to frontend
              const chunk = encoder.encode(value);
              controller.enqueue(chunk);
            }
          } finally {
            reader.releaseLock();
          }

          await agentStream.completed;

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorMessage = `\n❌ Error: ${error.message}`;
          controller.enqueue(encoder.encode(errorMessage));
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Route error:", error);
    return Response.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    );
  }
}
