from rest_framework import serializers
from .models import Dataset

class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['id', 'user', 'file_name', 'file', 'file_size_bytes', 'row_count', 'created_at']
        read_only_fields = ['id', 'created_at', 'user', 'file_size_bytes', 'row_count']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        # Here we might want to process the file to get size and row count
        instance = super().create(validated_data)
        if instance.file:
             instance.file_size_bytes = instance.file.size
             # Row count logic would be added here
             instance.save()
        return instance
