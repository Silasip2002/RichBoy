from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction as db_transaction
import logging

from .models import Transaction
from .serializers import TransactionSerializer, CategorySerializer
from accounts.models import Account
from richboy_backend.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)

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
