# Generated by Django 4.2.1 on 2024-04-07 11:12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('feeder', '0024_rename_staying_arrival'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Participation',
            new_name='Engagement',
        ),
        migrations.RenameModel(
            old_name='ParticipationRole',
            new_name='EngagementRole',
        ),
    ]
