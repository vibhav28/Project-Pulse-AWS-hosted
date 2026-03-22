from django.contrib import admin
from .models import Dataset

class DatasetAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'user', 'file_size_bytes', 'row_count', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('file_name', 'user__email')
    readonly_fields = ('id', 'created_at', 'file_size_bytes', 'row_count')
    
    fieldsets = (
        ('File Information', {
            'fields': ('file_name', 'file', 'file_size_bytes', 'row_count')
        }),
        ('User & Metadata', {
            'fields': ('user', 'id', 'created_at')
        }),
    )

admin.site.register(Dataset, DatasetAdmin)