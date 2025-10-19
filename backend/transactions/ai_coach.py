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
        logger.info(f"GEMINI_API_KEY loaded: {'Yes' if self.api_key else 'No'}")
        if not self.api_key:
            logger.error("GEMINI_API_KEY environment variable is not set")
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        logger.info(f"API Key length: {len(self.api_key)}")
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        self.chat_model = genai.GenerativeModel('gemini-2.0-flash')
        logger.info("AI Coach Service initialized successfully")

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

    def get_user_goals_data(self, user) -> Dict[str, Any]:
        """Get user's goals data for chat context"""
        try:
            # This would be implemented when goals are added to the database
            # For now, return a placeholder structure
            return {
                'active_goals': [],
                'completed_goals': [],
                'total_saved': 0,
                'total_target': 0
            }
        except Exception as e:
            logger.error(f"Error fetching user goals data: {e}")
            return {'active_goals': [], 'completed_goals': [], 'total_saved': 0, 'total_target': 0}

    def generate_goal_chat_response(self, user, message: str, conversation_history: List[Dict] = None) -> str:
        """Generate a response for goal-related chat messages"""
        try:
            # Get user's financial and goals data
            financial_data = self.get_user_financial_data(user)
            goals_data = self.get_user_goals_data(user)

            # Create conversation context
            context = self._create_goal_chat_context(financial_data, goals_data, conversation_history)

            # Create prompt with context
            prompt = self._create_goal_chat_prompt(message, context)

            # Generate response
            logger.info("Generating AI response...")
            response = self.chat_model.generate_content(prompt)
            logger.info("AI response generated successfully")
            return response.text

        except Exception as e:
            logger.error(f"Error generating goal chat response: {e}")
            logger.error(f"Exception type: {type(e).__name__}")
            # Check for specific API key errors
            if "API key" in str(e).lower() or "permission" in str(e).lower():
                logger.error("This appears to be an API key issue")
                return "I'm having trouble accessing my AI capabilities. Please check the API configuration and try again."
            return "I'm having trouble responding right now. Please try again later."

    def _create_goal_chat_context(self, financial_data: Dict, goals_data: Dict, conversation_history: List[Dict] = None) -> str:
        """Create context string for goal-related conversations"""
        profile = financial_data.get('user_profile', {})
        accounts = financial_data.get('accounts', {})
        spending = financial_data.get('recent_spending', {})
        assets = financial_data.get('assets', {})

        total_balance = float(accounts.get('total_balance', 0))
        available_for_investing = total_balance * 0.8  # Assume 20% for emergency fund
        recent_spending = float(spending.get('total_spent', 0))
        total_assets = float(assets.get('total_value', 0))

        context = f"""
        DETAILED FINANCIAL PROFILE:
        - Risk Preference: {profile.get('risk_preference', 'moderate')}
        - Total Balance: ${total_balance:.2f}
        - Available for Investing: ${available_for_investing:.2f}
        - Recent Monthly Spending: ${recent_spending:.2f}
        - Total Assets: ${total_assets:.2f}

        INVESTMENT RECOMMENDATIONS BASED ON PROFILE:
        - Risk Level: {profile.get('risk_preference', 'moderate')}
        - Suggested Emergency Fund: ${total_balance * 0.2:.2f} (20% of total balance)
        - Monthly Savings Capacity: ${max(0, (total_balance * 0.1) / 12):.2f} (10% of balance monthly)
        - Investment Timeline: Medium-term (3-5 years) recommended for balanced growth

        SPECIFIC PRODUCT ALLOCATION SUGGESTIONS:
        - High-Yield Savings (Ally Bank 4.5% APY): ${available_for_investing * 0.3:.2f}
        - S&P 500 Index Fund (VOO/FXAIAX): ${available_for_investing * 0.5:.2f}
        - Bonds/Conservative Investments: ${available_for_investing * 0.2:.2f}

        GOALS PROGRESS:
        - Active Goals: {len(goals_data.get('active_goals', []))}
        - Completed Goals: {len(goals_data.get('completed_goals', []))}
        - Total Saved Toward Goals: ${float(goals_data.get('total_saved', 0)):.2f}
        - Total Goal Targets: ${float(goals_data.get('total_target', 0)):.2f}
        - Completion Rate: {(float(goals_data.get('total_saved', 0)) / max(float(goals_data.get('total_target', 1)), 1) * 100):.1f}%
        """

        # Add conversation history if provided
        if conversation_history:
            context += "\n\nRECENT CONVERSATION:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                sender = "User" if msg['sender'] == 'user' else "AI Assistant"
                context += f"{sender}: {msg['message']}\n"

        return context

    def _extract_financial_advice_from_conversation(self, conversation_history: List[Dict]) -> str:
        """Extract all specific financial advice and recommendations from the conversation"""
        if not conversation_history:
            return "No conversation history available."

        advice_analysis = "FINANCIAL ADVICE EXTRACTED FROM CONVERSATION:\n\n"

        # Extract specific advice from AI responses
        ai_messages = [msg for msg in conversation_history if msg.get('sender') == 'ai']
        user_messages = [msg for msg in conversation_history if msg.get('sender') == 'user']

        # Analyze AI messages for specific financial advice
        financial_keywords = [
            'Ally Bank', 'Vanguard', 'Fidelity', 'Charles Schwab', 'ETF', 'index fund',
            'APY', 'interest rate', '401k', 'IRA', 'Roth IRA', 'CD', 'money market',
            'stock', 'bond', 'mutual fund', 'VOO', 'FXAIAX', 'VTSAX', 'VBTLX',
            'high-yield savings', 'checking account', 'automatic transfer',
            'credit card', 'debt consolidation', 'refinance', 'mortgage',
            'allocation', 'diversification', 'risk tolerance', 'emergency fund'
        ]

        # Extract specific financial products, amounts, and advice
        advice_analysis += "SPECIFIC FINANCIAL PRODUCTS MENTIONED:\n"
        for msg in ai_messages:
            message = msg.get('message', '')
            for keyword in financial_keywords:
                if keyword.lower() in message.lower():
                    # Extract the sentence containing the keyword
                    sentences = message.split('.')
                    for sentence in sentences:
                        if keyword.lower() in sentence.lower():
                            advice_analysis += f"- {sentence.strip()}\n"

        advice_analysis += "\nDETAILED FINANCIAL BREAKDOWN WITH AMOUNTS AND PERCENTAGES:\n"
        import re
        financial_data_points = []

        for msg in ai_messages:
            message = msg.get('message', '')

            # Extract comprehensive financial data
            # Dollar amounts with context
            dollar_amounts = re.findall(r'\$[\d,]+\.?\d*', message)
            for amount in dollar_amounts:
                # Extract full context around the amount
                context_start = max(0, message.find(amount) - 50)
                context_end = min(len(message), message.find(amount) + len(amount) + 50)
                full_context = message[context_start:context_end]
                advice_analysis += f"- Amount: {amount} - {full_context.strip()}\n"
                financial_data_points.append(('amount', amount, full_context))

            # Percentages with calculations
            percentages = re.findall(r'\d+\.?\d*%|\d+ percent', message)
            for percent in percentages:
                context_start = max(0, message.find(percent) - 50)
                context_end = min(len(message), message.find(percent) + len(percent) + 50)
                full_context = message[context_start:context_end]
                advice_analysis += f"- Percentage: {percent} - {full_context.strip()}\n"
                financial_data_points.append(('percentage', percent, full_context))

            # Allocation recommendations
            allocations = re.findall(r'\d+%.*?\$[\d,]+|\$[\d,]+.*?\d+%|allocate.*?\d+%|\d+%.*?allocation', message, re.IGNORECASE)
            for allocation in allocations:
                advice_analysis += f"- Allocation: {allocation.strip()}\n"
                financial_data_points.append(('allocation', allocation, message))

            # Timeline information
            timelines = re.findall(r'\d+ months?|\d+ weeks?|\d+ years?|in \d+ days?|by \d{4}|within \d+ (days|weeks|months)', message, re.IGNORECASE)
            for timeline in timelines:
                advice_analysis += f"- Timeline: {timeline.strip()}\n"
                financial_data_points.append(('timeline', timeline, message))

        advice_analysis += "\nCOMPLETE FINANCIAL PLAN SUMMARY:\n"
        advice_analysis += f"- Total financial data points extracted: {len(financial_data_points)}\n"
        advice_analysis += f"- Advice breakdown: {len([p for p in financial_data_points if p[0] == 'amount'])} amounts, {len([p for p in financial_data_points if p[0] == 'percentage'])} percentages\n"

        # Create comprehensive summary of all advice
        advice_analysis += "\nSTEP-BY-STEP ACTION PLAN:\n"
        step_counter = 1
        for msg in ai_messages:
            message = msg.get('message', '')
            # Look for action verbs and instructions
            action_indicators = ['open', 'set up', 'transfer', 'deposit', 'invest', 'call', 'download', 'visit', 'purchase', 'create']
            for indicator in action_indicators:
                if indicator in message.lower():
                    # Extract the actionable sentence
                    sentences = message.split('.')
                    for sentence in sentences:
                        if indicator in sentence.lower():
                            advice_analysis += f"Step {step_counter}: {sentence.strip()}\n"
                            step_counter += 1
                            break

        advice_analysis += "\nWEBSITES, APPS, AND CONTACT INFO:\n"
        for msg in ai_messages:
            message = msg.get('message', '')
            # Find websites
            websites = re.findall(r'[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', message)
            for website in websites:
                advice_analysis += f"- Website: {website}\n"

            # Find phone numbers
            phone_numbers = re.findall(r'1-800[\d-]+|\d{3}-\d{3}-\d{4}', message)
            for phone in phone_numbers:
                advice_analysis += f"- Phone: {phone}\n"

            # Find app names
            app_names = re.findall(r'[A-Z][a-z]+ app|[A-Z][a-z]+ mobile app', message)
            for app in app_names:
                advice_analysis += f"- App: {app}\n"

        advice_analysis += "\nUSER'S FINANCIAL GOALS AND EXPENSES:\n"
        for msg in user_messages:
            message = msg.get('message', '')
            # Look for goal indicators
            goal_indicators = ['save', 'buy', 'invest', 'pay off', 'retire', 'down payment', 'car', 'house', 'vacation', 'emergency']
            for indicator in goal_indicators:
                if indicator in message.lower():
                    advice_analysis += f"- User goal: {message}\n"
                    break

        # Extract expense information mentioned in conversation
        advice_analysis += "\nEXPENSE INFORMATION FROM CONVERSATION:\n"
        expense_keywords = ['rent', 'mortgage', 'utilities', 'groceries', 'insurance', 'car payment', 'student loan', 'credit card', 'phone bill', 'internet', 'gas', 'food']
        for msg in ai_messages:
            message = msg.get('message', '')
            for keyword in expense_keywords:
                if keyword in message.lower():
                    # Extract expense context
                    context_start = max(0, message.find(keyword) - 30)
                    context_end = min(len(message), message.find(keyword) + 100)
                    full_context = message[context_start:context_end]
                    advice_analysis += f"- Expense: {full_context.strip()}\n"

        # Extract living expense calculations
        advice_analysis += "\nLIVING EXPENSE CALCULATIONS:\n"
        for msg in ai_messages:
            message = msg.get('message', '')
            # Look for expense calculations
            expense_calcs = re.findall(r'\$[\d,]+.*?(?:month|rent|mortgage|utilities|groceries|bills|expenses)', message, re.IGNORECASE)
            for calc in expense_calcs:
                advice_analysis += f"- Monthly expense calculation: {calc.strip()}\n"

        # Extract coverage periods mentioned
        coverage_periods = re.findall(r'\d+\s*(?:months?|weeks?|years?).*?(?:cover|last|sustain)', message, re.IGNORECASE)
        for period in coverage_periods:
            advice_analysis += f"- Coverage period: {period.strip()}\n"

        # Extract emergency fund calculations
        emergency_fund_calcs = re.findall(r'emergency.*?\$[\d,]+|\$[\d,]+.*?emergency', message, re.IGNORECASE)
        for calc in emergency_fund_calcs:
            advice_analysis += f"- Emergency fund: {calc.strip()}\n"

        return advice_analysis

    def extract_goal_from_conversation(self, user, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """Extract goal information from conversation and create structured goal data"""
        try:
            # Get user's financial data for context
            financial_data = self.get_user_financial_data(user)
            context = self._create_goal_chat_context(financial_data, self.get_user_goals_data(user), conversation_history)

            # Extract all the detailed advice given throughout the conversation
            conversation_advice = self._extract_financial_advice_from_conversation(conversation_history)

            # Create prompt for goal extraction with conversation advice
            prompt = f"""
            You are a financial AI assistant. Based on the conversation, determine if the user has described a specific financial goal they want to create.

            {context}

            DETAILED CONVERSATION ANALYSIS:
            {conversation_advice}

            TASK: Create a comprehensive goal with todo items that incorporate ALL the specific advice given throughout the conversation.
            Extract every specific recommendation, product mention, dollar amount, and step-by-step instruction provided in the chat.

            Analyze the conversation and determine:
            1. Has the user described a specific, actionable financial goal?
            2. If yes, extract and incorporate ALL financial advice from the conversation:
               - Goal title (specific and descriptive)
               - Description (include all financial strategy advice from chat)
               - Category (savings, debt_repayment, or investment)
               - Target amount (use numbers mentioned or calculate from user's situation)
               - Current amount (if mentioned, 0 if not)
               - Deadline (if mentioned, calculate reasonable timeline)
               - Create 4-6 comprehensive todo items using ALL advice from conversation

            CRITICAL: Extract and incorporate EVERY specific detail from the conversation including:
            - All financial products mentioned (banks, ETFs, specific funds)
            - Exact dollar amounts and percentages discussed
            - Website names, app names, phone numbers
            - Step-by-step instructions provided
            - Timeline suggestions
            - Investment allocations recommended
            - Account types suggested

            Create COMPREHENSIVE todo items that capture the complete financial plan discussed in the conversation.
            Each todo item should be a complete actionable task incorporating multiple pieces of advice.

            If the user hasn't provided enough information for a specific goal, respond with "INSUFFICIENT_INFO".
            If the user has described a goal, respond with valid JSON in this format:
            {{
                "should_create_goal": true,
                "goal_data": {{
                    "title": "Specific goal title based on conversation",
                    "description": "Complete financial strategy incorporating ALL advice from the conversation",
                    "category": "savings|debt_repayment|investment",
                    "target_amount": exact_amount_from_conversation_or_calculated,
                    "current_amount": amount_mentioned_or_0,
                    "deadline": "2025-12-31" or calculated_timeline,
                    "milestones": [
                        {{
                            "title": "Comprehensive action step",
                            "description": "Complete step incorporating multiple conversation details. Example: 'Step 1: Open Ally Bank High-Yield Savings account (4.5% APY) at ally.com using the $2,000 we discussed. Step 2: Transfer from your current checking account (Bank of America) and set up automatic $500/month transfer on payday (the 1st and 15th). Step 3: Download Ally Bank app to monitor progress. Step 4: Email confirmation to ally@ally.com when completed.'",
                            "target_date": "specific_date_based_on_timeline"
                        }}
                    ]
                }}
            }}

            MILESTONE REQUIREMENTS - COMPREHENSIVE TODO BREAKDOWN FROM CHAT:
- MUST extract and incorporate EVERY piece of financial advice given in the chat conversation
- Each todo item must include ALL specific details discussed: exact amounts, percentages, products, websites
- Create 5-8 detailed todo items that capture the COMPLETE financial plan from the conversation
- Each item should be actionable within 1-2 weeks with clear completion criteria from chat
- Include EVERY specific product, amount, timeline, website, app, and instruction mentioned in chat
- Preserve ALL numerical details: exact amounts, percentages, interest rates, timelines discussed
- Each todo should build on previous ones using the complete conversation flow
- MUST include CALCULATION section showing the math based on chat discussion
- MUST include ACCORDION_DETAILS with comprehensive breakdown from all chat information

            FORMAT FOR COMPREHENSIVE TODOS:
- Each milestone must include: WHAT to do, HOW MUCH, WHERE to do it, WHEN to do it, and EXACT STEPS
- Include detailed CALCULATIONS: "6 months expenses ($4,000 × 6 = $24,000)" showing the math
- Include LIVING EXPENSES breakdown: rent, utilities, groceries, transportation, insurance
- Include COVERAGE analysis: "This fund covers 6 months of unemployment, medical emergencies"
- Include GROWTH potential: "At 4.5% APY, $24,000 becomes $25,080 in 1 year"
- Include WITHDRAWAL rules: "6 withdrawals/month allowed, maintain $2,500 minimum"
- Include ACCORDION_DETAILS section with comprehensive financial breakdown
- Include percentages: "60% of $50,000 = $30,000" not just "invest money"
- Include timeline: "within 2 weeks", "by end of month", "on payday (1st and 15th)"
- Include all contact info: websites, phone numbers, apps mentioned
- Break down large tasks into smaller, manageable steps with specific amounts

            EXAMPLE COMPREHENSIVE TODO ITEM FROM CONVERSATION:
            "Step 1: Establish Emergency Fund (6 months expenses: $24,000) in Ally High-Yield Savings (4.5% APY). CALCULATION: Monthly expenses $4,000 × 6 months = $24,000 fund. This covers unemployment, medical emergencies, car repairs, home repairs based on our conversation. Step 1: Go to ally.com within 3 days, complete application using SSN and government ID as discussed. Step 2: Transfer $24,000 from Bank of America checking (30% of your $80,000 total balance). Step 3: Set up monthly auto-deposit of $200 to grow fund to $30,000 target we discussed. Step 4: Download Ally Bank app, enable balance alerts at $20,000 and $30,000. Expected completion: 1 week. ACCORDION_DETAILS: Fund allocation strategy: 100% liquid savings, no investments as recommended in our chat. Can cover 6 months of living expenses including rent/mortgage $2,500, utilities $400, groceries $600, insurance $300, transportation $200 = $4,000/month as we calculated together. Withdrawal rules: Ally allows 6 withdrawals/month, maintain minimum $2,500 to avoid fees as mentioned. Fund growth potential: $24,000 at 4.5% APY = $25,080 after 1 year. Monthly interest earned: $90 at current balance."

            IMPORTANT: Always respond with valid JSON. Create the MOST comprehensive and actionable todo list possible by breaking down ALL conversation advice into specific, numbered steps with exact amounts and percentages.
            """

            response = self.model.generate_content(prompt)
            response_text = response.text.strip()

            # Log the raw response for debugging
            logger.info(f"AI goal extraction raw response: {response_text}")

            # Try to parse as JSON
            import json
            import re

            try:
                # First try direct JSON parsing
                result = json.loads(response_text)
                if result.get('should_create_goal') and result.get('goal_data'):
                    return {
                        'success': True,
                        'goal_data': result['goal_data']
                    }
                else:
                    return {'success': False, 'reason': 'No clear goal identified'}
            except json.JSONDecodeError:
                # Try to extract JSON from the response using regex
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    try:
                        result = json.loads(json_match.group())
                        if result.get('should_create_goal') and result.get('goal_data'):
                            return {
                                'success': True,
                                'goal_data': result['goal_data']
                            }
                    except json.JSONDecodeError:
                        pass

                # Check if it's the insufficient info response
                if "INSUFFICIENT_INFO" in response_text or "not enough" in response_text.lower():
                    return {'success': False, 'reason': 'Insufficient information provided'}
                else:
                    logger.error(f"Failed to parse AI goal extraction response: {response_text}")
                    return {'success': False, 'reason': 'Failed to process AI response'}

        except Exception as e:
            logger.error(f"Error extracting goal from conversation: {e}")
            return {'success': False, 'reason': 'Error processing request'}

    def _create_goal_chat_prompt(self, user_message: str, context: str) -> str:
        """Create a prompt for goal-related chat"""
        prompt = f"""
        You are a friendly and helpful financial AI assistant specializing in helping users set and achieve their financial goals with concrete, actionable advice.

        {context}

        The user just sent this message: "{user_message}"

        IMPORTANT RULE: After 5 total exchanges (including the initial greeting), OR if you have enough information to create a goal, tell the user "I have enough information to create a goal for you! Please click the 'Create Goal from Conversation' button below our chat." and suggest they create the goal.

        Your response should:
        1. Directly address their question or comment
        2. Provide SPECIFIC, CONCRETE financial advice with real product recommendations
        3. Give exact money allocation strategies based on their current balance
        4. Suggest actual financial products (banks, investment accounts, specific funds)
        5. Provide step-by-step actionable instructions
        6. Be encouraging and positive
        7. Keep responses detailed but focused (3-5 sentences)

        SPECIFICALLY INCLUDE:
- Exact dollar amounts to save/month based on their goal
- Specific bank account types (High-Yield Savings, CDs, Money Market)
- Investment recommendations (index funds, ETFs) if appropriate for their risk level
- Exact allocation percentages for their money
- Real financial institutions (examples: Ally Bank, Vanguard, Fidelity)
- Step-by-step instructions to open accounts or set up transfers

Example: "Based on your $50,000 balance and moderate risk tolerance, I recommend putting $30,000 in a Vanguard S&P 500 ETF (VOO), $15,000 in a high-yield savings account with Ally Bank (4.5% APY), and $5,000 in I Bonds for inflation protection. Set up automatic monthly transfers of $417 to reach your $25,000 down payment goal in 3 years."

Focus on gathering this information for goal creation:
- What they want to save for (specific goal)
- Target amount (if mentioned)
- Timeline/deadline (if mentioned)
- Current progress (if mentioned)

After 5 questions or when you have enough information, direct them to create the goal.
        """

        return prompt