import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { isAxiosError } from "axios";

type PDF = {
  uuid: string;
  filename: string;
};

export default function Dashboard() {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [llmResult, setLlmResult] = useState<string | null>(null);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's PDFs
  const fetchPdfs = async () => {
    try {
      const res = await api.get(`http://127.0.0.1:8001/api/v1/list_uuids`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPdfs(res.data.uuids.map((uuid: string) => ({ uuid, filename: "" })));
    } catch {
      setError("Failed to fetch PDFs.");
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  // Upload PDF
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess("");
    setProgress(0);

    const uuid = crypto.randomUUID();
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(`http://127.0.0.1:8001/api/v1/upload/${uuid}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress(
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            );
          }
        },
      });
      setSuccess("Upload successful!");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchPdfs();
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.detail || "Upload failed");
      } else {
        setError("Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  // Download PDF
  const handleDownload = async (uuid: string) => {
    try {
      const res = await api.get(
        `http://127.0.0.1:8001/api/v1/download/${uuid}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${uuid}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError("Download failed.");
    }
  };

  // Delete PDF
  const handleDelete = async (uuid: string) => {
    try {
      await api.delete(`http://127.0.0.1:8001/api/v1/delete/${uuid}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSuccess("Deleted successfully.");
      fetchPdfs();
    } catch {
      setError("Delete failed.");
    }
  };

  // Query LLM
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUuid || !query) return;
    setLlmResult(null);
    setError("");
    try {
      const res = await api.get(
        `http://127.0.0.1:8001/api/v1/query/${selectedUuid}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: { query },
        }
      );
      setLlmResult(res.data.llm_response);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.detail || "Query failed");
      } else {
        setError("Query failed");
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Your PDFs</h2>
      <form
        onSubmit={handleUpload}
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="flex-1 border border-[rgb(var(--color-border))] rounded p-2 bg-transparent"
        />
        <button
          type="submit"
          className="bg-[rgb(var(--color-primary))] text-white rounded p-2 font-semibold hover:opacity-90 transition"
          disabled={uploading || !file}
        >
          {uploading ? `Uploading... (${progress}%)` : "Upload PDF"}
        </button>
      </form>
      {progress > 0 && uploading && (
        <div className="w-full bg-gray-200 rounded h-2 mb-4">
          <div
            className="bg-[rgb(var(--color-primary))] h-2 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}

      <ul className="mb-6">
        {pdfs.length === 0 && (
          <li className="text-gray-500">No PDFs uploaded yet.</li>
        )}
        {pdfs.map((pdf) => (
          <li
            key={pdf.uuid}
            className="flex items-center justify-between border-b border-[rgb(var(--color-border))] py-2"
          >
            <span className="truncate">{pdf.uuid}</span>
            <div className="flex gap-2">
              <button
                className="text-blue-600 hover:underline"
                onClick={() => handleDownload(pdf.uuid)}
              >
                Download
              </button>
              <button
                className="text-red-500 hover:underline"
                onClick={() => handleDelete(pdf.uuid)}
              >
                Delete
              </button>
              <button
                className="text-indigo-600 hover:underline"
                onClick={() => setSelectedUuid(pdf.uuid)}
              >
                Query
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selectedUuid && (
        <form onSubmit={handleQuery} className="mb-4 flex flex-col gap-2">
          <label className="font-semibold">
            Ask about PDF ({selectedUuid}):
          </label>
          <input
            className="p-2 rounded border border-[rgb(var(--color-border))] bg-transparent"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question..."
            required
          />
          <button
            className="bg-[rgb(var(--color-primary))] text-white rounded p-2 font-semibold hover:opacity-90 transition"
            type="submit"
          >
            Ask LLM
          </button>
        </form>
      )}

      {llmResult && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 shadow mb-4">
          <div className="font-semibold mb-2">LLM Response:</div>
          <div className="whitespace-pre-line">{llmResult}</div>
        </div>
      )}
    </div>
  );
}
