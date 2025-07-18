
type PDF = {
    uuid: string;
    filename: string; // Let's keep this for future use
  };
  
  type PdfListProps = {
    pdfs: PDF[];
    onDownload: (uuid: string) => void;
    onDelete: (uuid: string) => void;
    onSelect: (uuid: string) => void;
  };
  
  export default function PdfList({ pdfs, onDownload, onDelete, onSelect }: PdfListProps) {
    if (pdfs.length === 0) {
      return <p className="text-gray-500 mb-6">No PDFs uploaded yet.</p>;
    }
  
    return (
      <ul className="mb-6">
        {pdfs.map((pdf) => (
          <li
            key={pdf.uuid}
            className="flex items-center justify-between border-b border-gray-700 py-2 dark:border-purple-400"
          >
            <span className="truncate">{`${pdf.filename}`}</span>
            <div className="flex gap-2">
              <button
                onClick={() => onDownload(pdf.uuid)}
                className="bg-[rgb(var(--color-primary))] text-white dark:text-white rounded p-2 font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Download
              </button>
              <button
                onClick={() => onDelete(pdf.uuid)}
                className="bg-red-700 text-white dark:text-white rounded p-2 font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Delete
              </button>
              <button
                onClick={() => onSelect(pdf.uuid)}
                className="bg-blue-700 text-white dark:text-white rounded p-2 font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Query
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }