export const runtime = 'nodejs';

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { indexToQdrant } from '@/src/lib/qdrantIndex';
import { indexToNeo4j } from '@/src/lib/neo4jIndex';

// POST /api/upload
// Accepts multipart/form-data with fields:
// - files: one or more file inputs (PDFs)
// - collection: the qdrant collection name to index into
// Also accepts application/json body with { /* texts: string[] */ }

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Collect documents as objects: { pageContent: string, metadata: { source } }
    const docs = [];

    let providedCollection = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Read collection name provided by the user in the form
      providedCollection = formData.get('collection') || null;

      // Handle uploaded files (expecting input name "files")
      const fileEntries = formData.getAll('files');
      for (const file of fileEntries) {
        if (!file || !file.arrayBuffer) continue;
        const buffer = Buffer.from(await file.arrayBuffer());

        // Save uploaded PDF to a temp file and load with PDFLoader
        const tmpName = `${crypto.randomUUID()}-${file.name || 'upload.pdf'}`;
        const tmpPath = path.join(os.tmpdir(), tmpName);
        await fs.promises.writeFile(tmpPath, buffer);

        const loader = new PDFLoader(tmpPath);
        const rawDocs = await loader.load();

        // Ensure metadata includes source file name and push to docs
        for (const d of rawDocs) {
          d.metadata = d.metadata || {};
          d.metadata.source = file.name || d.metadata.source || 'uploaded.pdf';
          docs.push(d);
        }

        // Cleanup temp file
        try { await fs.promises.unlink(tmpPath); } catch (e) { /* ignore */ }
      }

      // NOTE: Text inputs are intentionally skipped for now as requested.
      // const textEntries = formData.getAll('texts');
      // ...
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      // JSON text input handling will be implemented later per request.
      // if (Array.isArray(body.texts)) { ... }
      // Allow collection via JSON as well
      if (body.collection) providedCollection = body.collection;
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported content-type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (docs.length === 0) {
      return new Response(JSON.stringify({ error: 'No documents found in request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Split documents into chunks
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splitDocs = await splitter.splitDocuments(docs);

    // Determine collection name: prefer user-provided, fallback to env
    const qdrantCollection = providedCollection || process.env.QDRANT_COLLECTION;
    if (!qdrantCollection) {
      return new Response(JSON.stringify({ error: 'No Qdrant collection provided. Please provide a collection name in the form (field: collection).' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Index to Qdrant using helper
    const qdrantResult = await indexToQdrant(splitDocs, qdrantCollection);

    // If Neo4j is configured, index there as well. If not configured, skip gracefully.
    let neo4jResult = null;
    if (process.env.NEO4J_URI || providedCollection?.startsWith('neo4j:')) {
      try {
        // Allow optional per-request control: collection name prefixed with "neo4j:" is ignored but used as flag
        neo4jResult = await indexToNeo4j(splitDocs, { clear: false });
      } catch (err) {
        console.error('Neo4j indexing failed', err);
        neo4jResult = { status: 'error', message: String(err) };
      }
    }

    return new Response(JSON.stringify({ qdrant: qdrantResult, neo4j: neo4jResult }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Indexing error', err);
    return new Response(JSON.stringify({ error: 'internal_error', message: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
