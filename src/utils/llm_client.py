import os
from google import genai
from google.genai import types
from dotenv import load_dotenv, find_dotenv
from typing import List, Dict

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

def get_chat_response(context: str, conversation_history: List[Dict[str, str]], new_query: str) -> str:
    """
    Get a chat response considering conversation history.
    
    Args:
        context (str): The document context
        conversation_history (List[Dict]): Previous messages [{"role": "user/assistant", "content": "..."}]
        new_query (str): The new user query
    
    Returns:
        str: The LLM response
    """
    API_KEY = os.environ.get("GEMINI_API_KEY")
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in the .env file.")

    client = genai.Client(api_key=API_KEY)
    model = "gemini-2.0-flash"
    
    # Build conversation contents
    contents = []
    
    # Add conversation history
    for message in conversation_history:
        role = "user" if message["role"] == "user" else "model"
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=message["content"])],
            )
        )
    
    # Add new user query
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=new_query)],
        )
    )

    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
        system_instruction=[
            types.Part.from_text(
                text=(
                    "You are a helpful assistant engaged in a conversation about a document. "
                    "The document context is provided below delimited with triple backticks. "
                    "You should maintain conversational flow and refer back to previous parts of the conversation when relevant. "
                    "Answer questions based on the document context and conversation history. "
                    "If you need to clarify something from earlier in the conversation, feel free to reference it. "
                    "Keep your responses conversational and engaging while being accurate to the document content. \n\n"
                    "If the context is insufficient to answer the question, you will respond with 'I do not have enough information from the document to answer this question'. \n\n"
                    "Document Context:\n```{context}``` \n\n".format(context=context)
                )
            ),
        ],
    )

    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        response_text += chunk.text

    return response_text


def generate_document_summary(context: str, filename: str) -> str:
    """
    Generate a comprehensive summary of the document.
    
    Args:
        context (str): The full document text
        filename (str): The document filename
    
    Returns:
        str: The generated summary
    """
    API_KEY = os.environ.get("GEMINI_API_KEY")
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in the .env file.")

    client = genai.Client(api_key=API_KEY)
    model = "gemini-2.0-flash"
    
    summary_prompt = f"""Please provide a comprehensive summary of the document "{filename}". 
    Your summary should include:
    
    1. **Main Topic/Subject**: What is this document primarily about?
    2. **Key Points**: The most important information, findings, or arguments
    3. **Structure**: How is the document organized? (sections, chapters, etc.)
    4. **Important Details**: Specific data, dates, names, or figures that are crucial
    5. **Conclusions/Outcomes**: What conclusions are drawn or what outcomes are presented?
    
    Please make the summary detailed enough to give someone a clear understanding of the document's content without reading the full text, but concise enough to be easily digestible.
    
    Format your response in a clear, structured manner using the sections above."""
    
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=summary_prompt)],
        ),
    ]

    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
        system_instruction=[
            types.Part.from_text(
                text=(
                    "You are an expert document analyst. Your task is to create comprehensive, well-structured summaries "
                    "of documents. You should analyze the provided document context and create a summary that captures "
                    "the essence, key points, and important details of the document. "
                    "Be thorough but concise, and organize your summary in a clear, readable format. \n\n"
                    "Document to summarize:\n```{context}```".format(context=context)
                )
            ),
        ],
    )

    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        response_text += chunk.text

    return response_text


def generate_conversation_title(first_query: str) -> str:
    """
    Generate a short, descriptive title for a conversation based on the first query.
    
    Args:
        first_query (str): The first user query in the conversation
    
    Returns:
        str: A short title for the conversation
    """
    API_KEY = os.environ.get("GEMINI_API_KEY")
    if not API_KEY:
        return f"Chat about: {first_query[:50]}..." if len(first_query) > 50 else f"Chat about: {first_query}"

    try:
        client = genai.Client(api_key=API_KEY)
        model = "gemini-2.0-flash"
        
        title_prompt = f"Generate a short, descriptive title (maximum 8 words) for a conversation that starts with this question: '{first_query}'. Return only the title, nothing else."
        
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=title_prompt)],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            response_mime_type="text/plain",
        )

        response_text = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            response_text += chunk.text

        # Clean up the response and limit length
        title = response_text.strip().replace('"', '').replace("'", "")
        return title[:100] if len(title) > 100 else title
        
    except Exception:
        # Fallback to simple title generation
        return f"Chat about: {first_query[:50]}..." if len(first_query) > 50 else f"Chat about: {first_query}"