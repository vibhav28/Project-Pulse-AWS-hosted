"""
URL configuration for projectpulse project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from integrations.views import JiraConnectionViewSet, CachedTaskViewSet
from datasets.views import DatasetViewSet
from chat.views import ChatSessionViewSet, ChatMessageViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'jira-connections', JiraConnectionViewSet, basename='jiraconnection')
router.register(r'cached-tasks', CachedTaskViewSet, basename='cachedtask')
router.register(r'datasets', DatasetViewSet, basename='dataset')
router.register(r'chat-sessions', ChatSessionViewSet, basename='chatsession')
router.register(r'chat-messages', ChatMessageViewSet, basename='chatmessage')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('users.urls')),  # Authentication endpoints
    path('api/chat/', include('chat.urls')),   # AI-powered chat endpoint
    path('api/projects/', include('projects.urls')),  # Projects CRUD + stats
]
