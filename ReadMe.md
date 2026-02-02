# RichBoy 💰

**Your Intelligent AI Financial Companion**

RichBoy is a next-generation finance management application capable of more than just tracking expenses. By leveraging advanced **Large Language Models (Google Gemini)** and **LangChain**, RichBoy acts as a personal financial advisor, analyzing your assets, understanding your risk tolerance, and guiding you toward financial freedom with data-driven investment suggestions.

## 🚀 Key Features

### 📊 Phase 1: Core Management
*   **Asset Management**: Centralized tracking for all your assets (Cash, Stocks, Crypto, Real Estate).
*   **Expense & Income Tracking**: Easy logging of daily financial activities.
*   **Interactive Dashboard**: Real-time analytics and visualization of your net worth and spending trends.

### 🧠 Phase 2: AI Intelligence
*   **Personalized Advice**: The AI agent analyzes your portfolio against your risk profile to suggest optimizations.
*   **Market Research**: Integrated with **Yahoo Finance** to fetch real-time data on Stocks, Bonds, and ETFs.
*   **Goal Planning**: Creates actionable tasks and roadmaps to help you reach specific financial milestones.
*   **RAG (Retrieval-Augmented Generation)**: Uses vector databases to provide grounded, context-aware answers to your financial questions.

## 🛠 Technology Stack

### Frontend
*   **Framework**: [Next.js 15](https://nextjs.org/) (TypeScript)
*   **Styling**: [Material UI (MUI)](https://mui.com/) + Emotion
*   **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
*   **Charts**: MUI X Charts

### Backend
*   **Framework**: [Django](https://www.djangoproject.com/) + Django REST Framework
*   **Language**: Python
*   **AI Orchestration**: [LangChain](https://www.langchain.com/)
*   **LLM Provider**: Google Gemini
*   **External APIs**: Yahoo Finance (yfinance)

### Infrastructure & Database
*   **Databases**: PostgreSQL (Production/Docker), SQLite (Local Dev)
*   **Vector Store**: ChromaDB
*   **Caching**: Redis
*   **Containerization**: Docker & Docker Compose
*   **Documentation**: See [DOCKER_README.md](DOCKER_README.md) for detailed container operations.

## 📦 Installation & Setup

You can run the entire stack using Docker (recommended) or set it up manually. For a deep dive into Docker commands, please refer to **[DOCKER_README.md](DOCKER_README.md)**.

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
*   A Google Gemini API Key.

### Option 1: Docker (Recommended)

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Silasip2002/RichBoy.git
    cd RichBoy
    ```

2.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your keys:
    ```bash
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

3.  **Build and Run**
    ```bash
    docker-compose up --build
    ```

    *   **Frontend**: http://localhost:3000
    *   **Backend API**: http://localhost:8000
    *   **Database**: Port 5432

### Option 2: Manual Setup

#### Backend
1.  Navigate to `backend/`:
    ```bash
    cd backend
    ```
2.  Set up virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run migrations and server:
    ```bash
    python manage.py migrate
    python manage.py runserver
    ```

#### Frontend
1.  Navigate to `frontend/`:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start development server:
    ```bash
    npm run dev
    ```

---
*Built with ❤️ by [Silasip2002](https://github.com/Silasip2002)*