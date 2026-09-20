from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import Household
from .serializers import HouseholdSerializer
from .services import create_household_for_user, join_existing_household
from drf_spectacular.utils import extend_schema, inline_serializer

# Create your views here.
class CreateHouseholdView(APIView):
    @extend_schema(request=HouseholdSerializer, responses=HouseholdSerializer)
    def post(self, request):
        serializer = HouseholdSerializer(data=request.data)

        if serializer.is_valid():
            household = create_household_for_user(request.user, serializer.validated_data)

            return Response(
                HouseholdSerializer(household).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JoinHouseholdView(APIView):
    @extend_schema(
        request=inline_serializer(
            name='JoinHouseholdRequest',
            fields={'household_id': serializers.UUIDField()}
        )
    )

    def post(self, request):
        household_id = request.data.get('household_id')

        if not household_id:
            return Response({"error": "Bitte eine household_id angeben."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            household = join_existing_household(request.user, household_id)
            return Response({
                "message": f"Du bist dem Haushalt '{household.name}' erfolgreich beigetreten.",
                "household": HouseholdSerializer(household).data
                }, status=status.HTTP_200_OK)

        except Household.DoesNotExist:
            return Response({"error": "Dieser Haushalt existisert nicht."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError:
            return Response({"error": "Ungültiges Format für die Haushalts-ID."}, status=status.HTTP_400_BAD_REQUEST)


class MyHouseholdsView(APIView):
    @extend_schema(responses=HouseholdSerializer(many=True))
    def get(self, request):
        household = request.user.household

        if household:
            serializer = HouseholdSerializer([household], many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response([], status=status.HTTP_200_OK)