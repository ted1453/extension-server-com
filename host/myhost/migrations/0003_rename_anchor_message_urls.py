# Generated by Django 4.2.16 on 2024-09-23 19:46

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('myhost', '0002_message_anchor'),
    ]

    operations = [
        migrations.RenameField(
            model_name='message',
            old_name='anchor',
            new_name='urls',
        ),
    ]