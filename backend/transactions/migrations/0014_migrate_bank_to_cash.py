from django.db import migrations

def migrate_bank_to_cash(apps, schema_editor):
    Account = apps.get_model('transactions', 'Account')
    Account.objects.filter(account_type='bank').update(account_type='cash')

class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0013_merge_20250929_0336'),
    ]

    operations = [
        migrations.RunPython(migrate_bank_to_cash),
    ]