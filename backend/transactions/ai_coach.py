import google.generativeai as genai
import os
import logging
from typing import Dict, Any, List
from django.conf import settings
from django.core.cache import cache
from decimal import Decimal
from users.models import UserProfile
from transactions.models import Transaction, Budget
from accounts.models import Account, BalanceSnapshot
from assets.models import Asset, ExchangeRate
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


def convert_currency(amount, from_currency, to_currency):
    """Convert currency using the same logic as accounts.views"""
    if from_currency == to_currency:
        return amount

    # Create cache key for this conversion
    cache_key = f"rate_{from_currency}_{to_currency}"

    # Try to get rate from cache first
    cached_rate = cache.get(cache_key)
    if cached_rate:
        return amount * cached_rate

    try:
        # Try direct conversion from DB
        rate_obj = ExchangeRate.objects.get(base_currency=from_currency, target_currency=to_currency)
        # Cache the rate for 1 hour
        cache.set(cache_key, rate_obj.rate, 3600)
        return amount * rate_obj.rate
    except ExchangeRate.DoesNotExist:
        try:
            # Try inverse conversion from DB
            rate_obj = ExchangeRate.objects.get(base_currency=to_currency, target_currency=from_currency)
            inverse_rate = Decimal(1) / rate_obj.rate
            # Cache the rate for 1 hour
            cache.set(cache_key, inverse_rate, 3600)
            return amount * inverse_rate
        except ExchangeRate.DoesNotExist:
            # Check if we're already fetching this rate to prevent duplicate API calls
            fetch_key = f"fetching_{cache_key}"
            if cache.get(fetch_key):
                logger.warning(f"Already fetching rate for {from_currency}-{to_currency}, skipping")
                return None

            # Mark that we're fetching this rate
            cache.set(fetch_key, True, 60)  # Prevent fetching for 60 seconds

            # If not in DB, fetch from yfinance
            try:
                import yfinance as yf
                ticker_symbol = f"{from_currency}{to_currency}=X"
                ticker = yf.Ticker(ticker_symbol)
                hist = ticker.history(period="1d")
                if not hist.empty:
                    rate = Decimal(hist['Close'].iloc[-1])
                    # Save for next time
                    ExchangeRate.objects.create(base_currency=from_currency, target_currency=to_currency, rate=rate)
                    # Cache the rate for 1 hour
                    cache.set(cache_key, rate, 3600)
                    # Remove the fetching flag
                    cache.delete(fetch_key)
                    return amount * rate
                else:
                    # Try inverse ticker
                    ticker_symbol = f"{to_currency}{from_currency}=X"
                    ticker = yf.Ticker(ticker_symbol)
                    hist = ticker.history(period="1d")
                    if not hist.empty:
                        rate = Decimal(1) / Decimal(hist['Close'].iloc[-1])
                        ExchangeRate.objects.create(base_currency=from_currency, target_currency=to_currency, rate=rate)
                        # Cache the rate for 1 hour
                        cache.set(cache_key, rate, 3600)
                        # Remove the fetching flag
                        cache.delete(fetch_key)
                        return amount * rate
            except Exception as e:
                logger.error(f"yfinance fetch failed for {from_currency}-{to_currency}: {e}")
                # Remove the fetching flag on error
                cache.delete(fetch_key)

    logger.warning(f"Failed to get rate for {from_currency} to {to_currency}")
    # Remove the fetching flag
    cache.delete(fetch_key)
    return None


