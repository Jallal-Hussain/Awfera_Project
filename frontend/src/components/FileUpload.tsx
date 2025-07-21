import { useRef, useState } from "react";

type FileUploadProps = {
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  progress: number;
};

export default function FileUpload({
  onUpload,
  uploading,
  progress,
}: FileUploadProps) {
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
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center md:flex-row gap-4 mb-6"
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file"
          placeholder="Upload your PDF"
          accept="application/pdf"
          onChange={handleFileChange}
          className="flex-1 w-full p-3 rounded-lg border-2 border-primary bg-background/95 text-foreground/80 cursor-pointer hover:text-foreground/60 hover:border-secondary transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-3 lg:px-5 lg:py-3.5 bg-primary hover:bg-primary/80 text-white shadow-lg hover:shadow-primary/20 rounded-lg font-medium flex items-center transition group cursor-pointer"
          disabled={uploading || !file}
        >
          {uploading ? `Uploading... (${progress}%)` : "Upload PDF"}
        </button>
      </form>
      {progress > 0 && uploading && (
        <div className="w-full bg-background rounded h-2 mb-4">
          <div
            className="bg-primary h-2 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </>
  );
}
