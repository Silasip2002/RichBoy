# AI Coach Setup Instructions

## Overview
The AI Coach feature uses Google's Gemini API to provide personalized financial advice based on your financial data.

## Setup Instructions

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 2. Set Environment Variable
Add the Gemini API key to your environment variables:

**Option A: Temporary (for development)**
```bash
export GEMINI_API_KEY="your-api-key-here"
```

**Option B: Add to .env file (recommended)**
Create a `.env` file in the backend directory:
```
GEMINI_API_KEY=your-api-key-here
```

**Option C: Add to system environment**
Add it to your shell profile (.bashrc, .zshrc, etc.):
```bash
echo 'export GEMINI_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

### 3. Restart the Backend
After setting the environment variable, restart your Django development server:
```bash
python manage.py runserver
```

## How It Works

### Backend Features:
- **Financial Data Aggregation**: Collects user's account balances, transactions, assets, and budget information
- **AI-Powered Analysis**: Uses Gemini to analyze financial patterns and provide personalized advice
- **Smart Prompting**: Creates context-aware prompts based on user's risk profile and financial situation
- **Error Handling**: Graceful fallbacks when AI service is unavailable

### Frontend Features:
- **Real-time Advice**: Displays AI-generated financial insights in the Portfolio Performance Card
- **Refresh Functionality**: Users can get fresh advice on demand
- **Loading States**: Visual feedback while AI is processing
- **Financial Summary**: Shows key metrics alongside AI advice

## API Endpoint
- **URL**: `/api/transactions/ai-coach-advice/`
- **Method**: GET
- **Authentication**: Required (JWT token)
- **Response**:
  ```json
  {
    "advice": "Personalized financial advice text...",
    "financial_summary": {
      "total_balance": 10000.00,
      "total_spent_last_30_days": 2500.00,
      "total_asset_value": 15000.00
    }
  }
  ```

## Troubleshooting

### Common Issues:
1. **"AI Coach service is not properly configured"**
   - Ensure GEMINI_API_KEY environment variable is set
   - Restart the Django server after setting the variable

2. **"Failed to generate financial advice"**
   - Check your internet connection
   - Verify your Gemini API key is valid and has quota
   - Check Django logs for detailed error information

3. **Missing financial data**
   - Ensure you have accounts, transactions, and/or assets in the system
   - Check that data is properly linked to your user account

### Security Notes:
- Never commit your API key to version control
- Keep your API key secure and don't share it publicly
- Monitor your API usage through Google AI Studio
- Consider implementing rate limiting for production use