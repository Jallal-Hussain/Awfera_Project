import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import FileUpload from "../components/FileUpload";
import PdfList from "../components/PdfList";
import * as pdfService from "../api/pdfService"; // Import all service functions
import { Loader2Icon, Send } from "lucide-react";

type PDF = {
  uuid: string;
  filename: string;
};

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

  const selectedPdf = pdfs.find((pdf) => pdf.uuid === selectedUuid);

  return (
    <div className="w-full min-h-screen max-w-4xl md:max-w-5xl mx-auto px-6 py-6 md:py-10">
      <h2 className="text-2xl lg:text-4xl font-bold mb-4 lg:mb-12 text-center">
        Your PDFs
      </h2>

      <FileUpload
        onUpload={handleUpload}
        uploading={uploading}
        progress={progress}
      />

      {success && (
        <div className="text-green-600 dark:text-green-500 mb-2">{success}</div>
      )}
      {error && (
        <div className="text-red-600 dark:text-red-500 mb-2">{error}</div>
      )}

      <PdfList
        pdfs={pdfs}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onSelect={setSelectedUuid}
      />

      {selectedUuid && (
        <form
          onSubmit={handleQuery}
          className="flex flex-col items-center md:justify-between md:items-baseline-last md:flex-row gap-4 mt-10 mb-6"
        >
          <div className="md:w-full flex flex-col justify-between gap-2">
            <label className="font-medium self-start">
              Ask about PDF ({selectedPdf?.filename || selectedUuid}):
            </label>
            <input
              className="p-3 rounded-lg border border-foreground bg-background text-foreground placeholder:text-muted-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              type="text"
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your question..."
              disabled={isQuerying}
              required
            />
          </div>
          <button
            className="px-4 py-3 lg:px-5 lg:py-3.5 bg-primary hover:bg-primary/80 text-white shadow-lg hover:shadow-primary/20 rounded-lg font-medium flex items-center transition group cursor-pointer"
            type="submit"
            disabled={isQuerying}
          >
            {isQuerying ? (
              <Loader2Icon className="animate-spin transition-transform h-5 w-5 text-white" />
            ) : (
              <Send className="h-5 w-5 text-white" />
            )}
          </button>
        </form>
      )}

      {/* ---The Blinking/Pulsing Loader --- */}
      {isQuerying && (
        <div className="mb-4 w-full bg-white/50 dark:bg-gray-900/50 rounded-xl p-8 border border-[rgb(var(--color-border))] animate-pulse">
          <div className="h-4 bg-gray-400 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-400 rounded w-full"></div>
        </div>
      )}

      {!isQuerying && llmResult && (
        <div className="mb-4 w-full text-background/95 bg-muted-secondary/90 rounded-xl shadow-lg p-8 border border-primary">
          <div className="font-semibold mb-2">LLM Response:</div>
          <div className="whitespace-pre-line">{llmResult}</div>
        </div>
      )}
    </div>
  );
}
