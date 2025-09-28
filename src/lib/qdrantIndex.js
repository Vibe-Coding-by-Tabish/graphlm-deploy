import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { QdrantVectorStore } from "@langchain/qdrant";

export async function indexToQdrant(docs, collectionName) {
  if (!collectionName) {
    throw new Error("collectionName is required to index to Qdrant");
  }

  const qdrantUrl = process.env.QDRANT_URL || process.env.NEXT_PUBLIC_QDRANT_URL || "http://localhost:6333";
  const qdrantApiKey = process.env.QDRANT_API_KEY || process.env.NEXT_PUBLIC_QDRANT_API_KEY;

  const embeddings = new OpenAIEmbeddings({
    model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const clientOptions = { url: qdrantUrl };
  if (qdrantApiKey) clientOptions.apiKey = qdrantApiKey;

  const client = new QdrantClient(clientOptions);

  // Use fromDocuments so the collection will be created/updated as needed
  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    client,
    collectionName,
  });

  return {
    status: 'ok',
    collection: collectionName,
    added: docs.length,
  };
}

export default indexToQdrant;
