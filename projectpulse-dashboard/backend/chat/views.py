from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatMessageSerializer
from .utils import get_groq_response, validate_message, format_chat_history, build_project_context
import logging

logger = logging.getLogger(__name__)


class ChatAPIView(APIView):
    """
    API endpoint for AI-powered chat
    POST: Send a message and get AI response
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Handle chat message and return AI response
        
        Expected payload:
        {
            "message": "User's message",
            "session_id": "optional-session-uuid"
        }
        """
        try:
            # Get message from request
            message = request.data.get('message', '').strip()
            session_id = request.data.get('session_id')
            dataset_id = request.data.get('dataset_id')
            
            # Validate message
            is_valid, error_msg = validate_message(message)
            if not is_valid:
                return Response(
                    {'error': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create chat session
            if session_id:
                try:
                    session = ChatSession.objects.get(
                        id=session_id,
                        user=request.user
                    )
                except ChatSession.DoesNotExist:
                    return Response(
                        {'error': 'Chat session not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Create new session
                session = ChatSession.objects.create(
                    user=request.user,
                    title=message[:50]  # Use first 50 chars as title
                )
            
            # Save user message
            user_message = ChatMessage.objects.create(
                session=session,
                role='user',
                content=message
            )
            
            # --- 20-message limit ------------------------------------------------
            max_msgs = settings.CHATBOT_CONFIG.get('max_messages_per_session', 20)
            # Count only user messages in this session
            user_msg_count = ChatMessage.objects.filter(
                session=session, role='user'
            ).count()
            if user_msg_count > max_msgs:
                user_message.delete()  # Roll back the message we just saved
                return Response(
                    {
                        'error': 'Chat limit reached',
                        'message': f'This session has reached the {max_msgs}-message limit. Please start a new chat session.'
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            # ---------------------------------------------------------------------
            
            # Get chat history
            max_history = settings.CHATBOT_CONFIG.get('max_history_messages', 50)
            previous_messages = ChatMessage.objects.filter(
                session=session
            ).order_by('-created_at')[:max_history]
            
            # Format history for Groq (reverse to chronological order)
            chat_history = [
                {'role': msg.role, 'content': msg.content}
                for msg in reversed(previous_messages)
            ][:-1]  # Exclude the message we just added
            
            # Get AI response
            dataset_context = build_project_context(request.user, session, dataset_id)
            ai_result = get_groq_response(
                message=message,
                chat_history=chat_history if chat_history else None,
                context=dataset_context
            )
            
            if not ai_result['success']:
                logger.error(f"AI response failed: {ai_result.get('error')}")
                return Response(
                    {
                        'error': 'Failed to get AI response',
                        'message': ai_result['response']
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Save assistant response
            assistant_message = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=ai_result['response']
            )
            
            # Return response
            return Response({
                'success': True,
                'response': ai_result['response'],
                'session_id': str(session.id),
                'message_id': str(assistant_message.id),
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in ChatAPIView: {str(e)}")
            return Response(
                {'error': 'An unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatMessage.objects.filter(session__user=self.request.user)
    
    def perform_create(self, serializer):
        # Ensure the session belongs to the user
        session = serializer.validated_data['session']
        if session.user != self.request.user:
            raise permissions.PermissionDenied("You do not own this chat session.")
        serializer.save()
