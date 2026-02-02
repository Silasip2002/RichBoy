from django.core.management.base import BaseCommand
from transactions.models import Asset
import yfinance as yf

class Command(BaseCommand):
    help = 'Updates the market price for all stock and crypto assets using yfinance'

    def handle(self, *args, **options):
        assets = Asset.objects.filter(asset_type__in=['stocks', 'crypto'])
        self.stdout.write(f'Found {assets.count()} assets to update.')

        for asset in assets:
            if not asset.symbol:
                continue

            self.stdout.write(f'Updating {asset.name} ({asset.symbol})...')
            new_price = None
            try:
                ticker = yf.Ticker(asset.symbol)
                # Use 'regularMarketPrice' for stocks, and it often works for crypto too
                todays_data = ticker.history(period='1d')
                if not todays_data.empty:
                    new_price = todays_data['Close'][-1]

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
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error updating {asset.name} ({asset.symbol}): {e}'))
