from pypdf import PdfReader


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts text from a PDF file and returns it as a string.

    Args:
        file_path (str): The path to the PDF file.

    Returns:
        str: The extracted text from the PDF file.

    Raises:
        Exception: If there is an error processing the PDF file.
    """
    try:
        reader = PdfReader(pdf_path)
        full_text = []

        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text.append(text)

        return "\n".join(full_text)

    except FileNotFoundError:
        print(f"Error: File not found at {pdf_path}")
        return ""
    except Exception as e:
        print(f"An error occurred while extracting text from PDF: {str(e)}")
        return ""
