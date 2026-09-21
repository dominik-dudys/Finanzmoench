from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
import sys
import traceback
import requests
from urllib.parse import quote
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from .models import CostItem, CostShare
from .services import create_cost_item, update_cost_item, delete_cost_item
from .serializers import CostItemSerializer
from drf_spectacular.utils import extend_schema

# Create your views here.

class TransactionListView(APIView):
    def get(self, request, format=None):
        dummy_data = [
            {"id": 1, "title": "Gehalt", "amount": 2500.00, "date": "2026-06-01"},
            {"id": 2, "title": "Miete", "amount": -850.00, "date": "2026-06-03"}
        ]
        return Response(dummy_data, status=status.HTTP_200_OK)


class CreateCostItemView(APIView):
    @extend_schema(request=CostItemSerializer)
    def post(self, request):
        household = request.user.household

        if not household:
            return Response({"error": "Du bist in keinem Haushalt."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CostItemSerializer(data=request.data)

        if serializer.is_valid():
            validated_data = serializer.validated_data
            shares_data = validated_data.pop('shares')

            try:
                cost_item = create_cost_item(
                    household=household,
                    item_data=validated_data,
                    shares_data=shares_data
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response(
                {
                    "message": "Kostenposten erfolgreich erstellt.",
                    "cost_item_id": cost_item.cost_item_id
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateCostItemView(APIView):
    @extend_schema(request=CostItemSerializer)
    def patch(self, request, cost_item_id):

        try:
            cost_item = CostItem.objects.get(
                cost_item_id=cost_item_id,
                household=request.user.household,
                valid_until__isnull=True
            )
        except CostItem.DoesNotExist:
            return Response(
                {"error": "Kostenposten nicht gefunden oder bereits archiviert."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CostItemSerializer(cost_item, data=request.data, partial=True)

        if serializer.is_valid():
            validated_data = serializer.validated_data
            shares_data = validated_data.pop('shares', None)

            try:
                updated_item = update_cost_item(
                    cost_item=cost_item,
                    update_data=validated_data,
                    shares_data=shares_data
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response(
                {
                    "message": "Kostenposten erfolgreich aktualisiert.",
                    "cost_item_id": updated_item.cost_item_id
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteCostItemView(APIView):
    def delete(self, request, cost_item_id):

        try:
            cost_item = CostItem.objects.get(
                cost_item_id=cost_item_id,
                household=request.user.household,
                valid_until__isnull=True
            )
        except CostItem.DoesNotExist:
            return Response(
                {"error": "Kostenposten nicht gefunden oder bereits archiviert."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            delete_cost_item(cost_item=cost_item)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {"message": "Kostenposten erfolgreich entfernt."},
            status=status.HTTP_200_OK
        )