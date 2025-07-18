
import { useRef, useState } from "react";

type FileUploadProps = {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  progress: number;
};

export default function FileUpload({ onUpload, uploading, progress }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await onUpload(file);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="flex-1 p-2 rounded border dark:border-purple-400 bg-transparent text-[rgb(var(--color-text))] placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button
          type="submit"
          className="bg-[rgb(var(--color-primary))] text-white dark:text-white rounded p-2 font-semibold hover:opacity-90 transition cursor-pointer"
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
    </>
  );
}