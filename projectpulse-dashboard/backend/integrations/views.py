import base64
import requests
import io
import pandas as pd
import logging
from django.core.files.base import ContentFile
from rest_framework import viewsets, permissions
from .models import JiraConnection, CachedTask
from .serializers import JiraConnectionSerializer, CachedTaskSerializer
from datasets.models import Dataset

logger = logging.getLogger(__name__)

class JiraConnectionViewSet(viewsets.ModelViewSet):
    serializer_class = JiraConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return JiraConnection.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        # Fetch from Jira and generate a dataset
        try:
            jira_url = instance.jira_url.rstrip('/')
            auth_string = f"{instance.jira_email}:{instance.api_token}"
            auth_b64 = base64.b64encode(auth_string.encode('utf-8')).decode('utf-8')
            headers = {
                "Authorization": f"Basic {auth_b64}",
                "Accept": "application/json"
            }
            # Search for issues viewable by the user
            search_url = f"{jira_url}/rest/api/2/search?jql=order%20by%20created%20DESC&maxResults=1000"
            res = requests.get(search_url, headers=headers)
            
            if res.status_code == 200:
                data = res.json()
                issues = data.get('issues', [])
                if issues:
                    csv_data = []
                    for issue in issues:
                        fields = issue.get('fields', {})
                        csv_data.append({
                            'Issue Key': issue.get('key'),
                            'Summary': fields.get('summary', ''),
                            'Status': fields.get('status', {}).get('name', 'Unknown') if fields.get('status') else 'Unknown',
                            'Priority': fields.get('priority', {}).get('name', 'Unknown') if fields.get('priority') else 'Unknown',
                            'Issue Type': fields.get('issuetype', {}).get('name', 'Unknown') if fields.get('issuetype') else 'Unknown',
                            'Created': fields.get('created', ''),
                            'Resolved': fields.get('resolutiondate', ''),
                            'Assignee': fields.get('assignee', {}).get('displayName', 'Unassigned') if fields.get('assignee') else 'Unassigned'
                        })
                    
                    df = pd.DataFrame(csv_data)
                    csv_buffer = io.StringIO()
                    df.to_csv(csv_buffer, index=False)
                    
                    # Store as a new Dataset
                    dataset = Dataset(
                        user=self.request.user,
                        file_name=f"Jira_Sync_{instance.jira_url.replace('https://', '').replace('/', '_')}.csv",
                    )
                    file_name = f"jira_sync_{instance.id}.csv"
                    dataset.file.save(file_name, ContentFile(csv_buffer.getvalue().encode('utf-8')))
                    dataset.row_count = len(df)
                    dataset.file_size_bytes = dataset.file.size
                    dataset.save()
                    logger.info(f"Successfully created dataset from Jira with {len(df)} rows.")
            else:
                logger.error(f"Failed to fetch from Jira: {res.status_code} {res.text}")
        except Exception as e:
            logger.error(f"Error syncing Jira: {e}")

class CachedTaskViewSet(viewsets.ModelViewSet):
    serializer_class = CachedTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CachedTask.objects.filter(jira_connection__user=self.request.user)