class AICoachService:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def get_user_financial_data(self, user) -> Dict[str, Any]:
        """Aggregate all financial data for a user"""
        try:
            # Get user profile
            profile = UserProfile.objects.get(user=user)

            # Get accounts
            accounts = Account.objects.filter(user=user)
            total_balance = Decimal('0.0')

            # Calculate total balance with currency conversion (same logic as portfolio summary)
            for account in accounts:
                converted_balance = convert_currency(account.balance, account.currency, profile.preferred_currency)
                if converted_balance is not None:
                    total_balance += converted_balance
                else:
                    logger.warning(f"Could not convert account balance for account {account.id}")

            # Get recent transactions (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_transactions = Transaction.objects.filter(
                account__user=user,
                date__gte=thirty_days_ago
            )

            # Calculate spending by category
            spending_by_category = {}
            for transaction in recent_transactions:
                if transaction.transaction_type == 'expense':
                    category = transaction.category
                    amount = float(transaction.amount)
                    spending_by_category[category] = spending_by_category.get(category, 0) + amount

            # Get assets
            assets = Asset.objects.filter(user=user)
            total_asset_value = Decimal('0.0')

            # Calculate total asset value with currency conversion
            for asset in assets:
                asset_value = Decimal(asset.market_price or asset.price) * Decimal(asset.quantity)
                # Convert asset value to preferred currency (assuming assets are in the same currency as portfolio)
                # This is a simplification - you might need to add currency fields to assets if they vary
                converted_asset_value = convert_currency(asset_value, 'USD', profile.preferred_currency)  # Assuming USD as base
                if converted_asset_value is not None:
                    total_asset_value += converted_asset_value
                else:
                    total_asset_value += asset_value  # Fallback to original value
                    logger.warning(f"Could not convert asset value for asset {asset.id}")

            # Get budgets
            budgets = Budget.objects.filter(user=user)
            budget_performance = []
            for budget in budgets:
                # Calculate spent amount from transactions for this budget category
                start_of_period = datetime.now().replace(day=1) if budget.period == 'Month' else datetime.now().replace(month=1, day=1)
                spent_transactions = Transaction.objects.filter(
                    user=user,
                    category=budget.category,
                    transaction_type='expense',
                    date__gte=start_of_period.date()
                )
                spent = sum(float(t.amount) for t in spent_transactions)
                budgeted = float(budget.budgeted_amount)
                budget_performance.append({
                    'category': budget.category,
                    'budgeted': budgeted,
                    'spent': spent,
                    'remaining': budgeted - spent,
                    'percentage_used': (spent / budgeted * 100) if budgeted > 0 else 0
                })

            # Get portfolio allocation
            portfolio_allocation = {}
            for asset in assets:
                asset_type = asset.asset_type
                value = float(asset.market_price or asset.price) * float(asset.quantity)
                portfolio_allocation[asset_type] = portfolio_allocation.get(asset_type, 0) + value

            return {
                'user_profile': {
                    'age': profile.age,
                    'risk_preference': profile.risk_preference,
                    'display_name': profile.display_name
                },
                'accounts': {
                    'total_balance': total_balance,
                    'account_count': accounts.count(),
                    'account_types': list(accounts.values_list('account_type', flat=True))
                },
                'recent_spending': {
                    'total_spent': sum(spending_by_category.values()),
                    'by_category': spending_by_category,
                    'transaction_count': recent_transactions.count()
                },
                'assets': {
                    'total_value': total_asset_value,
                    'asset_count': assets.count(),
                    'allocation': portfolio_allocation
                },
                'budgets': {
                    'total_budgeted': sum(float(b.budgeted_amount) for b in budgets),
                    'total_spent': sum(bp['spent'] for bp in budget_performance),
                    'performance': budget_performance
                }
            }
        except Exception as e:
            import traceback
            logger.error(f"Error fetching user financial data: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {}

    def generate_financial_advice(self, user_financial_data: Dict[str, Any]) -> str:
        """Generate personalized financial advice using Gemini AI"""
        if not user_financial_data:
            return "Unable to access your financial data at the moment. Please try again later."

        prompt = self._create_financial_analysis_prompt(user_financial_data)

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating AI advice: {e}")
            return "I'm having trouble generating financial advice right now. Please try again later."

    def _create_financial_analysis_prompt(self, data: Dict[str, Any]) -> str:
        """Create a comprehensive prompt for financial analysis"""

        profile = data.get('user_profile', {})
        accounts = data.get('accounts', {})
        spending = data.get('recent_spending', {})
        assets = data.get('assets', {})
        budgets = data.get('budgets', {})

        prompt = f"""
        As a professional financial advisor AI, analyze the following financial situation and provide personalized, actionable advice:

        USER PROFILE:
        - Age: {profile.get('age', 'Not specified')}
        - Risk Preference: {profile.get('risk_preference', 'Not specified')}

        FINANCIAL OVERVIEW:
        - Total Account Balance: ${accounts.get('total_balance', 0):.2f}
        - Number of Accounts: {accounts.get('account_count', 0)}
        - Total Investment Value: ${assets.get('total_value', 0):.2f}

        RECENT SPENDING (Last 30 Days):
        - Total Spent: ${spending.get('total_spent', 0):.2f}
        - Spending by Category: {spending.get('by_category', {})}

        INVESTMENT PORTFOLIO:
        - Total Asset Value: ${assets.get('total_value', 0):.2f}
        - Asset Allocation: {assets.get('allocation', {})}

        BUDGET PERFORMANCE:
        - Total Budgeted: ${budgets.get('total_budgeted', 0):.2f}
        - Total Spent: ${budgets.get('total_spent', 0):.2f}
        - Budget Categories: {budgets.get('performance', [])}

        Please provide:
        1. A brief assessment of their current financial health
        2. 2-3 specific, actionable recommendations for improving their financial situation
        3. One observation about their spending patterns or investment allocation
        4. A positive reinforcement or encouragement

        Keep the response concise (around 150-200 words), friendly, and encouraging. Use bullet points for recommendations.
        Focus on practical steps they can take this month.
        """

        return prompt