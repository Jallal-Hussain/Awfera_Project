import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import FileUpload from "../components/FileUpload";
import PdfList from "../components/PdfList";
import ChatInterface from "../components/ChatInterface";
import DocumentSummaryComponent from "../components/DocumentSummary";
import ConversationList from "../components/ConversationList";
import * as pdfService from "../api/pdfService";
import { LoaderCircle, Send } from "lucide-react";

type PDF = {
  uuid: string;
  filename: string;
};

type ViewMode = "upload" | "chat" | "summary" | "conversations";

interface SelectedDocument {
  uuid: string;
  filename: string;
}

const getErrorMessage = (err: unknown) => {
  if (isAxiosError(err)) {
    return err.response?.data?.detail || "An unexpected API error occurred.";
  }
  return "An unexpected error occurred.";
};

export default function Dashboard() {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [llmResult, setLlmResult] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("upload");
  const [selectedDocument, setSelectedDocument] =
    useState<SelectedDocument | null>(null);
  const [currentConversationUuid, setCurrentConversationUuid] = useState<
    string | null
  >(null);
  const [conversationRefreshTrigger, setConversationRefreshTrigger] =
    useState(0);

  // --- Data Fetching ---
  const fetchPdfs = async () => {
    try {
      const pdfs = await pdfService.fetchPdfsAPI();
      setPdfs(pdfs);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  // --- Handlers ---
  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    setSuccess("");
    setProgress(0);
    const uuid = crypto.randomUUID();

    try {
      await pdfService.uploadPdfAPI(uuid, file, setProgress);
      setSuccess("Upload successful!");
      fetchPdfs();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    try {
      await pdfService.deletePdfAPI(uuid);
      setSuccess("Deleted successfully.");
      fetchPdfs();
      // Clear selected document if it was deleted
      if (selectedDocument?.uuid === uuid) {
        setSelectedDocument(null);
        setViewMode("upload");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDownload = async (uuid: string) => {
    try {
      await pdfService.downloadPdfAPI(uuid);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUuid || !query) return;

    // --- Start loading state ---
    setIsQuerying(true);
    setLlmResult(null);
    setError("");

    try {
      const result = await pdfService.queryLlmAPI(selectedUuid, query);
      setLlmResult(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      // --- End loading state ---
      setIsQuerying(false);
    }
  };

  // --- New Handlers for Chat and Summary ---
  const handleDocumentSelect = (uuid: string, action: "chat" | "summary") => {
    const pdf = pdfs.find((p) => p.uuid === uuid);
    if (!pdf) return;

    setSelectedDocument({ uuid, filename: pdf.filename });
    setCurrentConversationUuid(null);
    setViewMode(action);
    setError("");
    setSuccess("");
  };

  const handleConversationStart = (conversation: pdfService.Conversation) => {
    setCurrentConversationUuid(conversation.uuid);
    setConversationRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectConversation = (
    conversationUuid: string,
    documentUuid: string,
    documentFilename: string
  ) => {
    setSelectedDocument({ uuid: documentUuid, filename: documentFilename });
    setCurrentConversationUuid(conversationUuid);
    setViewMode("chat");
  };

  const selectedPdf = pdfs.find((pdf) => pdf.uuid === selectedUuid);

  return (
    <div className="w-full min-h-screen max-w-4xl md:max-w-5xl mx-auto px-6 py-6 md:py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          Document Intelligence Hub
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Upload, analyze, and chat with your PDF documents using AI-powered
          insights
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
        <button
          onClick={() => setViewMode("upload")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
            viewMode === "upload"
              ? "bg-primary text-white shadow-lg"
              : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
          }`}
        >
          <i className="bx bx-upload mr-2"></i>
          Manage Documents
        </button>
        <button
          onClick={() => setViewMode("conversations")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
            viewMode === "conversations"
              ? "bg-primary text-white shadow-lg"
              : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
          }`}
        >
          <i className="bx bx-conversation mr-2"></i>
          Conversations
        </button>
        {selectedDocument && (
          <>
            <button
              onClick={() => setViewMode("chat")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                viewMode === "chat"
                  ? "bg-primary text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
              }`}
            >
              <i className="bx bx-chat mr-2"></i>
              Chat with Document
            </button>
            <button
              onClick={() => setViewMode("summary")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                viewMode === "summary"
                  ? "bg-primary text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
              }`}
            >
              <i className="bx bx-file-doc mr-2"></i>
              Document Summary
            </button>
          </>
        )}
      </div>

      {/* Status Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <i className="bx bx-check-circle text-green-500 mr-2"></i>
            <span className="text-green-600 dark:text-green-400">
              {success}
            </span>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <i className="bx bx-error text-red-500 mr-2"></i>
            <span className="text-red-600 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="space-y-8">
        {/* Upload/Manage Documents View */}
        {viewMode === "upload" && (
          <div className="space-y-6">
            <FileUpload
              onUpload={handleUpload}
              uploading={uploading}
              progress={progress}
            />

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Your Documents
              </h3>
              <PdfList
                pdfs={pdfs}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onSelect={setSelectedUuid}
                onChat={(uuid) => handleDocumentSelect(uuid, "chat")}
                onSummarize={(uuid) => handleDocumentSelect(uuid, "summary")}
              />

              {/* Original Query Interface (kept for backward compatibility) */}
              {selectedUuid && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                    Quick Query (Legacy Mode)
                  </h4>
                  <form
                    onSubmit={handleQuery}
                    className="flex flex-col md:flex-row gap-4"
                  >
                    <div className="flex-1">
                      <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Ask about PDF ({selectedPdf?.filename || selectedUuid}):
                      </label>
                      <input
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type your question..."
                        disabled={isQuerying}
                        required
                      />
                    </div>
                    <button
                      className="px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium flex items-center transition disabled:opacity-50"
                      type="submit"
                      disabled={isQuerying}
                    >
                      {isQuerying ? (
                        <LoaderCircle className="text-white animate-spin tranistion-transform ease-in-out" />
                      ) : (
                        <Send className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </form>

                  {/* Loading State */}
                  {isQuerying && (
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-full"></div>
                    </div>
                  )}

                  {/* Query Result */}
                  {!isQuerying && llmResult && (
                    <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      <div className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                        <i className="bx bx-brain text-primary mr-2"></i>
                        AI Response:
                      </div>
                      <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                        {llmResult}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conversations View */}
        {viewMode === "conversations" && (
          <ConversationList
            onSelectConversation={handleSelectConversation}
            refreshTrigger={conversationRefreshTrigger}
          />
        )}

        {/* Chat View */}
        {viewMode === "chat" && selectedDocument && (
          <div className="h-[600px]">
            <ChatInterface
              documentUuid={selectedDocument.uuid}
              documentFilename={selectedDocument.filename}
              conversationUuid={currentConversationUuid || undefined}
              onConversationStart={handleConversationStart}
            />
          </div>
        )}

        {/* Summary View */}
        {viewMode === "summary" && selectedDocument && (
          <DocumentSummaryComponent
            documentUuid={selectedDocument.uuid}
            documentFilename={selectedDocument.filename}
          />
        )}
      </div>
    </div>
  );
}
