import { deleteQdrantCollection, deleteNeo4jData } from "@/src/lib/deleteUtils";

export async function DELETE(request) {
  try {
    const { collection, target } = await request.json();

    if (!target || !['qdrant', 'neo4j', 'both'].includes(target)) {
      return Response.json(
        { error: "Invalid target. Must be 'qdrant', 'neo4j', or 'both'" },
        { status: 400 }
      );
    }

    const results = {};

    if (target === 'qdrant' || target === 'both') {
      if (!collection) {
        return Response.json(
          { error: "Collection name is required for Qdrant deletion" },
          { status: 400 }
        );
      }
      results.qdrant = await deleteQdrantCollection(collection);
    }

    if (target === 'neo4j' || target === 'both') {
      results.neo4j = await deleteNeo4jData();
    }

    return Response.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return Response.json(
      { error: "Failed to process deletion", details: error.message },
      { status: 500 }
    );
  }
}