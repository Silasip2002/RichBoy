from django.core.management.base import BaseCommand
from django.conf import settings
from transactions.models import Asset
import requests
import time

class Command(BaseCommand):
    help = 'Updates the market price for all stock and crypto assets using Finnhub API'

    def handle(self, *args, **options):
        api_key = settings.FINNHUB_API_KEY
        base_url = settings.FINNHUB_API_URL
        assets = Asset.objects.filter(asset_type__in=['stocks', 'crypto'])
        self.stdout.write(f'Found {assets.count()} assets to update.')

        for asset in assets:
            if not asset.symbol:
                continue

            self.stdout.write(f'Updating {asset.name} ({asset.symbol})...')
            new_price = None
            try:
                if asset.asset_type == 'stocks':
                    url = f'{base_url}/quote?symbol={asset.symbol}&token={api_key}'
                    response = requests.get(url)
                    response.raise_for_status()
                    data = response.json()
                    if 'c' in data and data['c'] != 0:
                        new_price = data['c']
                
                elif asset.asset_type == 'crypto':
                    end_time = int(time.time())
                    start_time = end_time - 86400 * 2 # 2 days to get at least one candle
                    url = f'{base_url}/crypto/candle?symbol={asset.symbol}&resolution=D&from={start_time}&to={end_time}&token={api_key}'
                    response = requests.get(url)
                    response.raise_for_status()
                    data = response.json()
                    if data.get('s') == 'ok' and data.get('c') and data['c']:
                        new_price = data['c'][-1]

                if new_price is not None:
                    asset.market_price = new_price
                    if asset.quantity is not None:
                        asset.market_value = asset.market_price * asset.quantity
                        if asset.cost is not None and asset.cost > 0:
                            asset.change = ((asset.market_value - asset.cost) / asset.cost) * 100
                        else:
                            asset.change = 0
                    asset.save()
                    self.stdout.write(self.style.SUCCESS(f'Successfully updated {asset.name} to {new_price}'))
                else:
                    self.stdout.write(self.style.WARNING(f'Could not find price for {asset.name} ({asset.symbol})'))
            
            except requests.exceptions.RequestException as e:
                self.stdout.write(self.style.ERROR(f'API request failed for {asset.name} ({asset.symbol}): {e}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error updating {asset.name} ({asset.symbol}): {e}'))
