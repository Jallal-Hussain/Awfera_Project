type PDF = {
  uuid: string;
  filename: string;
};

type PdfListProps = {
  pdfs: PDF[];
  onDownload: (uuid: string) => void;
  onDelete: (uuid: string) => void;
  onSelect?: (uuid: string) => void;
  onChat?: (uuid: string) => void;
  onSummarize?: (uuid: string) => void;
};

export default function PdfList({
  pdfs,
  onDownload,
  onDelete,
  // onSelect,
  onChat,
  onSummarize,
}: PdfListProps) {
  if (pdfs.length === 0) {
    return (
      <div className="text-center py-8">
        <i className="bx bx-file-doc text-gray-400 text-6xl mb-4"></i>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          No PDFs uploaded yet!
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Upload a PDF document to get started with AI-powered analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pdfs.map((pdf) => (
        <div
          key={pdf.uuid}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border border-muted dark:border-muted-secondary rounded-lg hover:bg-muted/20 dark:hover:bg-muted-secondary/20 transition-colors"
        >
          {/* Document Info */}
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 bg-muted dark:bg-muted/20 rounded-lg flex items-center justify-center mr-4">
              <i className="bx bx-folder text-muted-forground dark:text-muted-secondary-forground text-xl"></i>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-muted-secondary dark:text-white truncate">
                {pdf.filename}
              </h4>
              <p className="text-sm text-muted-secondary/50 dark:text-muted/50 truncate">
                UUID: {pdf.uuid}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 lg:flex-nowrap">
            {/* New Chat and Summary buttons */}
            {onChat && (
              <button
                onClick={() => onChat(pdf.uuid)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center transition-colors text-sm"
                title="Start a conversation with this document"
              >
                <i className="bx bx-chat mr-1"></i>
                Chat
              </button>
            )}

            {onSummarize && (
              <button
                onClick={() => onSummarize(pdf.uuid)}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center transition-colors text-sm"
                title="Generate AI summary of this document"
              >
                <i className="bx bx-file-doc mr-1"></i>
                Summary
              </button>
            )}

            {/* Legacy Query button (for backward compatibility) */}
            {/* <button
              onClick={() => onSelect(pdf.uuid)}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center transition-colors text-sm"
              title="Quick query (legacy mode)"
            >
              <i className="bx bx-search mr-1"></i>
              Query
            </button> */}

            {/* Download button */}
            <button
              onClick={() => onDownload(pdf.uuid)}
              className="px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium flex items-center transition-colors text-sm"
              title="Download PDF file"
            >
              <i className="bx bx-download mr-1"></i>
              Download
            </button>

            {/* Delete button */}
            <button
              onClick={() => {
                if (
                  confirm(`Are you sure you want to delete "${pdf.filename}"?`)
                ) {
                  onDelete(pdf.uuid);
                }
              }}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center transition-colors text-sm"
              title="Delete this document"
            >
              <i className="bx bx-trash mr-1"></i>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
