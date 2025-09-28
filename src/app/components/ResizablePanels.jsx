"use client";
import React, { useEffect, useState, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ChatPanel from "./chat/ChatPanel";
import GraphVisualization from "./graph/GraphVisualization";
import FullScreenGraph from "./graph/FullScreenGraph";
import { Network } from "lucide-react";

export default function ResizablePanels() {
  const [defaultLayout, setDefaultLayout] = useState([50, 50]);
  const chatPanelRef = useRef(null);
  const graphPanelRef = useRef(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isGraphCollapsed, setIsGraphCollapsed] = useState(false);
  const [showFullScreenGraph, setShowFullScreenGraph] = useState(false);
  const [currentCollection, setCurrentCollection] = useState("");

  useEffect(() => {
    // Load saved layout from localStorage on component mount
    const savedLayout = localStorage.getItem("resizable-panels:chat-graph-layout");
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        setDefaultLayout(parsedLayout);
      } catch (error) {
        console.error("Failed to parse saved layout:", error);
      }
    }

    // Listen for collection changes
    const handleCollectionChange = (event) => {
      setCurrentCollection(event.detail || "");
    };

    // Read initial collection from URL
    const params = new URLSearchParams(window.location.search);
    const collection = params.get('collection');
    if (collection) {
      setCurrentCollection(collection);
    }

    window.addEventListener('collectionChanged', handleCollectionChange);

    return () => {
      window.removeEventListener('collectionChanged', handleCollectionChange);
    };
  }, []);

  const onLayout = (sizes) => {
    // Save layout to localStorage for persistence across sessions
    localStorage.setItem("resizable-panels:chat-graph-layout", JSON.stringify(sizes));
    
    // Update collapse state based on panel sizes
    setIsChatCollapsed(sizes[0] <= 5);
    setIsGraphCollapsed(sizes[1] <= 5);
  };

  const handleResizeHandleClick = () => {
    // Toggle between collapsed and expanded states
    if (isChatCollapsed) {
      // Expand chat panel
      if (chatPanelRef.current) {
        chatPanelRef.current.expand();
      }
    } else if (isGraphCollapsed) {
      // Expand graph panel
      if (graphPanelRef.current) {
        graphPanelRef.current.expand();
      }
    } else {
      // Neither is collapsed, so collapse the larger panel
      const savedLayout = JSON.parse(localStorage.getItem("resizable-panels:chat-graph-layout") || "[50, 50]");
      if (savedLayout[0] >= savedLayout[1]) {
        // Collapse chat panel (it's larger or equal)
        if (chatPanelRef.current) {
          chatPanelRef.current.collapse();
        }
      } else {
        // Collapse graph panel (it's larger)
        if (graphPanelRef.current) {
          graphPanelRef.current.collapse();
        }
      }
    }
  };

  const handleResizeHandleDoubleClick = () => {
    // Reset both panels to equal sizes (50/50)
    if (chatPanelRef.current && graphPanelRef.current) {
      chatPanelRef.current.resize(50);
      graphPanelRef.current.resize(50);
    }
  };

  return (
    <PanelGroup direction="horizontal" onLayout={onLayout} className="col-span-3 relative">
      {/* Chat Panel */}
      <Panel 
        ref={chatPanelRef}
        defaultSize={defaultLayout[0]} 
        minSize={15}
        collapsible={true}
        className="relative"
      >
        <ChatPanel />
      </Panel>

      {/* Resize Handle - Click to toggle collapse/expand, Double-click to reset to 50/50 */}
      <PanelResizeHandle 
        className="w-2 transition-colors flex items-center justify-center group hover:bg-slate-300 cursor-pointer"
        onClick={handleResizeHandleClick}
        onDoubleClick={handleResizeHandleDoubleClick}
        title={
          isChatCollapsed 
            ? "Click to expand chat panel • Double-click to reset layout" 
            : isGraphCollapsed 
            ? "Click to expand graph panel • Double-click to reset layout" 
            : "Click to collapse a panel • Double-click to reset layout • Drag to resize"
        }
      >
        <div className="w-0.5 h-4 bg-slate-300 group-hover:bg-slate-500 transition-colors"></div>
      </PanelResizeHandle>

      {/* Knowledge Graph Panel */}
      <Panel 
        ref={graphPanelRef}
        defaultSize={defaultLayout[1]} 
        minSize={15}
        collapsible={true}
        className="relative"
      >
        <div className="border-2 border-slate-100 rounded-lg p-2 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Network className="h-4 w-4 text-slate-600" />
              Knowledge Graph
            </h3>
            <button
              type="button"
              onClick={() => {
                // Dummy action - no longer opens full screen
                console.log('Full Graph button clicked - dummy action');
              }}
              className="px-3 py-1 text-xs bg-gray-400 hover:bg-gray-500 text-white rounded-full transition-colors cursor-default"
              title="Full Graph (dummy button)"
            >
              Full Graph
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <GraphVisualization 
              collection={currentCollection || "all"}
              isFullScreen={false}
              onMaximize={() => setShowFullScreenGraph(true)}
            />
          </div>
        </div>
      </Panel>

      {/* Full Screen Graph Modal */}
      <FullScreenGraph 
        isOpen={showFullScreenGraph}
        onClose={() => setShowFullScreenGraph(false)}
        collection={currentCollection || "all"}
      />
    </PanelGroup>
  );
}