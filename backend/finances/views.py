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
from .models import CostItem, CostShare, Income
from .services import create_cost_item, update_cost_item, delete_cost_item, create_income, update_income, delete_income
from .serializers import CostItemSerializer, IncomeSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.db.models import Q
from django.utils.dateparse import parse_date
from drf_spectacular.types import OpenApiTypes

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
    @extend_schema(
            request=CostItemSerializer,
            parameters=[OpenApiParameter(name='cost_item_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)]
        )

    def patch(self, request,  cost_item_id):
        household = request.user.household

        try:
            cost_item = CostItem.objects.get(
                cost_item_id=cost_item_id,
                household=household,
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
                    household=household,
                    update_data=validated_data,
                    shares_data=shares_data
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            return Response(
                {
                    "message": "Kostenposten erfolgreich aktualisiert.",
                    "cost_item_id": updated_item.cost_item_id
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteCostItemView(APIView):
    @extend_schema(
            parameters=[OpenApiParameter(name='cost_item_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)]
        )

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


class ShowCostItemsView(APIView):
    @extend_schema(
        responses=CostItemSerializer(many=True),
        parameters=[OpenApiParameter(name='date', description='Format: YYYY-MM-DD für historische Daten', required=False, type=str)]
    )

    def get(self, request):

        if not request.user.household:
            return Response([], status=status.HTTP_200_OK)

        target_date_str = request.query_params.get('date')

        #Anzeige der gültigen Kostenposten an exaktem Datum (Historisierte Daten)
        if target_date_str:
            target_date = parse_date(target_date_str)

            if not target_date:
                return Response({"error": "Ungültiges Datumsformat. Bitte YYYY-MM-DD nutzen."}, status=status.HTTP_400_BAD_REQUEST)

            cost_items = CostItem.objects.filter(
                household=request.user.household,
                valid_from__lte=target_date  # __date entfernt
            ).filter(
                Q(valid_until__isnull=True) | Q(valid_until__gt=target_date) # __date entfernt
            ).order_by('name')

        #Anzeige der aktuell gültigen Kostenposten
        else:
            cost_items = CostItem.objects.filter(
                household=request.user.household,
                valid_until__isnull=True
            ).order_by('name')

        serializer = CostItemSerializer(cost_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CostItemDetailView(APIView):
    @extend_schema(
        responses=CostItemSerializer,
        parameters=[OpenApiParameter(name='cost_item_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)]
    )
    def get(self, request, cost_item_id):
        try:
            cost_item = CostItem.objects.get(
                cost_item_id=cost_item_id,
                household=request.user.household,
                valid_until__isnull=True
            )
        except CostItem.DoesNotExist:
            return Response(
                {"error": "Kostenposten nicht gefunden oder historisiert."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CostItemSerializer(cost_item)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateIncomeView(APIView):
    @extend_schema(request=IncomeSerializer)
    def post(self, request):
            serializer = IncomeSerializer(data=request.data)
            if serializer.is_valid():

                income = create_income(
                    person=request.user,
                    amount=serializer.validated_data['amount'],
                    position_category=serializer.validated_data.get('position_category')
                )
                return Response(IncomeSerializer(income).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateIncomeView(APIView):
    @extend_schema(
        request=IncomeSerializer,
        parameters=[OpenApiParameter(name='income_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)]
    )
    def patch(self, request, income_id):
        try:
            income = Income.objects.get(
                income_id=income_id,
                person=request.user,
                valid_until__isnull=True
            )
        except Income.DoesNotExist:
            return Response(
                {"error": "Einkommen nicht gefunden, bereits archiviert oder keine Berechtigung."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = IncomeSerializer(income, data=request.data, partial=True)
        if serializer.is_valid():
            updated_income = update_income(income, serializer.validated_data)
            return Response(IncomeSerializer(updated_income).data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteIncomeView(APIView):
    @extend_schema(
        parameters=[OpenApiParameter(name='income_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)]
    )
    def delete(self, request, income_id):
        try:
            income = Income.objects.get(
                income_id=income_id,
                person=request.user,
                valid_until__isnull=True
            )
        except Income.DoesNotExist:
            return Response(
                {"error": "Einkommen nicht gefunden oder keine Berechtigung."},
                status=status.HTTP_404_NOT_FOUND
            )

        delete_income(income)
        return Response(
            {"message": "Einkommen erfolgreich entfernt."},
            status=status.HTTP_200_OK
        )


class ShowIncomesView(APIView):
    @extend_schema(
        responses=IncomeSerializer(many=True),
        parameters=[
            OpenApiParameter(name='date', description='Format: YYYY-MM-DD für historische Daten', required=False, type=OpenApiTypes.DATE)
        ]
    )
    def get(self, request):
        if not hasattr(request.user, 'household') or not request.user.household:
            return Response([], status=status.HTTP_200_OK)

        target_date_str = request.query_params.get('date')

        incomes = Income.objects.filter(person__household=request.user.household)

        # Anzeige historischer Daten
        if target_date_str:
            target_date = parse_date(target_date_str)
            if not target_date:
                return Response(
                    {"error": "Ungültiges Datumsformat. Bitte YYYY-MM-DD nutzen."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            incomes = incomes.filter(
                valid_from__lte=target_date
            ).filter(
                Q(valid_until__isnull=True) | Q(valid_until__gt=target_date)
            )

        # Anzeige aktueller Daten
        else:
            incomes = incomes.filter(valid_until__isnull=True)

        incomes = incomes.order_by('person__first_name')

        serializer = IncomeSerializer(incomes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IncomeDetailView(APIView):
    @extend_schema(
        responses=IncomeSerializer,
        parameters=[OpenApiParameter(name='income_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)]
    )
    def get(self, request, income_id):
        try:
            income = Income.objects.get(
                income_id=income_id,
                person__household=request.user.household,
                valid_until__isnull=True
            )
        except Income.DoesNotExist:
            return Response(
                {"error": "Einkommen nicht gefunden oder archiviert."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = IncomeSerializer(income)
        return Response(serializer.data, status=status.HTTP_200_OK)