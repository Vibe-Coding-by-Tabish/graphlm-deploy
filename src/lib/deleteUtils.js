import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph';

/**
 * Delete a Qdrant collection by name
 */
export async function deleteQdrantCollection(collectionName, opts = {}) {
  try {
    const client = new QdrantClient({
      url: opts.url || process.env.QDRANT_URL || "http://localhost:6333",
      apiKey: opts.apiKey || process.env.QDRANT_API_KEY,
    });

    // Check if collection exists first
    const collections = await client.getCollections();
    const collectionExists = collections.collections.some(
      (col) => col.name === collectionName
    );

    if (!collectionExists) {
      return {
        status: 'warning',
        message: `Collection "${collectionName}" does not exist`
      };
    }

    // Delete the collection
    await client.deleteCollection(collectionName);
    
    console.log(`Qdrant: deleted collection "${collectionName}"`);
    return {
      status: 'ok',
      message: `Collection "${collectionName}" deleted successfully`
    };
  } catch (error) {
    console.error('Qdrant deletion error:', error);
    return {
      status: 'error',
      message: `Failed to delete collection: ${error.message}`
    };
  }
}

/**
 * Delete all Neo4j data
 */
export async function deleteNeo4jData(opts = {}) {
  const url = opts.url || process.env.NEO4J_URI;
  const username = opts.username || process.env.NEO4J_USERNAME;
  const password = opts.password || process.env.NEO4J_PASSWORD;

  if (!url || !username || !password) {
    return {
      status: 'error',
      message: 'Missing Neo4j connection details'
    };
  }

  let graph;
  try {
    graph = await Neo4jGraph.initialize({ url, username, password });
    
    // Get count before deletion for feedback
    const countResult = await graph.query('MATCH (n) RETURN count(n) as nodeCount');
    const nodeCount = countResult[0]?.nodeCount || 0;

    if (nodeCount === 0) {
      return {
        status: 'warning',
        message: 'No nodes found in Neo4j database'
      };
    }

    // Delete all nodes and relationships
    await graph.query('MATCH (n) DETACH DELETE n');
    
    console.log(`Neo4j: deleted ${nodeCount} nodes and their relationships`);
    return {
      status: 'ok',
      message: `Deleted ${nodeCount} nodes and their relationships`
    };
  } catch (error) {
    console.error('Neo4j deletion error:', error);
    return {
      status: 'error',
      message: `Failed to delete Neo4j data: ${error.message}`
    };
  } finally {
    if (graph) {
      try {
        await graph.close();
      } catch (e) {
        console.warn('Neo4j: error closing connection', e?.message || e);
      }
    }
  }
}