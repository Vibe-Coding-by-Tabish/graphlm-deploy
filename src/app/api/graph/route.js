import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph';

// Helper function to assign colors based on node labels
function getNodeColor(label) {
  const colorMap = {
    'Document': '#3498db',    // Blue for documents
    'Person': '#e74c3c',      // Red for people
    'Organization': '#2ecc71', // Green for organizations
    'Concept': '#f39c12',     // Orange for concepts
    'Location': '#9b59b6',    // Purple for locations
    'Entity': '#95a5a6'       // Gray for generic entities
  };
  return colorMap[label] || '#95a5a6';
}

// Helper function to extract meaningful label from node data
function extractNodeLabel(record) {
  // Try different properties that might contain meaningful names
  const possibleLabels = [
    record.name,
    record.title,
    record.caption,
    record.label,
    record.text,
    record.content,
    record.value
  ].filter(label => {
    // Filter out undefined, null, empty strings, and element IDs
    if (!label || typeof label !== 'string') return false;
    if (label.trim() === '') return false;
    // Filter out Neo4j element IDs (they typically contain colons and long hex strings)
    if (label.includes(':') && label.length > 20) return false;
    return true;
  });

  // If we have a meaningful label, use it
  if (possibleLabels.length > 0) {
    return possibleLabels[0];
  }

  // Fallback: try to extract meaningful text from properties object
  if (record.properties && typeof record.properties === 'object') {
    const propValues = Object.values(record.properties).filter(val => {
      if (!val || typeof val !== 'string') return false;
      if (val.trim() === '') return false;
      if (val.includes(':') && val.length > 20) return false;
      return true;
    });
    if (propValues.length > 0) {
      return propValues[0];
    }
  }

  // Last resort: use the node type/label or Unknown
  const nodeType = record.labels?.[0];
  return nodeType && nodeType !== 'Entity' ? nodeType : 'Unknown';
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection') || 'all';
    const limitParam = searchParams.get('limit') || '100';
    const limit = Math.floor(Number(limitParam)); // Ensure it's an integer
    
    const url = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!url || !username || !password) {
      return Response.json(
        { error: 'Neo4j connection details not configured' },
        { status: 500 }
      );
    }

    const graph = await Neo4jGraph.initialize({ url, username, password });

    try {
      // First, let's try to get nodes and relationships separately to handle empty graph
      const nodesQuery = `
        MATCH (n)
        RETURN 
          elementId(n) as id,
          n.name as name,
          n.title as title,
          n.text as text,
          n.content as content,
          n.value as value,
          n.label as label,
          n.caption as caption,
          labels(n) as labels,
          properties(n) as properties
        LIMIT ${limit}
      `;

      const relationshipsQuery = `
        MATCH (n)-[r]->(m)
        RETURN 
          elementId(n) as source_id,
          n.name as source_name,
          n.title as source_title,
          n.text as source_text,
          n.content as source_content,
          n.value as source_value,
          n.label as source_label,
          n.caption as source_caption,
          labels(n) as source_labels,
          properties(n) as source_properties,
          type(r) as relationship_type,
          r.type as relationship_label,
          properties(r) as relationship_properties,
          elementId(m) as target_id,
          m.name as target_name,
          m.title as target_title,
          m.text as target_text,
          m.content as target_content,
          m.value as target_value,
          m.label as target_label,
          m.caption as target_caption,
          labels(m) as target_labels,
          properties(m) as target_properties
        LIMIT ${limit}
      `;

      const [nodesResult, relationshipsResult] = await Promise.all([
        graph.query(nodesQuery),
        graph.query(relationshipsQuery).catch(() => []) // Handle case where no relationships exist
      ]);

      // Debug: Log raw data from Neo4j
      console.log('Raw nodes data from Neo4j:');
      nodesResult.slice(0, 5).forEach((node, index) => {
        console.log(`Node ${index}:`, {
          id: node.id,
          name: node.name,
          title: node.title,
          labels: node.labels,
          allProperties: Object.keys(node)
        });
      });

      console.log('Raw relationships data from Neo4j:');
      relationshipsResult.slice(0, 5).forEach((rel, index) => {
        console.log(`Relationship ${index}:`, {
          source_id: rel.source_id,
          source_name: rel.source_name,
          source_title: rel.source_title,
          source_labels: rel.source_labels,
          relationship_type: rel.relationship_type,
          target_id: rel.target_id,
          target_name: rel.target_name,
          target_title: rel.target_title,
          target_labels: rel.target_labels,
          allProperties: Object.keys(rel)
        });
      });

      // Transform data for vis-network format
      const nodes = new Map();
      const edges = [];

      // Process standalone nodes
      nodesResult.forEach((record) => {
        const nodeId = record.id;
        if (!nodes.has(nodeId)) {
          const nodeLabel = extractNodeLabel(record);
          
          console.log(`Creating node: ${nodeId} with label: ${nodeLabel} from properties:`, {
            name: record.name,
            title: record.title,
            caption: record.caption,
            text: record.text,
            content: record.content,
            value: record.value,
            label: record.label,
            labels: record.labels,
            properties: record.properties
          });

          nodes.set(nodeId, {
            id: nodeId,
            label: nodeLabel,
            title: nodeLabel, // Tooltip
            group: record.labels?.[0] || 'Entity',
            font: { size: 14 },
            borderWidth: 2,
            color: getNodeColor(record.labels?.[0])
          });
        }
      });

      // Process relationships and connected nodes
      relationshipsResult.forEach((record, index) => {
        // Add source node
        const sourceId = record.source_id;
        if (!nodes.has(sourceId)) {
          const sourceLabel = extractNodeLabel({
            name: record.source_name,
            title: record.source_title,
            caption: record.source_caption,
            text: record.source_text,
            content: record.source_content,
            value: record.source_value,
            label: record.source_label,
            labels: record.source_labels,
            properties: record.source_properties
          });

          nodes.set(sourceId, {
            id: sourceId,
            label: sourceLabel,
            title: sourceLabel, // Tooltip
            group: record.source_labels?.[0] || 'Entity',
            font: { size: 14 },
            borderWidth: 2,
            color: getNodeColor(record.source_labels?.[0])
          });
        }

        // Add target node
        const targetId = record.target_id;
        if (!nodes.has(targetId)) {
          const targetLabel = extractNodeLabel({
            name: record.target_name,
            title: record.target_title,
            caption: record.target_caption,
            text: record.target_text,
            content: record.target_content,
            value: record.target_value,
            label: record.target_label,
            labels: record.target_labels,
            properties: record.target_properties
          });

          nodes.set(targetId, {
            id: targetId,
            label: targetLabel,
            title: targetLabel, // Tooltip
            group: record.target_labels?.[0] || 'Entity',
            font: { size: 14 },
            borderWidth: 2,
            color: getNodeColor(record.target_labels?.[0])
          });
        }

        // Add edge
        edges.push({
          id: `edge-${index}`,
          from: sourceId,
          to: targetId,
          label: record.relationship_type || record.relationship_label || 'RELATES_TO',
          arrows: 'to',
          font: { size: 12, align: 'middle' },
          smooth: { type: 'curvedCW', roundness: 0.2 }
        });
      });

      // Convert nodes Map to Array
      const nodesArray = Array.from(nodes.values());

      return Response.json({
        nodes: nodesArray,
        edges: edges,
        stats: {
          nodeCount: nodesArray.length,
          edgeCount: edges.length
        }
      });

    } finally {
      await graph.close();
    }

  } catch (error) {
    console.error('Graph query error:', error);
    return Response.json(
      { error: 'Failed to fetch graph data', details: error.message },
      { status: 500 }
    );
  }
}