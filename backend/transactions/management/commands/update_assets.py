from django.core.management.base import BaseCommand
from transactions.models import Asset
import requests

class Command(BaseCommand):
    help = 'Updates the market price for all stock and crypto assets'

    def handle(self, *args, **options):
        # Filter for assets that are stocks or crypto
        assets = Asset.objects.filter(asset_type__in=['stocks', 'crypto'])
        self.stdout.write(f'Found {assets.count()} assets to update.')

        for asset in assets:
            self.stdout.write(f'Updating {asset.name} ({asset.symbol})...')
            # Your logic to fetch the latest price
            # This is a placeholder - you'll need to implement the actual API call
            # For example, using the Alpha Vantage API as in your views
            try:
                # This is a simplified example. You should handle API keys and errors properly.
                url = f'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={asset.symbol}&apikey=YOUR_API_KEY'
                response = requests.get(url)
                data = response.json()
                
                if 'Global Quote' in data and '05. price' in data['Global Quote']:
                    new_price = data['Global Quote']['05. price']
                    asset.market_price = new_price
                    # Recalculate market_value and change
                    if asset.quantity is not None:
                        asset.market_value = asset.market_price * asset.quantity
                        if asset.cost is not None and asset.cost > 0:
                            asset.change = ((asset.market_value - asset.cost) / asset.cost) * 100
                        else:
                            asset.change = 0
                    asset.save()
                    self.stdout.write(self.style.SUCCESS(f'Successfully updated {asset.name}'))
                else:
                    self.stdout.write(self.style.WARNING(f'Could not find price for {asset.name}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error updating {asset.name}: {e}'))
