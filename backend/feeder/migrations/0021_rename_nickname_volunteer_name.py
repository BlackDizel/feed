# Generated by Django 4.2.1 on 2024-04-07 10:17

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('feeder', '0020_rename_name_volunteer_first_name'),
    ]

    operations = [
        migrations.RenameField(
            model_name='volunteer',
            old_name='nickname',
            new_name='name',
        ),
    ]
