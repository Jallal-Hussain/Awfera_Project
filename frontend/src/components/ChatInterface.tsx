import { useState, useEffect, useRef } from "react";
import {
  type ChatMessage,
  type Conversation,
  startConversationAPI,
  continueConversationAPI,
  getConversationAPI,
} from "../api/pdfService";

interface ChatInterfaceProps {
  documentUuid: string;
  documentFilename: string;
  conversationUuid?: string;
  onConversationStart?: (conversation: Conversation) => void;
}

export default function ChatInterface({
  documentUuid,
  documentFilename,
  conversationUuid,
  onConversationStart,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load existing conversation if conversationUuid is provided
  useEffect(() => {
    if (conversationUuid) {
      loadConversation();
    }
  }, [conversationUuid]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    if (!conversationUuid) return;

    try {
      const conv = await getConversationAPI(conversationUuid);
      setConversation(conv);
      setMessages(conv.messages);
    } catch (err: any) {
      setError("Failed to load conversation");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage("");
    setError("");
    setIsLoading(true);

    // Add user message to UI immediately
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      if (!conversation && !conversationUuid) {
        // Start new conversation
        const newConversation = await startConversationAPI(
          documentUuid,
          userMessage
        );
        setConversation(newConversation);
        setMessages(newConversation.messages);
        onConversationStart?.(newConversation);
      } else {
        // Continue existing conversation
        const assistantMessage = await continueConversationAPI(
          conversation?.uuid || conversationUuid!,
          userMessage
        );
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send message");
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-muted-secondary rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-muted-secondary/20 dark:border-muted/20">
        <div>
          <h3 className="text-lg font-semibold text-muted-secondary dark:text-white">
            {conversation?.title || "New Chat"}
          </h3>
          <p className="text-sm text-muted-secondary/50 dark:text-muted/50">
            {documentFilename}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <i className="bx bx-chat text-primary text-xl"></i>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !conversationUuid && (
          <div className="text-center text-muted-secondary/50 dark:text-muted/50 py-8">
            <i className="bx bx-message-dots text-4xl mb-4"></i>
            <p>Start a conversation about this document!</p>
            <p className="text-sm mt-2">
              Ask questions and I'll help you understand the content.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-3xl px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-white"
                  : "bg-muted/50 dark:bg-muted/10 text-muted-forground dark:text-white"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div
                className={`text-xs mt-1 ${
                  message.role === "user"
                    ? "text-muted"
                    : "text-muted-secondary/50 dark:text-muted/50"
                }`}
              >
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted/30 dark:bg-muted/10 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-muted-secondary/50 dark:text-muted/50">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Input form */}
      <div className="border-t border-muted-secondary/20 dark:border-muted/20 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Ask a question about this document..."
            className="flex-1 px-4 py-2 border border-muted-secondary/20 dark:border-muted/20 rounded-lg bg-white dark:bg-muted/10 text-muted-secondary dark:text-white placeholder-muted-secondary/50 dark:placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!currentMessage.trim() || isLoading}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <i className="bx bx-loader-dots bx-spin"></i>
            ) : (
              <i className="bx bx-send"></i>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
