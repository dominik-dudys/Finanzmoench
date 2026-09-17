from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets

from .models import CostItem, ItemEntry, Income, Transaction
from .serializers import (
    CostItemSerializer,
    ItemEntrySerializer,
    IncomeSerializer,
    TransactionSerializer,
)


class CostItemViewSet(viewsets.ModelViewSet):
    serializer_class = CostItemSerializer
    filterset_fields = ["position_category", "interval"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "interval"]

    def get_queryset(self):
        return CostItem.objects.filter(
            household=self.request.user.household
        ).select_related("position_category")

    def perform_create(self, serializer):
        serializer.save(household=self.request.user.household)


class ItemEntryViewSet(viewsets.ModelViewSet):
    serializer_class = ItemEntrySerializer
    filterset_fields = ["cost_item"]

    def get_queryset(self):
        return ItemEntry.objects.filter(
            cost_item__household=self.request.user.household
        ).select_related("cost_item")


class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    filterset_fields = ["position_category"]
    ordering_fields = ["valid_from", "ammount"]

    def get_queryset(self):
        return Income.objects.filter(
            person=self.request.user
        ).select_related("position_category")

    def perform_create(self, serializer):
        serializer.save(person=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    filterset_fields = ["position_category"]
    search_fields = ["note"]
    ordering_fields = ["date", "ammount"]

    def get_queryset(self):
        return Transaction.objects.filter(
            person=self.request.user
        ).select_related("position_category")

    def perform_create(self, serializer):
        serializer.save(person=self.request.user)