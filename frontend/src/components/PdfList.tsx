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

export default function PdfList({
  pdfs,
  onDownload,
  onDelete,
  onSelect,
}: PdfListProps) {
  if (pdfs.length === 0) {
    return (
      <p className="text-muted/80 mb-6">
        No PDFs uploaded yet! Please upload a PDF to get started.
      </p>
    );
  }

  return (
    <ul className="mb-6">
      {pdfs.map((pdf) => (
        <li
          key={pdf.uuid}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-muted-secondary/70 py-2 dark:border-muted-foreground mb-4"
        >
          <span className="truncate">{`${pdf.filename}`}</span>
          <div className="flex gap-2">
            <button
              onClick={() => onSelect(pdf.uuid)}
              type="submit"
              className="bg-blue-700 px-4 py-3 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-900 rounded-lg font-medium flex items-center transition group cursor-pointer"
            >
              Query
            </button>
            <button
              onClick={() => onDownload(pdf.uuid)}
              type="submit"
              className="px-4 py-3 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-secondary rounded-lg font-medium flex items-center transition group cursor-pointer"
            >
              Download
            </button>
            <button
              onClick={() => onDelete(pdf.uuid)}
              type="submit"
              className="bg-red-700 px-4 py-3 hover:bg-red-600 text-white shadow-lg hover:shadow-red-900 rounded-lg font-medium flex items-center transition group cursor-pointer"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
