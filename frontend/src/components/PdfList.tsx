
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
            className="flex items-center justify-between border-b border-[#283C50] py-2 dark:border-[#C8D7E6]"
          >
            <span className="truncate">{`${pdf.filename}`}</span>
            <div className="flex gap-2">
            <button
                onClick={() => onSelect(pdf.uuid)}
                type="submit"
                className="bg-blue-700 px-4 py-3 hover:bg-blue-600 text-[#FFFFFF] shadow-lg hover:shadow-blue-900 rounded-full md:rounded-lg font-medium flex items-center transition group cursor-pointer"
              >
                <i className="bx bx-folder-down-arrow mr-2 lg:mr-3 text-lg lg:text-xl group-hover:rotate-12 transition-transform"></i>
                <span className="hidden md:block">Query</span>
              </button>
              <button
                onClick={() => onDownload(pdf.uuid)}
                type="submit"
                className="px-4 py-3 bg-[#00ABE4] hover:bg-[#00ABE4]/90 text-[#FFFFFF] shadow-lg hover:shadow-cyan-600 rounded-full md:rounded-lg font-medium flex items-center transition group cursor-pointer"
              >
                <i className="bx bx-folder-down-arrow mr-2 lg:mr-3 text-lg lg:text-xl group-hover:rotate-12 transition-transform"></i>
                <span className="hidden md:block">Download</span>
              </button>
              <button
                onClick={() => onDelete(pdf.uuid)}
                type="submit"
                className="bg-red-700 px-4 py-3 hover:bg-red-600 text-[#FFFFFF] shadow-lg hover:shadow-red-900 rounded-full md:rounded-lg font-medium flex items-center transition group cursor-pointer"
              >
                <i className="bx bx-folder-down-arrow mr-2 lg:mr-3 text-lg lg:text-xl group-hover:rotate-12 transition-transform"></i>
                <span className="hidden md:block">Delete</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }