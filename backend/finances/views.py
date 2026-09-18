from django.shortcuts import render

# Create your views here.

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


class TransactionListView(APIView):
    def get(self, request, format=None):
        dummy_data = [
            {"id": 1, "title": "Gehalt", "amount": 2500.00, "date": "2026-06-01"},
            {"id": 2, "title": "Miete", "amount": -850.00, "date": "2026-06-03"}
        ]
        return Response(dummy_data, status=status.HTTP_200_OK)
