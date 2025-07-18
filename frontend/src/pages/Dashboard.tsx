import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import FileUpload from "../components/FileUpload";
import PdfList from "../components/PdfList";
import * as pdfService from "../api/pdfService"; // Import all service functions

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
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Your PDFs</h2>

      <FileUpload
        onUpload={handleUpload}
        uploading={uploading}
        progress={progress}
      />

      {success && <div className="text-green-600 mb-2">{success}</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}

      <PdfList
        pdfs={pdfs}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onSelect={setSelectedUuid}
      />

      {selectedUuid && (
        <form onSubmit={handleQuery} className="mb-4 flex flex-col gap-2">
          <label className="font-semibold">
            Ask about PDF ({selectedPdf?.filename || selectedUuid}):
          </label>
          <input
            className="p-2 rounded border border-[rgb(var(--color-border))] bg-transparent text-[rgb(var(--color-text))] placeholder-gray-500 dark:placeholder-gray-400"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question..."
            disabled={isQuerying}
            required
          />
          <button
            className="bg-[rgb(var(--color-primary))] text-white rounded p-2 font-semibold hover:opacity-90 transition cursor-pointer"
            type="submit"
            disabled={isQuerying}
          >
            {isQuerying ? "LLM Thinking..." : "Ask LLM"}
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
        <div className="mb-4 w-full text-white bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg p-8 border border-[rgb(var(--color-border))]">
          <div className="font-semibold mb-2">LLM Response:</div>
          <div className="whitespace-pre-line">{llmResult}</div>
        </div>
      )}
    </div>
  );
}
