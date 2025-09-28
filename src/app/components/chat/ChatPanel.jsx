"use client";
import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/src/lib/utils";

export default function ChatPanel() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [streamResponse, setStreamResponse] = useState("");
  const [currentCollection, setCurrentCollection] = useState("");
  const messagesEndRef = useRef(null);

  // Function to parse citations from content
  const parseContent = (content) => {
    const citationRegex = /\\\[\\\[citation:([^\\]]+?)\\\]\\\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", value: content.substring(lastIndex, match.index) });
      }
      const citationData = match[1].split("|").map((s) => s.trim());
      const source = citationData[0];
      const page = citationData[1] || "N/A";
      parts.push({ type: "citation", source, page });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: "text", value: content.substring(lastIndex) });
    }
    return parts;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Read collection from URL and listen for changes
  useEffect(() => {
    // Read initial collection from URL
    const params = new URLSearchParams(window.location.search);
    const collection = params.get('collection');
    
    // Only set collection if it exists in URL, otherwise use default
    if (collection) {
      setCurrentCollection(collection);
    } else {
      setCurrentCollection("research_papers");
    }

    // Listen for collection changes from UploadForm
    const handleCollectionChange = (event) => {
      // If cleared, fall back to default collection
      setCurrentCollection(event.detail || "research_papers");
    };

    // Listen for data deletion events
    const handleDataDeleted = () => {
      // Remove collection from URL and reset to default
      const url = new URL(window.location);
      url.searchParams.delete('collection');
      window.history.replaceState({}, '', url);
      setCurrentCollection("research_papers");
    };

    window.addEventListener('collectionChanged', handleCollectionChange);
    window.addEventListener('dataDeleted', handleDataDeleted);

    return () => {
      window.removeEventListener('collectionChanged', handleCollectionChange);
      window.removeEventListener('dataDeleted', handleDataDeleted);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamResponse]);

  const handleSendMessage = async () => {
    const text = message.trim();
    if (!text || streaming) return;

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setMessage("");
    setStreaming(true);
    setStreamResponse("");

    // Local accumulator for streaming content
    let streamedContent = "";

    try {
      const response = await fetch("/api/rag-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          collection: currentCollection || "research_papers"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("✅ Stream completed");
          break;
        }

        // Decode the text chunk directly (no SSE parsing needed)
        const text = decoder.decode(value, { stream: true });
        
        // Update streaming response in real-time
        streamedContent += text;
        setStreamResponse((prev) => prev + text);
      }

      // Finalize the assistant message
      const finalContent = streamedContent.trim();
      if (finalContent) {
        setMessages((prev) => [...prev, { role: "assistant", content: finalContent }]);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setStreamResponse("Error: " + (error?.message || String(error)));
    }

    // Reset streaming state
    setStreaming(false);
    setStreamResponse("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="border-2 border-slate-100 rounded-lg p-2 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-slate-600" />
          Chat with AI
        </h3>
        {currentCollection && currentCollection !== "research_papers" && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {currentCollection}
          </span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-md border-2 border-dashed border-slate-100 p-3">
        {messages.length === 0 && !streaming ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-center">
            <div>Start a conversation about your research</div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-blue-600" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "user" 
                    ? "bg-blue-600 text-white" 
                    : "bg-white border border-gray-200"
                )}>
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div>
                      {parseContent(msg.content).map((part, index) =>
                        part.type === "text" ? (
                          <ReactMarkdown
                            key={index}
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || "");
                                return !inline && match ? (
                                  <pre className="bg-gray-800 text-white p-2 rounded-md overflow-x-auto my-2">
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </pre>
                                ) : (
                                  <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                              h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-md font-semibold mb-2" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-sm font-medium mb-1" {...props} />,
                              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2" {...props} />,
                            }}
                          >
                            {part.value}
                          </ReactMarkdown>
                        ) : (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-1 cursor-pointer hover:bg-blue-200 transition-colors"
                            title={`Source: ${part.source}, Page: ${part.page}`}
                          >
                            [{part.source}:{part.page}]
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming Response */}
            {(streaming || streamResponse) && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3 h-3 text-blue-600" />
                </div>
                <div className="max-w-[80%] space-y-2">
                  {streamResponse && (
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      <div>
                        {parseContent(streamResponse).map((part, index) =>
                          part.type === "text" ? (
                            <ReactMarkdown
                              key={index}
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  return !inline && match ? (
                                    <pre className="bg-gray-800 text-white p-2 rounded-md overflow-x-auto my-2">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  ) : (
                                    <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded-sm" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-md font-semibold mb-2" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-sm font-medium mb-1" {...props} />,
                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2" {...props} />,
                              }}
                            >
                              {part.value}
                            </ReactMarkdown>
                          ) : (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-1 cursor-pointer hover:bg-blue-200 transition-colors"
                              title={`Source: ${part.source}, Page: ${part.page}`}
                            >
                              [{part.source}:{part.page}]
                            </span>
                          )
                        )}
                        {streaming && (
                          <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1"></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask questions about your research..."
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-inner"
          disabled={streaming}
        />
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={!message.trim() || streaming}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
