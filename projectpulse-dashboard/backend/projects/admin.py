from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'status', 'priority', 'start_date', 'due_date', 'estimated_days']
    list_filter = ['status', 'priority']
    search_fields = ['name', 'description', 'user__email']
