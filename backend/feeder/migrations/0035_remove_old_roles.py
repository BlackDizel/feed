# Generated by Django 4.2.1 on 2024-05-18 13:08

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('feeder', '0034_alter_direction_notion_id'),
    ]

    operations = [
        migrations.RunSQL(
            sql='delete from feeder_volunteerrole where id in (\'1\', \'2\', \'3\', \'4\', \'5\', \'6\', \'7\', \'8\', \'9\', \'10\', \'11\', \'12\', \'13\')'
        )
    ]
