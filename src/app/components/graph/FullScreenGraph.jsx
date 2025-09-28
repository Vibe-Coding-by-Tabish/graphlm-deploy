"use client";
import React from 'react';
import GraphVisualization from './GraphVisualization';

export default function FullScreenGraph({ isOpen, onClose, collection }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <GraphVisualization 
        collection={collection}
        isFullScreen={true}
        onClose={onClose}
      />
    </div>
  );
}