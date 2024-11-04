from django.db import models

# Create your models here.
class Message(models.Model):
    urls = models.JSONField()
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.content
