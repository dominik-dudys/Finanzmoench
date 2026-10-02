from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import Household, PositionCategory
from .serializers import HouseholdSerializer, PositionCategorySerializer
from accounts.models import Person
from .services import (
    create_household_for_user,
    join_existing_household,
    update_household,
    leave_household,
    delete_household,
    create_category,
    update_category,
    delete_category_safe
)
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter
from drf_spectacular.types import OpenApiTypes


# Create your views here.
class CreateHouseholdView(APIView):
    @extend_schema(request=HouseholdSerializer, responses=HouseholdSerializer)
    def post(self, request):

        if request.user.household:
            return Response(
                {"error": "Du bist bereits Teil eines Haushalts. Bitte verlasse diesen zuerst, um einen neuen zu gründen."},
                status=status.HTTP_400_BAD_REQUEST
            )

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

        if request.user.household:
                    return Response(
                        {"error": "Du bist bereits Teil eines Haushalts. Bitte verlasse diesen zuerst, um einem neuen beizutreten."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

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


class MyHouseholdView(APIView):
    @extend_schema(responses=HouseholdSerializer)
    def get(self, request):
        household = request.user.household

        if not household:
            return Response(None, status=status.HTTP_200_OK)


        data = HouseholdSerializer(household).data
        data['member_count'] = Person.objects.filter(household=household).count()
        return Response(data, status=status.HTTP_200_OK)

class UpdateHouseholdView(APIView):
    @extend_schema(request=HouseholdSerializer, responses=HouseholdSerializer)
    def patch(self, request):
        household = request.user.household

        if not household:
            return Response({"error": "Du bist aktuell in keinem Haushalt."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = HouseholdSerializer(household, data=request.data, partial=True)

        if serializer.is_valid():
            updated_household = update_household(
                household=household,
                update_data=serializer.validated_data
            )

            return Response(HouseholdSerializer(updated_household).data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeaveHouseholdView(APIView):
    @extend_schema(
        responses=inline_serializer(
            name='LeaveResponse',
            fields={'message': serializers.CharField()}
        )
    )
    def post(self, request):

        if not request.user.household:
            return Response({"error": "Du bist aktuell in keinem Haushalt."}, status=status.HTTP_400_BAD_REQUEST)

        leave_household(person=request.user)
        return Response({"message": "Du hast den Haushalt erfolgreich verlassen."}, status=status.HTTP_200_OK)


class DeleteHouseholdView(APIView):
    @extend_schema(
        responses=inline_serializer(
            name='DeleteResponse',
            fields={'message': serializers.CharField()}
        )
    )
    def delete(self, request):
        household = request.user.household

        if not household:
            return Response({"error": "Du bist aktuell in keinem Haushalt."}, status=status.HTTP_400_BAD_REQUEST)

        delete_household(household=household)
        return Response({"message": "Der Haushalt wurde erfolgreich aufgelöst."}, status=status.HTTP_200_OK)


class ListHouseholdMembersView(APIView):
    def get(self, request):
        if not request.user.household:
            return Response([])

        members = Person.objects.filter(household=request.user.household).values(
            'person_id',
            'first_name',
            'last_name'
        )

        return Response(list(members))


class CreateCategoryView(APIView):
    @extend_schema(request=PositionCategorySerializer)
    def post(self, request):
        household = request.user.household
        if not household:
            return Response({"error": "Kein Haushalt gefunden."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PositionCategorySerializer(data=request.data)
        if serializer.is_valid():
            try:
                cat = create_category(household, serializer.validated_data)
                return Response(PositionCategorySerializer(cat).data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response({"error": getattr(e, 'message', str(e))}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ShowCategoriesView(APIView):
    @extend_schema(
        responses=PositionCategorySerializer(many=True),
        parameters=[
            OpenApiParameter(name='type', description='Filter: "income" oder "cost"', required=False, type=str)
        ]
    )
    def get(self, request):
        household = request.user.household
        if not household:
            return Response([], status=status.HTTP_200_OK)

        categories = PositionCategory.objects.filter(household=household).order_by('name')

        category_type = request.query_params.get('type')
        if category_type in ['income', 'cost']:
            categories = categories.filter(type=category_type)

        return Response(PositionCategorySerializer(categories, many=True).data, status=status.HTTP_200_OK)


class CategoryDetailView(APIView):
    @extend_schema(responses=PositionCategorySerializer)
    def get(self, request, position_id):
        try:
            category = PositionCategory.objects.get(position_id=position_id, household=request.user.household)
        except PositionCategory.DoesNotExist:
            return Response({"error": "Kategorie nicht gefunden."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PositionCategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateCategoryView(APIView):
    @extend_schema(
        request=PositionCategorySerializer,
        parameters=[OpenApiParameter(name='position_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)]
    )
    def patch(self, request, position_id):
        try:
            category = PositionCategory.objects.get(position_id=position_id, household=request.user.household)
        except PositionCategory.DoesNotExist:
            return Response({"error": "Kategorie nicht gefunden."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PositionCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                updated_cat = update_category(category, serializer.validated_data)
                return Response(PositionCategorySerializer(updated_cat).data, status=status.HTTP_200_OK)
            except ValidationError as e:
                return Response({"error": getattr(e, 'message', str(e))}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteCategoryView(APIView):
    @extend_schema(
        parameters=[
            OpenApiParameter(name='position_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH),
            OpenApiParameter(name='fallback_category_id', type=OpenApiTypes.UUID, location=OpenApiParameter.QUERY, required=False, description="UUID der Ersatzkategorie")
        ]
    )
    def delete(self, request, position_id):
        try:
            category = PositionCategory.objects.get(position_id=position_id, household=request.user.household)
        except PositionCategory.DoesNotExist:
            return Response({"error": "Kategorie nicht gefunden."}, status=status.HTTP_404_NOT_FOUND)

        fallback_id = request.query_params.get('fallback_category_id')
        fallback = None

        if fallback_id:
            try:
                fallback = PositionCategory.objects.get(position_id=fallback_id, household=request.user.household)
            except PositionCategory.DoesNotExist:
                return Response({"error": "Ersatzkategorie nicht gefunden."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            delete_category_safe(category, fallback)
            return Response({"message": "Kategorie erfolgreich gelöscht."}, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": getattr(e, 'message', str(e))}, status=status.HTTP_400_BAD_REQUEST)