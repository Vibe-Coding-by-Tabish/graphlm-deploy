"use client"
import { useState, useRef, useEffect } from "react";
import { RotateCcw, Eye, Trash2 } from "lucide-react";

export default function UploadForm() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  // Update URL when collection changes
  useEffect(() => {
    if (collectionName) {
      const url = new URL(window.location);
      url.searchParams.set('collection', collectionName);
      window.history.replaceState({}, '', url);
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('collectionChanged', { 
        detail: collectionName 
      }));
    } else {
      // Remove collection from URL when empty
      const url = new URL(window.location);
      url.searchParams.delete('collection');
      window.history.replaceState({}, '', url);

      // Notify other components that collection is cleared
      window.dispatchEvent(new CustomEvent('collectionChanged', {
        detail: ''
      }));
    }
  }, [collectionName]);

  const deleteData = async () => {
    if (!collectionName) {
      alert('Please enter a collection name first');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all data for collection "${collectionName}"?\n\nThis will delete:\n- Qdrant collection: ${collectionName}\n- All Neo4j nodes and relationships\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          collection: collectionName,
          target: 'both' // Delete both Qdrant and Neo4j
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setResult({
          ...result.results,
          deleteSuccess: true
        });
        
        // Dispatch event to notify ChatPanel that data was deleted
        window.dispatchEvent(new CustomEvent('dataDeleted'));
      } else {
        setResult({
          error: result.error || 'Failed to delete data'
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setResult({
        error: `Delete failed: ${error.message}`
      });
    } finally {
      setDeleting(false);
    }
  };

  const addFiles = (newFiles) => {
    const incoming = Array.from(newFiles || []);
    const merged = [...files];
    for (const f of incoming) {
      if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f);
    }
    setFiles(merged);
  };

  const previewFile = (file) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const uploadFiles = async (fileList) => {
    const filesArr = Array.from(fileList || []);
    if (filesArr.length === 0) return;

    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      filesArr.forEach((f) => fd.append("files", f));
      if (collectionName) fd.append('collection', collectionName);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      setResult(json);
      // reflect uploaded files in UI
      addFiles(filesArr);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e) => {
    const fileList = e.target.files;
    // Just add files to the selected list; upload occurs when user clicks Upload
    addFiles(fileList);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = (idx) => {
    setFiles((s) => s.filter((_, i) => i !== idx));
    // Clear the file input to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const humanFileSize = (size) => {
    if (size === 0) return "0 B";
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return `${(size / Math.pow(1024, i)).toFixed(1)} ${["B", "KB", "MB", "GB"][i]}`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {showPreview ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">PDF Preview</span>
            <button
              onClick={closePreview}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Close Preview
            </button>
          </div>
          <iframe
            src={previewUrl}
            className="flex-1 w-full border border-gray-300 rounded"
            title="PDF Preview"
          />
        </div>
      ) : (
        <>
          <div
            className={`${result ? 'h-22' : 'h-48'} border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
            onClick={() => fileInputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
        aria-label="Upload PDF files"
      >
        <input
          ref={fileInputRef}
          type="file"
          name="files"
          multiple
          accept="application/pdf"
          onChange={onFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 mb-2 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="text-gray-600">
            <div className="text-sm mb-1">Click to upload PDF or drag and drop</div>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-gray-700">Selected files:</div>
          {files.map((f, i) => (
            <div key={`${f.name}-${f.size}`} className={`flex items-center gap-2 p-2 bg-gray-50 rounded text-sm ${loading ? 'pulse-horizontal' : ''}`}>
              <span className="flex-1 text-gray-700 truncate pr-2" title={f.name}>{f.name}</span>
              <button
                type="button"
                onClick={() => previewFile(f)}
                className="flex-shrink-0 text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded mr-1"
                aria-label="Preview PDF"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="flex-shrink-0 text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center"
                aria-label="Remove file"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <input
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Enter collection name"
            aria-label="Collection name"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => uploadFiles(files)}
              disabled={loading || !collectionName || files.length === 0}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? 'Uploading...' : 'Upload & Index'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setCollectionName('');
                setResult(null);
                // Clear the file input to allow re-selecting files
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                // Dispatch event to clear collection from ChatPanel
                window.dispatchEvent(new CustomEvent('dataDeleted'));
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Results:</span>
            {!result.deleteSuccess && collectionName && (
              <button
                onClick={deleteData}
                disabled={deleting}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 transition-colors disabled:opacity-50"
                title={`Delete collection "${collectionName}" and all Neo4j data`}
              >
                <RotateCcw className="w-3 h-3" />
                {deleting ? 'Deleting...' : 'Reset Data'}
              </button>
            )}
          </div>
          
          {result.deleteSuccess && (
            <div className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-2 rounded text-sm">
              <div className="font-medium">Data Deleted Successfully</div>
              {result.qdrant && (
                <div className="text-xs mt-1">Qdrant: {result.qdrant.message}</div>
              )}
              {result.neo4j && (
                <div className="text-xs mt-1">Neo4j: {result.neo4j.message}</div>
              )}
            </div>
          )}
          
          {result.qdrant && !result.deleteSuccess && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
              result.qdrant.status === 'ok' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                result.qdrant.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium">Qdrant:</span> 
              <span>{result.qdrant.status === 'ok' ? `Added ${result.qdrant.added || 0} vectors` : 'Failed'}</span>
            </div>
          )}
          {result.neo4j && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
              result.neo4j.status === 'ok' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                result.neo4j.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-medium">Neo4j:</span> 
              <span>{result.neo4j.status === 'ok' ? `Added ${result.neo4j.nodesAdded || 0} nodes, ${result.neo4j.relationshipsAdded || 0} relationships` : 'Failed'}</span>
            </div>
          )}
          {result.error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded text-sm bg-red-50 text-red-700 border border-red-200">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="font-medium">Error:</span> 
              <span>{result.error}</span>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
