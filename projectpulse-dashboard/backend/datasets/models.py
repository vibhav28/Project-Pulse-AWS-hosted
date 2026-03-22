from django.db import models
import uuid
from users.models import User

class Dataset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='datasets')
    file_name = models.CharField(max_length=255)
    # Using FileField to handle file uploads, storing in 'datasets/' subdirectory
    file = models.FileField(upload_to='datasets/') 
    file_size_bytes = models.BigIntegerField(null=True, blank=True)
    row_count = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name
