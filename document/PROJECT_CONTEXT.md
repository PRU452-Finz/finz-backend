# FinZ Backend - AI Agent Context & Documentation

This document provides a comprehensive overview of the FinZ Backend project. It is specifically structured to help other AI agents quickly understand the project's architecture, current state, and the roadmap of unbuilt features.

## 1. Project Overview
**FinZ** is an AI-powered personal financial advisor backend API targeted at Gen-Z users. It manages financial transactions, dashboard metrics, and provides financial insights (category classification, balance prediction, recommendations, and financial health scores).

> **IMPORTANT CURRENT STATE**: All AI features are currently **MOCK/Rule-Based**. The primary upcoming objective is to replace these mock endpoints with real Machine Learning models and add multi-user profile support.

## 2. Technologies Used
- **Runtime Environment:** Node.js
- **Web Framework:** Express.js (`express` ^4.19.2)
- **Database:** MySQL
- **ORM:** Sequelize (`sequelize` ^6.37.3, `mysql2` ^3.11.0)
- **Validation:** express-validator (`express-validator` ^7.2.0)
- **Utilities:** `cors`, `dotenv`, `nodemon` (dev)

## 3. Current System State
- **Database Tables**: 
  - `transactions` (id, user_id, amount, category, description, payment_method, date, created_at).
  - Currently seeded with 30 dummy transactions for a single user.
- **Active Endpoints**:
  - `CRUD /api/transactions`
  - `GET /api/dashboard` (Monthly summary aggregation)
  - `POST /api/predict/balance` (Mock: Calculates using average daily spend * remaining days)
  - `POST /api/predict/category` (Mock: Rule-based keyword matching)
  - `GET /api/recommendation/:user_id` (Mock: Generic templates based on thresholds)
  - `GET /api/financial-score/:user_id` (Mock: Weighted formula assuming a hardcoded 5M income)

## 4. Unbuilt Features & Roadmap (TODO)

The following features are planned and need to be implemented. They are divided into two main tracks: Data Science (DS) and AI Engineering (AIE).

### A. Database Enhancements
1. **New `users` Table**: To store user profiles (`monthly_income`, `age`, `occupation`, `financial_goal`, `risk_profile`).
2. **New `budgets` Table**: To store category spending limits per user (`user_id`, `category`, `limit_amount`, `month`).
3. **New `prediction_logs` Table**: To store AI prediction history for monitoring and model retraining.
4. **Update `transactions` Table**: Add `transaction_type` (expense/income), `hour_of_day`, and `is_recurring` columns.

### B. Machine Learning & Data Science (DS)
1. **Category Classification NLP Model**:
   - Expand the keyword dictionary from ~130 to 500+ keywords.
   - Collect and manually label at least 500 real transaction descriptions to build `dataset_category_v1.jsonl`.
   - Train an NLP model (e.g., TF-IDF + Logistic Regression or fine-tuned IndoBERT Lite) to replace rule-based matching.
2. **Balance Prediction Model**:
   - Engineer new temporal features: `avg_weekday_spend`, `avg_weekend_spend`, `recurring_monthly_total`, `spending_trend_7d`.
   - Train a regression model to predict the end-of-month balance more accurately.
3. **Personalized Recommendation Engine**:
   - Create a detailed rule matrix mapping 20+ user profiles/scenarios to specific financial recommendations.
   - Calibrate the financial health score weights based on realistic user personas.

### C. Backend API Integrations (AIE)
1. **Deploy AI Inference Endpoints**:
   - Integrate the trained Category Classification ML model into `POST /api/predict/category` (with a fallback to keyword matching).
   - Integrate the Balance Prediction model into `POST /api/predict/balance`.
2. **Build Recommendation Engine**:
   - Update `GET /api/recommendation/:user_id` to utilize the new rule matrix and read from user profiles/budgets instead of generic templates.
3. **Budget Alert System**:
   - Create a new endpoint `GET /api/budget-alert/:user_id` that returns categories nearing or exceeding their monthly budget limit (>80%).
4. **Caching & Logging Pipelines**:
   - Implement an asynchronous logging pipeline to record all model predictions in `prediction_logs`.
   - Implement an in-memory cache for prediction results to reduce latency.

## 5. Agent Instructions for Future Tasks
When an AI agent is tasked with building one of the upcoming features:
1. **Read References**: Always cross-reference `ai_product_planning.md` for sprint timelines and dependencies, and `finz_todo_jira_trello.md` for detailed acceptance criteria.
2. **Backward Compatibility**: When upgrading mock AI endpoints to real ML inference, ensure the JSON response contract remains unchanged (backward compatible) so the frontend does not break.
3. **Database Migrations**: Always use Sequelize models and modify the `src/config/database.js` or migrations when adding new tables or columns.
