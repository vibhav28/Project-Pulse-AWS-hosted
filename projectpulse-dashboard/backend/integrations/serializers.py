from rest_framework import serializers
from .models import JiraConnection, CachedTask

class JiraConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JiraConnection
        fields = ['id', 'user', 'jira_url', 'jira_email', 'api_token', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
        extra_kwargs = {'api_token': {'write_only': True}}

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class CachedTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = CachedTask
        fields = '__all__'
