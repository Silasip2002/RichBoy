from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet,
    CategoryViewSet,
    BudgetViewSet,
    GoalViewSet,
    get_ai_coach_advice,
    ai_goal_chat,
    ai_create_goal
)

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'goals', GoalViewSet, basename='goal')

urlpatterns = [
    path('', include(router.urls)),
    path('ai-coach-advice/', get_ai_coach_advice, name='ai-coach-advice'),
    path('ai-goal-chat/', ai_goal_chat, name='ai-goal-chat'),
    path('ai-create-goal/', ai_create_goal, name='ai-create-goal'),
]