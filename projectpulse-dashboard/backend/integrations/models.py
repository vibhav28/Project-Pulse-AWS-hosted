from django.db import models
import uuid
from users.models import User

class JiraConnection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jira_connections')
    jira_url = models.CharField(max_length=255)
    jira_email = models.CharField(max_length=255)
    api_token = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'jira_url')

    def __str__(self):
        return f"{self.user.email} - {self.jira_url}"

class CachedTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    jira_connection = models.ForeignKey(JiraConnection, on_delete=models.CASCADE, related_name='cached_tasks')
    jira_issue_key = models.CharField(max_length=50)
    title = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    priority = models.CharField(max_length=50, blank=True, null=True)
    assignee_name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('jira_connection', 'jira_issue_key')

    def __str__(self):
        return f"{self.jira_issue_key} - {self.title}"
