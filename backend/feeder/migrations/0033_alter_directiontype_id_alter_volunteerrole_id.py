# Generated by Django 4.2.1 on 2024-05-12 14:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feeder', '0032_status_arrival_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='directiontype',
            name='id',
            field=models.CharField(max_length=20, primary_key=True, serialize=False, verbose_name='Идентификатор'),
        ),
        migrations.AlterField(
            model_name='volunteerrole',
            name='id',
            field=models.CharField(max_length=20, primary_key=True, serialize=False, verbose_name='Идентификатор'),
        ),
    ]