import { useState, useEffect } from "react";
import {
  type DocumentSummary,
  generateSummaryAPI,
  getSummaryAPI,
} from "../api/pdfService";

interface DocumentSummaryProps {
  documentUuid: string;
  documentFilename: string;
}

export default function DocumentSummaryComponent({
  documentUuid,
  documentFilename,
}: DocumentSummaryProps) {
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    checkExistingSummary();
  }, [documentUuid]);

  const checkExistingSummary = async () => {
    try {
      const existingSummary = await getSummaryAPI(documentUuid);
      setSummary(existingSummary);
    } catch (err: any) {
      // No existing summary, that's okay
      if (err.response?.status !== 404) {
        setError("Failed to check for existing summary");
      }
    }
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const newSummary = await generateSummaryAPI(documentUuid);
      setSummary(newSummary);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatSummary = (summaryText: string) => {
    // Split summary into sections for better formatting
    const sections = summaryText
      .split(/\n\s*\d+\.\s*\*\*[^*]+\*\*/)
      .filter((section) => section.trim());

    if (sections.length <= 1) {
      return <div className="whitespace-pre-line">{summaryText}</div>;
    }

    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          if (index === 0) {
            return (
              <div key={index} className="whitespace-pre-line font-medium">
                {section.trim()}
              </div>
            );
          }

          const lines = section.trim().split("\n");
          const title = lines[0]?.replace(/\*\*/g, "") || `Section ${index}`;
          const content = lines.slice(1).join("\n").trim();

          return (
            <div key={index} className="border-l-4 border-primary/30 pl-4">
              <h4 className="font-semibold text-primary mb-2">{title}</h4>
              <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                {content}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPreviewText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <i className="bx bx-file-doc text-primary mr-2"></i>
            Document Summary
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {documentFilename}
          </p>
        </div>

        {!summary && (
          <button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isGenerating ? (
              <>
                <i className="bx bx-loader-dots bx-spin mr-2"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="bx bx-magic-wand mr-2"></i>
                Generate Summary
              </>
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <i className="bx bx-error text-red-500 mr-2"></i>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isGenerating && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <div className="animate-pulse">
            <i className="bx bx-brain text-primary text-4xl mb-4"></i>
            <p className="text-blue-700 dark:text-blue-300 font-medium">
              Analyzing document and generating comprehensive summary...
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              This may take a moment depending on document length
            </p>
          </div>
        </div>
      )}

      {/* Summary content */}
      {summary && !isGenerating && (
        <div className="space-y-4">
          {/* Summary metadata */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="flex items-center">
              <i className="bx bx-time mr-1"></i>
              Generated: {formatDate(summary.summary_generated_at!)}
            </span>
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="text-primary hover:text-primary/80 font-medium flex items-center"
            >
              <i className="bx bx-refresh mr-1"></i>
              Regenerate
            </button>
          </div>

          {/* Summary content */}
          <div className="relative">
            {!isExpanded && summary.summary.length > 400 ? (
              <div>
                <div className="text-gray-700 dark:text-gray-300">
                  {formatSummary(getPreviewText(summary.summary, 400))}
                <div className="absolute bottom-8 left-0 right-0 h-12 z-10 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="mt-4 text-primary hover:text-primary/80 font-medium flex items-center"
                >
                  <i className="bx bx-chevron-down mr-1"></i>
                  Show Full Summary
                </button>
              </div>
            ) : (
              <div>
                <div className="text-gray-700 dark:text-gray-300">
                  {formatSummary(summary.summary)}
                </div>
                {summary.summary.length > 400 && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="mt-4 text-primary hover:text-primary/80 font-medium flex items-center"
                  >
                    <i className="bx bx-chevron-up mr-1"></i>
                    Show Less
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigator.clipboard.writeText(summary.summary)}
              className="text-gray-600 dark:text-gray-400 hover:text-primary flex items-center text-sm"
            >
              <i className="bx bx-copy mr-1"></i>
              Copy Summary
            </button>
            <button
              onClick={() => {
                const blob = new Blob(
                  [
                    `Summary of ${summary.filename}\n\nGenerated: ${formatDate(
                      summary.summary_generated_at!
                    )}\n\n${summary.summary}`,
                  ],
                  { type: "text/plain" }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${summary.filename}_summary.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-primary flex items-center text-sm"
            >
              <i className="bx bx-download mr-1"></i>
              Download Summary
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!summary && !isGenerating && !error && (
        <div className="text-center py-8">
          <i className="bx bx-file-doc text-gray-400 text-6xl mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No summary available for this document yet.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Click "Generate Summary" to create an AI-powered comprehensive
            summary of your document.
          </p>
        </div>
      )}
    </div>
  );
}
