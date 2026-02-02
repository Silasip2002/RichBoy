from django.core.management.base import BaseCommand
from transactions.models import ExchangeRate, CURRENCY_CHOICES
import yfinance as yf
from decimal import Decimal

class Command(BaseCommand):
    help = 'Fetches and updates currency exchange rates from Yahoo Finance.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting currency exchange rate update...'))

        # Define a base currency for all conversions. USD is a common choice.
        base_currency = 'USD'
        # Get all other currencies from CURRENCY_CHOICES, excluding the base
        target_currencies = [c[0] for c in CURRENCY_CHOICES if c[0] != base_currency]

        # Add the base currency itself with a rate of 1 (USD to USD)
        ExchangeRate.objects.update_or_create(
            base_currency=base_currency,
            target_currency=base_currency,
            defaults={'rate': Decimal('1.0')}
        )
        self.stdout.write(self.style.SUCCESS(f'Set {base_currency} to {base_currency} rate to 1.0'))

        for target_currency in target_currencies:
            # Construct the Yahoo Finance ticker symbol
            # e.g., EURUSD=X means 1 EUR = X USD.
            ticker_symbol = f"{target_currency}{base_currency}=X"
            self.stdout.write(f'Fetching rate for {ticker_symbol}...')

            try:
                ticker = yf.Ticker(ticker_symbol)
                rate_value = ticker.info.get('regularMarketPrice')

                if rate_value:
                    # Store the rate as 1 unit of target_currency = rate_value units of base_currency
                    # e.g., 1 EUR = 1.08 USD (if EURUSD=X rate_value is 1.08)
                    ExchangeRate.objects.update_or_create(
                        base_currency=target_currency, # e.g., EUR
                        target_currency=base_currency, # e.g., USD
                        defaults={'rate': Decimal(str(rate_value))}
                    )
                    self.stdout.write(self.style.SUCCESS(f'Successfully updated 1 {target_currency} = {rate_value} {base_currency}'))

                    # Also store the inverse rate (1 USD = 1/1.08 EUR)
                    inverse_rate = Decimal('1.0') / Decimal(str(rate_value))
                    ExchangeRate.objects.update_or_create(
                        base_currency=base_currency, # e.g., USD
                        target_currency=target_currency, # e.g., EUR
                        defaults={'rate': inverse_rate}
                    )
                    self.stdout.write(self.style.SUCCESS(f'Successfully updated 1 {base_currency} = {inverse_rate:.6f} {target_currency}'))

                else:
                    self.stdout.write(self.style.WARNING(f'Could not fetch rate for {ticker_symbol}. Skipping.'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error fetching rate for {ticker_symbol}: {e}'))

        self.stdout.write(self.style.SUCCESS('Currency exchange rate update finished.'))