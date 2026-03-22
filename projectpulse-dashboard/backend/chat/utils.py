"""
Utility functions for Groq AI chatbot integration
"""
from groq import Groq
from django.conf import settings
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Initialise Groq client
_groq_client: Optional[Groq] = None


def _get_client() -> Groq:
    """Return a cached Groq client, creating it if necessary."""
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=settings.GROQ_API_KEY)
    return _groq_client


def format_chat_history(messages: List[Dict]) -> List[Dict]:
    """
    Convert Django ChatMessage objects to OpenAI-compatible format used by Groq.
    """
    formatted_history = []
    for msg in messages:
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        groq_role = 'assistant' if role == 'assistant' else 'user'
        formatted_history.append({'role': groq_role, 'content': content})
    return formatted_history


def get_groq_response(
    message: str,
    chat_history: Optional[List[Dict]] = None,
    context: Optional[str] = None
) -> Dict[str, any]:
    """
    Get a response from Groq AI.

    Args:
        message: User's message.
        chat_history: Previous messages in the conversation.
        context: Additional context (e.g., dataset preview, project info).

    Returns:
        Dictionary with 'response', 'success', and 'error' keys.
    """
    try:
        if not settings.GROQ_API_KEY:
            logger.error("GROQ_API_KEY not configured")
            return {
                'success': False,
                'response': 'AI service is not configured. Please contact administrator.',
                'error': 'Missing API key'
            }

        client = _get_client()
        model_name = settings.CHATBOT_CONFIG.get('model_name', 'llama-3.3-70b-versatile')

        # Build message list
        messages: List[Dict] = []

        # System prompt — always present
        system_prompt = (
            "You are ProjectPulse AI, a helpful assistant for project management and JIRA data analysis. "
            "When the user asks about their data, use the dataset context provided below. "
            "Be concise, specific, and analytical."
        )
        if context:
            system_prompt += f"\n\n--- DATASET CONTEXT ---\n{context}\n--- END CONTEXT ---"

        messages.append({'role': 'system', 'content': system_prompt})

        # Add previous history
        if chat_history:
            messages.extend(format_chat_history(chat_history))

        # Add current user message
        messages.append({'role': 'user', 'content': message})

        # Debug: log context usage for troubleshooting
        has_context = bool(context)
        context_length = len(context) if context else 0
        logger.info(f"Groq request: has_context={has_context}, context_length={context_length}")

        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            max_tokens=1024,
        )

        response_text = response.choices[0].message.content
        logger.info(f"Successfully generated Groq response for: {message[:50]}...")

        return {
            'success': True,
            'response': response_text,
            'error': None
        }

    except Exception as e:
        logger.error(f"Error getting Groq response: {str(e)}")
        return {
            'success': False,
            'response': 'I apologize, but I encountered an error processing your request. Please try again.',
            'error': str(e)
        }


def build_project_context(user, session=None, dataset_id=None) -> Optional[str]:
    """
    Build a compact context string from the user's uploaded dataset.
    If dataset_id is provided, fetches that specific dataset.
    Otherwise fetches the most recently uploaded one.

    Reads the first 80 rows of the CSV and formats them as a text table so Groq
    can answer questions about the data without exceeding token limits.

    Args:
        user: Django User object.
        session: ChatSession object (optional, unused currently).
        dataset_id: Optional ID of a specific dataset to use.

    Returns:
        Context string for AI system prompt, or None if no dataset exists.
    """
    try:
        # Avoid circular import — import inside function
        from datasets.models import Dataset

        if dataset_id:
            dataset = Dataset.objects.filter(id=dataset_id, user=user).first()
        else:
            # Get the most recent dataset for this user
            dataset = Dataset.objects.filter(user=user).order_by('-created_at').first()
            
        if not dataset:
            return None

        # Read the CSV (try common encodings)
        import pandas as pd
        path = dataset.file.path
        df = None
        for enc in ('utf-8', 'latin-1', 'cp1252'):
            try:
                df = pd.read_csv(path, encoding=enc, low_memory=False)
                break
            except UnicodeDecodeError:
                continue

        if df is None or df.empty:
            return None

        total_rows = len(df)
        columns = list(df.columns)

        # Limit to 80 rows and 15 columns to keep token count manageable
        sample = df.head(80).iloc[:, :15].fillna('')

        context_lines = [
            f"File: {dataset.file_name}",
            f"Total rows: {total_rows}",
            f"Columns: {', '.join(columns[:30])}",  # show up to 30 column names
            "",
            "Sample data (first 80 rows):",
            sample.to_string(index=False, max_rows=80),
        ]

        return "\n".join(context_lines)

    except Exception as e:
        logger.warning(f"Could not build dataset context for user {user}: {e}")
        return None


def validate_message(message: str) -> tuple[bool, Optional[str]]:
    """
    Validate user message before sending to AI.
    """
    if not message or not message.strip():
        return False, "Message cannot be empty"

    max_length = settings.CHATBOT_CONFIG.get('max_message_length', 2000)
    if len(message) > max_length:
        return False, f"Message too long. Maximum {max_length} characters allowed."

    return True, None
