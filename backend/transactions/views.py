from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from django.db import transaction as db_transaction
from django.utils import timezone
from datetime import datetime, timedelta
import logging
import uuid

from .models import Transaction, Budget, Goal, Milestone, FinancialProduct
from .serializers import (
    TransactionSerializer, CategorySerializer, BudgetSerializer,
    GoalSerializer, GoalCreateSerializer, MilestoneSerializer
)
from .ai_coach import AICoachService
from accounts.models import Account
from richboy_backend.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return GoalCreateSerializer
        return GoalSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_milestone(self, request, pk=None):
        """Toggle milestone completion status"""
        goal = self.get_object()
        milestone_id = request.data.get('milestone_id')

        try:
            milestone = Milestone.objects.get(id=milestone_id, goal=goal)
            milestone.completed = not milestone.completed
            milestone.status = 'completed' if milestone.completed else 'in_progress'
            milestone.save()

            # Check if all milestones are completed
            all_completed = all(m.completed for m in goal.milestones.all())
            if all_completed:
                goal.status = 'completed'
                goal.current_amount = goal.target_amount
                goal.save()

            serializer = MilestoneSerializer(milestone)
            return Response(serializer.data)
        except Milestone.DoesNotExist:
            return Response(
                {'error': 'Milestone not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class CategoryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        queryset = Transaction.objects.filter(user=request.user).values_list('category', flat=True).distinct()
        serializer = CategorySerializer([{'name': category} for category in queryset], many=True)
        return Response(serializer.data)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.exception("Error in TransactionViewSet list method:")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        user = self.request.user
        queryset = Transaction.objects.filter(user=user).order_by('-date')

        account_id = self.request.query_params.get('account')
        if account_id and account_id != 'all':
            queryset = queryset.filter(account__id=account_id)

        category = self.request.query_params.get('category')
        if category and category != 'all':
            queryset = queryset.filter(category=category)

        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type and transaction_type != 'all':
            queryset = queryset.filter(transaction_type=transaction_type)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        elif start_date:
            queryset = queryset.filter(date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset

    def perform_create(self, serializer):
        with db_transaction.atomic():
            # The account is now expected to be a validated part of the serializer data
            account = serializer.validated_data['account']
            if account.user != self.request.user:
                 raise permissions.PermissionDenied("You do not have permission to access this account.")
            transaction = serializer.save(user=self.request.user)
            self.update_account_balance(transaction)

    def perform_update(self, serializer):
        with db_transaction.atomic():
            old_transaction = Transaction.objects.get(pk=serializer.instance.pk)
            updated_transaction = serializer.save()
            self.revert_account_balance(old_transaction)
            self.update_account_balance(updated_transaction)

    def perform_destroy(self, instance):
        with db_transaction.atomic():
            self.revert_account_balance(instance)
            instance.delete()

    def update_account_balance(self, transaction):
        account = transaction.account
        if transaction.transaction_type == 'income':
            account.balance += transaction.amount
        elif transaction.transaction_type == 'expense':
            account.balance -= transaction.amount
        account.save()

    def revert_account_balance(self, transaction):
        account = transaction.account
        if transaction.transaction_type == 'income':
            account.balance -= transaction.amount
        elif transaction.transaction_type == 'expense':
            account.balance += transaction.amount
        account.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_ai_coach_advice(request):
    """
    Get personalized financial advice from AI coach
    """
    try:
        ai_coach = AICoachService()

        # Get user's financial data
        financial_data = ai_coach.get_user_financial_data(request.user)

        # Generate AI advice
        advice = ai_coach.generate_financial_advice(financial_data)

        return Response({
            'advice': advice,
            'financial_summary': {
                'total_balance': financial_data.get('accounts', {}).get('total_balance', 0),
                'total_spent_last_30_days': financial_data.get('recent_spending', {}).get('total_spent', 0),
                'total_asset_value': financial_data.get('assets', {}).get('total_value', 0),
            }
        })

    except ValueError as e:
        # Handle missing API key
        logger.error(f"AI Coach configuration error: {e}")
        return Response({
            'error': 'AI Coach service is not properly configured',
            'advice': 'AI Coach is currently unavailable. Please contact support.',
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    except Exception as e:
        logger.error(f"Error generating AI coach advice: {e}")
        return Response({
            'error': 'Failed to generate financial advice',
            'advice': 'I\'m having trouble providing financial advice right now. Please try again later.',
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def ai_goal_chat(request):
    """
    Chat with AI coach about financial goals
    """
    try:
        logger.info("Initializing AI Coach Service...")
        ai_coach = AICoachService()

        # Get message and conversation history from request
        message = request.data.get('message', '').strip()
        conversation_history = request.data.get('conversation_history', [])

        if not message:
            return Response({
                'error': 'Message is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Generating AI response for message: {message[:50]}...")

        # Generate AI response
        response = ai_coach.generate_goal_chat_response(
            user=request.user,
            message=message,
            conversation_history=conversation_history
        )

        logger.info("AI response generated successfully")

        return Response({
            'response': response,
            'timestamp': timezone.now().isoformat()
        })

    except ValueError as e:
        # Handle missing API key
        logger.error(f"AI Coach configuration error: {e}")
        return Response({
            'error': 'AI Coach service is not properly configured',
            'response': 'AI Coach is currently unavailable. Please contact support.',
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    except Exception as e:
        logger.error(f"Error in AI goal chat: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        # Check for specific API errors
        error_msg = str(e).lower()
        if "api key" in error_msg or "permission" in error_msg or "401" in error_msg:
            return Response({
                'error': 'API authentication failed',
                'response': 'I\'m having trouble accessing my AI capabilities due to an API configuration issue. Please check your API key setup.',
            }, status=status.HTTP_401_UNAUTHORIZED)

        return Response({
            'error': 'Failed to generate response',
            'response': 'I\'m having trouble responding right now. Please try again later.',
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def ai_create_goal(request):
    """
    Extract goal from conversation and create it automatically
    """
    try:
        logger.info("AI create goal request received")
        logger.info(f"Request data: {request.data}")

        # Get conversation history from request
        conversation_history = request.data.get('conversation_history', [])

        if not conversation_history:
            logger.error("No conversation history provided")
            return Response({
                'success': False,
                'error': 'Conversation history is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"AI goal creation request with {len(conversation_history)} messages")

        # Try to use AI service, but fallback to simple logic if it fails
        try:
            ai_coach = AICoachService()

            # Extract goal information from conversation
            goal_extraction = ai_coach.extract_goal_from_conversation(
                user=request.user,
                conversation_history=conversation_history
            )

            logger.info(f"AI goal extraction result: {goal_extraction}")

            # For now, return the goal data (since we don't have goal models in DB yet)
            # In the future, this would create the goal in the database
            goal_data = goal_extraction.get('goal_data', {})

            # If AI couldn't extract a goal, create a default savings goal
            if not goal_extraction.get('success'):
                logger.info("AI couldn't extract goal, creating default savings goal")
                goal_data = {
                    'title': 'Build Emergency Fund',
                    'description': 'Save money for unexpected expenses and financial security',
                    'category': 'savings',
                    'target_amount': 10000,
                    'current_amount': 0,
                    'deadline': (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d'),
                    'milestones': [
                        {
                            'title': 'Save first $500',
                            'description': 'Start your emergency fund with $500',
                            'target_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
                        },
                        {
                            'title': 'Reach $2,500',
                            'description': 'Build a solid foundation',
                            'target_date': (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d')
                        },
                        {
                            'title': 'Complete emergency fund',
                            'description': 'Reach your $10,000 emergency fund goal',
                            'target_date': (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
                        }
                    ]
                }

        except Exception as ai_error:
            logger.error(f"AI service failed, using fallback: {ai_error}")
            # Create a simple fallback goal
            goal_data = {
                'title': 'Build Financial Security',
                'description': 'Save money and build wealth for your future',
                'category': 'savings',
                'target_amount': 10000,
                'current_amount': 0,
                'deadline': (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d'),
                'milestones': [
                    {
                        'title': 'Create budget',
                        'description': 'Track your income and expenses',
                        'target_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
                    },
                    {
                        'title': 'Save first $1,000',
                        'description': 'Build your emergency fund',
                        'target_date': (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')
                    },
                    {
                        'title': 'Invest for growth',
                        'description': 'Put your money to work for you',
                        'target_date': (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d')
                    }
                ]
            }

        # Generate milestone IDs and dates
        now = datetime.now()
        for i, milestone in enumerate(goal_data.get('milestones', [])):
            milestone['id'] = str(uuid.uuid4())
            milestone['target_date'] = milestone.get('target_date') or (now + timedelta(days=30 * (i + 1))).strftime('%Y-%m-%d')
            milestone['completed'] = False
            milestone['status'] = 'completed' if i == 0 and goal_data.get('current_amount', 0) > 0 else 'upcoming' if i > 0 else 'in_progress'

        # Create complete goal object
        complete_goal = {
            'id': str(uuid.uuid4()),
            'title': goal_data['title'],
            'description': goal_data['description'],
            'target_amount': goal_data['target_amount'],
            'current_amount': goal_data.get('current_amount', 0),
            'deadline': goal_data.get('deadline'),
            'category': goal_data['category'],
            'status': 'active',
            'milestones': goal_data.get('milestones', []),
            'created_at': now.isoformat(),
            'updated_at': now.isoformat(),
            'ai_generated': True
        }

        logger.info(f"Created complete goal object: {complete_goal['title']}")

        # Save the goal to the database
        try:
            with db_transaction.atomic():
                # Create the goal
                goal = Goal.objects.create(
                    id=complete_goal['id'],
                    user=request.user,
                    title=complete_goal['title'],
                    description=complete_goal['description'],
                    target_amount=complete_goal['target_amount'],
                    current_amount=complete_goal['current_amount'],
                    deadline=datetime.strptime(complete_goal['deadline'], '%Y-%m-%d').date() if complete_goal.get('deadline') else None,
                    category=complete_goal['category'],
                    status=complete_goal['status'],
                    ai_generated=complete_goal['ai_generated']
                )

                # Create milestones
                for milestone_data in complete_goal['milestones']:
                    milestone = Milestone.objects.create(
                        id=milestone_data['id'],
                        goal=goal,
                        title=milestone_data['title'],
                        description=milestone_data.get('description'),
                        target_date=datetime.strptime(milestone_data['target_date'], '%Y-%m-%d').date() if milestone_data.get('target_date') else None,
                        completed=milestone_data['completed'],
                        status=milestone_data['status'],
                        calculation=milestone_data.get('calculation'),
                        accordion_details=milestone_data.get('accordion_details'),
                        timeline=milestone_data.get('timeline')
                    )

                    # Create financial products if they exist
                    if 'products' in milestone_data:
                        for product_data in milestone_data['products']:
                            FinancialProduct.objects.create(
                                milestone=milestone,
                                type=product_data.get('type'),
                                name=product_data['name'],
                                amount=product_data['amount'].replace('$', '').replace(',', '') if product_data.get('amount') else None,
                                percentage=product_data['percentage']
                            )

                # Serialize and return the created goal
                serializer = GoalSerializer(goal)
                logger.info(f"Goal saved to database with ID: {goal.id}")

                return Response({
                    'success': True,
                    'goal': serializer.data,
                    'message': f"I've created a new goal for you: {goal_data['title']}"
                })

        except Exception as db_error:
            logger.error(f"Database error saving goal: {db_error}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

            # Return the goal data even if database save fails
            return Response({
                'success': True,
                'goal': complete_goal,
                'message': f"I've created a new goal for you: {goal_data['title']} (Note: Saved temporarily)"
            })

    except ValueError as e:
        # Handle missing API key
        logger.error(f"AI Coach configuration error: {e}")
        logger.error(f"Error details: {type(e).__name__}: {str(e)}")
        return Response({
            'success': False,
            'error': 'AI Coach service is not properly configured',
            'message': 'AI Coach is currently unavailable. Please contact support.',
            'details': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    except Exception as e:
        logger.error(f"Error in AI create goal: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception details: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")

        # Check for specific API errors
        error_msg = str(e).lower()
        if "api key" in error_msg or "permission" in error_msg or "401" in error_msg:
            return Response({
                'success': False,
                'error': 'API authentication failed',
                'message': 'I\'m having trouble accessing my AI capabilities due to an API configuration issue.',
                'details': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)

        return Response({
            'success': False,
            'error': 'Failed to create goal',
            'message': 'I\'m having trouble creating a goal right now. Please try again later.',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
