from django.contrib import admin
from .models import JiraConnection, CachedTask

class CachedTaskInline(admin.TabularInline):
    model = CachedTask
    extra = 0
    readonly_fields = ('id', 'created_at', 'updated_at')
    fields = ('jira_issue_key', 'title', 'status', 'priority', 'assignee_name', 'created_at', 'updated_at')

class JiraConnectionAdmin(admin.ModelAdmin):
    list_display = ('user', 'jira_url', 'jira_email', 'created_at', 'updated_at')
    list_filter = ('created_at', 'user')
    search_fields = ('user__email', 'jira_url', 'jira_email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [CachedTaskInline]
    
    fieldsets = (
        ('Connection Information', {
            'fields': ('user', 'jira_url', 'jira_email', 'api_token')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )

class CachedTaskAdmin(admin.ModelAdmin):
    list_display = ('jira_issue_key', 'title', 'status', 'priority', 'assignee_name', 'jira_connection', 'created_at', 'updated_at')
    list_filter = ('status', 'priority', 'created_at')
    search_fields = ('jira_issue_key', 'title', 'assignee_name')
    readonly_fields = ('id', 'created_at', 'updated_at')

admin.site.register(JiraConnection, JiraConnectionAdmin)
admin.site.register(CachedTask, CachedTaskAdmin)
