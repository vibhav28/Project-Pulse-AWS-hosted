from rest_framework import serializers
from .models import Project
from datetime import date


class ProjectSerializer(serializers.ModelSerializer):
    actual_days = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    days_elapsed = serializers.ReadOnlyField()
    progress_pct = serializers.ReadOnlyField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'priority',
            'start_date', 'end_date', 'due_date',
            'estimated_days', 'team_size',
            'actual_days', 'is_overdue', 'days_elapsed', 'progress_pct',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
