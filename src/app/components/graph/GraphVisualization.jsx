"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function GraphVisualization({ 
  collection = 'all', 
  isFullScreen = false, 
  onClose = null,
  onMaximize = null
}) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const nodesDataSetRef = useRef(null);
  const edgesDataSetRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState({ nodeCount: 0, edgeCount: 0 });

  // Debounce timer ref
  const debounceTimer = useRef(null);

  // Stable fetch function
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        collection: collection,
        limit: isFullScreen ? '500' : '100'
      });
      console.log('Fetching graph data for collection:', collection, 'isFullScreen:', isFullScreen);
      const response = await fetch(`/api/graph?${params}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch graph data');
      }
      console.log('Graph data received:', data);
      setGraphData({
        nodes: data.nodes || [],
        edges: data.edges || []
      });
      setStats(data.stats || { nodeCount: 0, edgeCount: 0 });
    } catch (err) {
      console.error('Graph fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collection, isFullScreen]);

  // Initialize vis-network
  useEffect(() => {
    if (!containerRef.current || loading || error) return;
    
    if (graphData.nodes.length === 0) {
      // Still create the network but with empty data
      // This ensures the container is properly initialized for future updates
    }

    // Network options
    const options = {
      nodes: {
        shape: 'dot',
        size: 40, // Increased from 25 to 30
        font: {
          size: 25,
          color: '#1f2937',
          face: 'arial',
          background: 'rgba(255,255,255,0.7)',
          strokeWidth: 2,
          strokeColor: '#ffffff'
        },
        borderWidth: 3,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.3)',
          size: 10,
          x: 2,
          y: 2
        },
        color: {
          border: '#2563eb',
          background: '#dbeafe',
          highlight: {
            border: '#1d4ed8',
            background: '#bfdbfe'
          },
          hover: {
            border: '#3b82f6',
            background: '#eff6ff'
          }
        },
        physics: true,
        mass: 1,
        fixed: {
          x: false,
          y: false
        }
      },
      edges: {
        width: 4,
        color: { 
          color: '#64748b', 
          highlight: '#1e293b',
          hover: '#374151'
        },
        arrows: {
          to: { 
            enabled: true, 
            scaleFactor: 1.2,
            type: 'arrow'
          }
        },
        smooth: {
          enabled: true,
          type: 'dynamic',
          roundness: 0.5
        },
        font: {
          size: 20,
          color: '#475569',
          strokeWidth: 2,
          strokeColor: '#ffffff',
          align: 'middle'
        },
        length: 200, // Preferred edge length
        physics: true,
        shadow: {
          enabled: false
        }
      },
      physics: {
        enabled: graphData.nodes.length > 0, // Only enable physics if we have data
        stabilization: { 
          iterations: 100, // Reduced iterations for faster initial layout
          updateInterval: 50
        },
        barnesHut: {
          gravitationalConstant: -15000, // Much stronger repulsion
          centralGravity: 0.05, // Minimal central gravity
          springLength: 200, // Longer springs for more space
          springConstant: 0.02, // Weaker springs
          damping: 0.2, // Less damping for more movement
          avoidOverlap: 1 // Strong overlap avoidance
        },
        maxVelocity: 30,
        minVelocity: 0.75, // Higher minimum velocity to keep nodes moving
        solver: 'barnesHut',
        timestep: 0.5,
        adaptiveTimestep: true
      },
      interaction: {
        hover: true,
        selectConnectedEdges: false,
        zoomView: true,
        dragView: true
      },
      autoResize: true,
      height: '100%',
      width: '100%'
    };

    // Create or update DataSets
    if (!nodesDataSetRef.current) {
      nodesDataSetRef.current = new DataSet(graphData.nodes);
      edgesDataSetRef.current = new DataSet(graphData.edges);
    } else {
      // Update existing DataSets
      nodesDataSetRef.current.clear();
      edgesDataSetRef.current.clear();
      nodesDataSetRef.current.add(graphData.nodes);
      edgesDataSetRef.current.add(graphData.edges);
    }

    const data = { 
      nodes: nodesDataSetRef.current, 
      edges: edgesDataSetRef.current 
    };
    
    // Create network if it doesn't exist, otherwise just update data
    if (!networkRef.current) {
      const network = new Network(containerRef.current, data, options);
      networkRef.current = network;
    } else {
      networkRef.current.setData(data);
    }

    // Add event listeners only if we have data
    if (graphData.nodes.length > 0) {
      networkRef.current.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = graphData.nodes.find(n => n.id === nodeId);
          console.log('Node clicked:', node);
        }
      });

      // Keep physics enabled for continuous repulsion
      networkRef.current.on('stabilizationIterationsDone', () => {
        // Don't disable physics immediately - let it run for natural movement
        setTimeout(() => {
          if (networkRef.current) {
            // Only reduce physics, don't disable completely
            networkRef.current.setOptions({ 
              physics: { 
                enabled: true,
                barnesHut: {
                  gravitationalConstant: -10000, // Reduced but still active
                  centralGravity: 0.02,
                  springLength: 200,
                  springConstant: 0.01,
                  damping: 0.8, // Higher damping for gentle movement
                  avoidOverlap: 1
                }
              } 
            });
          }
        }, 2000); // Wait 2 seconds before reducing physics
      });

      // Re-enable full physics when user drags nodes
      networkRef.current.on('dragStart', (params) => {
        if (params.nodes.length > 0) {
          networkRef.current.setOptions({ 
            physics: { 
              enabled: true,
              barnesHut: {
                gravitationalConstant: -20000,
                centralGravity: 0.05,
                springLength: 200,
                springConstant: 0.02,
                damping: 0.2,
                avoidOverlap: 1
              }
            } 
          });
        }
      });

      // Enable physics and start stabilization for new data
      networkRef.current.setOptions({ physics: { enabled: true } });
      networkRef.current.stabilize();
    }

    // Resize network when container changes
    const resizeObserver = new ResizeObserver(() => {
      if (networkRef.current) {
        networkRef.current.redraw();
        networkRef.current.fit();
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
      if (nodesDataSetRef.current) {
        nodesDataSetRef.current.clear();
        nodesDataSetRef.current = null;
      }
      if (edgesDataSetRef.current) {
        edgesDataSetRef.current.clear();
        edgesDataSetRef.current = null;
      }
    };
  }, [graphData, loading, error, isFullScreen]);

  // Debounced effect for collection changes
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchGraphData();
    }, 400); // 400ms debounce
    return () => clearTimeout(debounceTimer.current);
  }, [collection, fetchGraphData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Loading graph...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <div className="text-sm mb-2">Failed to load graph</div>
          <div className="text-xs text-gray-500">{error}</div>
          <button 
            onClick={fetchGraphData}
            className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center text-gray-500">
        <div>
          <div className="text-sm mb-2">No graph data available</div>
          <div className="text-xs mb-3">Upload some PDFs to generate a knowledge graph</div>
          <button 
            onClick={fetchGraphData}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
          <div className="text-xs mt-2 text-gray-400">
            Collection: {collection} | Full Screen: {isFullScreen ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullScreen ? 'w-full h-full' : 'w-full h-full'}`}>
      {/* Full Screen Header */}
      {isFullScreen && onClose && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Knowledge Graph</h2>
            <div className="text-sm text-gray-600">
              {stats.nodeCount} nodes, {stats.edgeCount} relationships
            </div>
          </div>
        </div>
      )}
      
      {/* Graph Stats (for embedded view) */}
      {!isFullScreen && (
        <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600">
          {stats.nodeCount} nodes, {stats.edgeCount} edges
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {/* Refresh Button */}
        <button
          onClick={fetchGraphData}
          className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors"
          title="Refresh graph"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        {/* Maximize/Minimize Button */}
        <button
          onClick={() => {
            if (isFullScreen && onClose) {
              onClose(); // If we're in full screen, minimize
            } else if (!isFullScreen && onMaximize) {
              onMaximize(); // If we're in embedded view, maximize
            } else {
              console.log('Maximize/minimize action not available');
            }
          }}
          className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors"
          title={isFullScreen ? "Minimize graph" : "Maximize graph"}
        >
          {isFullScreen ? (
            <Minimize2 className="w-4 h-4 text-gray-600" />
          ) : (
            <Maximize2 className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Graph Container */}
      <div 
        ref={containerRef} 
        className={`w-full ${isFullScreen ? 'h-full pt-16' : 'h-full'} bg-gray-50`}
        style={{ minHeight: isFullScreen ? '100vh' : '400px' }}
      />
    </div>
  );
}