import os
from google import genai
from google.genai import types
from dotenv import load_dotenv, find_dotenv

# Load environment variables from .env file
load_dotenv(find_dotenv())


def get_llm_response(context: str, query: str) -> str:
    """
    Send a context and query to the Google Gemini and return the response.

    Args:
        context (str): The context to provide to the LLM.
        query (str): The query to ask the LLM.

    Returns:
        str: The response from the LLM.

    Raises:
        Exception: If there is an error communicating with the LLM.
        ValueError: If the GEMINI_API_KEY is not set or invalid in the .env file.
    """

    # Set the API key for the Gemini API
    API_KEY = os.environ.get("GEMINI_API_KEY")

    # Check if the API key is set
    if not API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is not set in the .env file.",
            "Set it to your Gemini API key.",
        )

    # Initialize the Gemini client
    client = genai.Client(api_key=API_KEY)

    model = "gemini-2.0-flash"
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=query)],
        ),
    ]

    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
        system_instruction=[
            types.Part.from_text(
                text=(
                    "You are a helpful assistant that answers questions based on the provided context delimited with triple backticks. \n\n"
                    "You will be given a context and a question. Your task is to generate a response that is relevant to the query based on the context provided. "
                    "If the context is insufficient to answer the question, you will respond with 'I do not have enough information to answer this question'. \n\n"
                    "If the context is empty, you will respond with 'I do not have any information to answer this question'. \n\n"
                    "You should always respond in a friendly, helpful, and polite tone. \n\n"
                    "Your response should be in the following format: \n\n"
                    f"Context:\n```{context}``` \n\n"
                )
            ),
        ],
    )

    # Stream and accumulate the response
    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        response_text += chunk.text

    return response_text
