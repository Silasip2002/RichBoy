from .models import ExchangeRate
from decimal import Decimal

def convert_currency(amount, from_currency, to_currency):
    if from_currency == to_currency:
        return amount

    try:
        # Direct conversion rate
        rate = ExchangeRate.objects.get(base_currency=from_currency, target_currency=to_currency).rate
        return amount * rate
    except ExchangeRate.DoesNotExist:
        # Indirect conversion through USD
        try:
            from_to_usd_rate = ExchangeRate.objects.get(base_currency=from_currency, target_currency='USD').rate
            usd_to_to_rate = ExchangeRate.objects.get(base_currency='USD', target_currency=to_currency).rate
            amount_in_usd = amount * from_to_usd_rate
            return amount_in_usd * usd_to_to_rate
        except ExchangeRate.DoesNotExist:
            # Or maybe the other way around
            try:
                usd_to_from_rate = ExchangeRate.objects.get(base_currency='USD', target_currency=from_currency).rate
                to_to_usd_rate = ExchangeRate.objects.get(base_currency=to_currency, target_currency='USD').rate
                amount_in_usd = amount / usd_to_from_rate
                return amount_in_usd / to_to_usd_rate
            except ExchangeRate.DoesNotExist:
                return None # Or raise an exception
