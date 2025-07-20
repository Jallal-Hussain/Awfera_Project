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
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file"
          placeholder="Upload your PDF"
          accept="application/pdf"
          onChange={handleFileChange}
          className="flex-1 w-full p-3 rounded-lg border-2 border-[#00ABE4] bg-[#E9F1FA] text-[#000F14]/80 cursor-pointer hover:text-[#000F14]/60 hover:border-[#008CBE]"
        />
        <button
          type="submit"
          className="px-4 py-3 lg:px-5 lg:py-3.5 bg-[#00ABE4] hover:bg-[#00ABE4]/80 text-[#FFFFFF] shadow-lg hover:shadow-[#00ABE4]/20 rounded-lg font-medium flex items-center transition group cursor-pointer"
          disabled={uploading || !file}
        >
          <i className="bx bx-folder-up-arrow mr-2 lg:mr-3 text-lg lg:text-xl group-hover:rotate-12 transition-transform"></i>
          <span>
            {uploading ? `Uploading... (${progress}%)` : "Upload PDF"}
          </span>
        </button>
      </form>
      {progress > 0 && uploading && (
        <div className="w-full bg-[#E9F1FA] rounded h-2 mb-4">
          <div
            className="bg-[#00ABE4] h-2 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </>
  );
}
