import { useState, useEffect } from "react";
import {
  type ConversationListItem,
  getConversationsAPI,
  deleteConversationAPI,
} from "../api/pdfService";

interface ConversationListProps {
  onSelectConversation: (
    conversationUuid: string,
    documentUuid: string,
    documentFilename: string
  ) => void;
  refreshTrigger?: number; // To trigger refresh from parent
}

export default function ConversationList({
  onSelectConversation,
  refreshTrigger,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [refreshTrigger]);

  const fetchConversations = async () => {
    setLoading(true);
    setError("");

    try {
      const convs = await getConversationsAPI();
      setConversations(convs);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (
    conversationUuid: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent triggering the select conversation

    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }

    setDeletingId(conversationUuid);

    try {
      await deleteConversationAPI(conversationUuid);
      setConversations((convs) =>
        convs.filter((conv) => conv.uuid !== conversationUuid)
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete conversation");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <i className="bx bx-conversation text-primary mr-2"></i>
          Recent Conversations
        </h3>
        <button
          onClick={fetchConversations}
          disabled={loading}
          className="text-gray-600 dark:text-gray-400 hover:text-primary disabled:opacity-50"
        >
          <i className="bx bx-refresh text-lg"></i>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <i className="bx bx-error text-red-500 mr-2"></i>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {conversations.length === 0 && !loading && !error && (
        <div className="text-center py-8">
          <i className="bx bx-conversation text-gray-400 text-6xl mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No conversations yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Start chatting with your documents to see conversations here
          </p>
        </div>
      )}

      <div className="space-y-3">
        {conversations.map((conversation) => (
          <div
            key={conversation.uuid}
            onClick={() =>
              onSelectConversation(
                conversation.uuid,
                conversation.document_uuid,
                conversation.document_filename
              )
            }
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  {truncateTitle(conversation.title)}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                  <i className="bx bx-file text-primary mr-1"></i>
                  {truncateTitle(conversation.document_filename, 40)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span className="flex items-center">
                    <i className="bx bx-message-dots mr-1"></i>
                    {conversation.message_count} messages
                  </span>
                  <span>{formatDate(conversation.updated_at)}</span>
                </div>
              </div>

              <button
                onClick={(e) => handleDeleteConversation(conversation.uuid, e)}
                disabled={deletingId === conversation.uuid}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-all disabled:opacity-50"
                title="Delete conversation"
              >
                {deletingId === conversation.uuid ? (
                  <i className="bx bx-loader-dots bx-spin"></i>
                ) : (
                  <i className="bx bx-trash"></i>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
