from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.db.models import Count, Q
from .models import Household, PositionCategory
from .serializers import HouseholdSerializer, PositionCategorySerializer
from accounts.models import Person
from .services import create_household_for_user, join_existing_household, update_household, leave_household, delete_household
from drf_spectacular.utils import extend_schema, inline_serializer


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

class CategoryListCreateView(APIView):
    @extend_schema(responses=PositionCategorySerializer(many=True))
    def get(self, request):
        household = request.user.household
        if not household:
            return Response([])

        categories = (
            household.position_categories
            .annotate(contract_count=Count("costitem", filter=Q(costitem__valid_until__isnull=True)))
            .order_by("name")
        )
        return Response(PositionCategorySerializer(categories, many=True).data)

    @extend_schema(request=PositionCategorySerializer, responses=PositionCategorySerializer)
    def post(self, request):
        household = request.user.household
        if not household:
            return Response({"error": "Du bist in keinem Haushalt."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PositionCategorySerializer(data=request.data, context={"household": household})
        if serializer.is_valid():
            category = serializer.save(household=household)
            return Response(PositionCategorySerializer(category).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetailView(APIView):
    def _get_category(self, request, position_id):
        household = request.user.household
        if not household:
            return None
        return PositionCategory.objects.filter(household=household, position_id=position_id).first()

    @extend_schema(request=PositionCategorySerializer, responses=PositionCategorySerializer)
    def patch(self, request, position_id):
        category = self._get_category(request, position_id)
        if not category:
            return Response({"error": "Kategorie nicht gefunden."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PositionCategorySerializer(
            category, data=request.data, partial=True, context={"household": category.household}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, position_id):
        category = self._get_category(request, position_id)
        if not category:
            return Response({"error": "Kategorie nicht gefunden."}, status=status.HTTP_404_NOT_FOUND)

        # Verträge/Einkommen bleiben erhalten, ihre Kategorie wird leer (on_delete=SET_NULL)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)