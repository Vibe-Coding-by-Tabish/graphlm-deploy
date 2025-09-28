import "dotenv/config";
import pLimit from 'p-limit';
import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph';
import { ChatOpenAI } from '@langchain/openai';
import { LLMGraphTransformer } from '@langchain/community/experimental/graph_transformers/llm';

export async function indexToNeo4j(docs, opts = {}) {
  const url = opts.url || process.env.NEO4J_URI;
  const username = opts.username || process.env.NEO4J_USERNAME;
  const password = opts.password || process.env.NEO4J_PASSWORD;
  const concurrency = opts.concurrency || 3;
  const modelName = opts.modelName || 'gpt-4o-mini';
  const clearDatabase = opts.clear || process.env.NEO4J_CLEAR === '1' || false;

  if (!url || !username || !password) {
    throw new Error('Missing Neo4j connection details (NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD)');
  }

  const graph = await Neo4jGraph.initialize({ url, username, password });

  try {
    if (clearDatabase) {
      try {
        await graph.query('MATCH (n) DETACH DELETE n');
        console.log('Neo4j: cleared existing database');
      } catch (err) {
        console.warn('Neo4j: failed to clear database, continuing', err?.message || err);
      }
    }

    const model = new ChatOpenAI({
      temperature: 0,
      model: modelName
    });

    const llmGraphTransformer = new LLMGraphTransformer({
      llm: model,
      nodeProperties: true,
      relationshipProperties: false,
      additionalInstructions: opts.additionalInstructions ||
        'Extract key entities from this document. For each entity: 1) Give it a clear, descriptive name, 2) Assign it a meaningful type/category (like Person, Organization, Concept, Technology, etc.), 3) Create relationships that show how entities connect. Make sure every entity has both a readable name and a clear category type.',
      strictMode: false,
    });

    const limit = pLimit(concurrency);

    let totalNodes = 0;
    let totalRelationships = 0;

    const promises = docs.map((doc, idx) =>
      limit(async () => {
        try {
          const graphDocs = await llmGraphTransformer.convertToGraphDocuments([doc]);

          // Normalize nodes for Neo4j display
          graphDocs.forEach((graphDoc) => {
            (graphDoc.nodes || []).forEach((node) => {
              if (!node.properties) node.properties = {};

              const displayName = node.properties.name || node.id || 'Unknown';
              node.properties.name = displayName;
              node.properties.title = displayName;
              node.properties.label = displayName;
              node.properties.caption = displayName;

              if (!node.type || String(node.type).trim() === '') node.type = 'Entity';
              node.type = String(node.type).replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
            });
          });

          if (graphDocs.length > 0) {
            const chunkNodes = graphDocs.reduce((sum, d) => sum + (d.nodes?.length || 0), 0);
            const chunkRels = graphDocs.reduce((sum, d) => sum + (d.relationships?.length || 0), 0);

            // add to neo4j
            await graph.addGraphDocuments(graphDocs);

            totalNodes += chunkNodes;
            totalRelationships += chunkRels;

            console.log(`Neo4j: added chunk ${idx + 1} — nodes: ${chunkNodes}, relationships: ${chunkRels}`);
          }

          return { nodes: 0, relationships: 0 };
        } catch (err) {
          console.error(`Neo4j: error processing chunk ${idx + 1}:`, err?.message || err);
          return { nodes: 0, relationships: 0 };
        }
      })
    );

    await Promise.all(promises);

    return {
      status: 'ok',
      nodesAdded: totalNodes,
      relationshipsAdded: totalRelationships,
    };
  } finally {
    try {
      await graph.close();
      console.log('Neo4j: connection closed');
    } catch (e) {
      console.warn('Neo4j: error closing connection', e?.message || e);
    }
  }
}

export default indexToNeo4j;
