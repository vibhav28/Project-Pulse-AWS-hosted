from django.db import models
import uuid
from users.models import User
from datetime import date


class Project(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('on_hold', 'On Hold'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)    # actual completion date (set when done)
    due_date = models.DateField(null=True, blank=True)    # deadline
    estimated_days = models.IntegerField(default=0)       # team's estimate
    team_size = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.status})"

    @property
    def actual_days(self):
        """Days from start_date to end_date (or today if in progress)."""
        if not self.start_date:
            return 0
        end = self.end_date if self.end_date else date.today()
        return max(0, (end - self.start_date).days)

    @property
    def is_overdue(self):
        if self.status == 'done':
            return False
        if self.due_date:
            return date.today() > self.due_date
        return False

    @property
    def days_elapsed(self):
        if not self.start_date:
            return 0
        return max(0, (date.today() - self.start_date).days)

    @property
    def progress_pct(self):
        """Rough % completion based on elapsed vs estimated days."""
        if self.estimated_days <= 0:
            return 0
        if self.status == 'done':
            return 100
        pct = int((self.days_elapsed / self.estimated_days) * 100)
        return min(pct, 95)  # cap at 95% until actually done
