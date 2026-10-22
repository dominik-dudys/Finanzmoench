from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from accounts.models import Person
from .models import Household, PositionCategory, HouseholdJoinRequest
from .serializers import (
    HouseholdSerializer,
    PositionCategorySerializer,
    HouseholdJoinRequestSerializer,
    RespondJoinRequestSerializer
)
from .services import (
    create_household_for_user,
    request_to_join_household,
    respond_to_join_request,
    update_household,
    leave_household,
    delete_household,
    create_category,
    update_category,
    delete_category_safe
)


class CreateHouseholdView(APIView):
    @extend_schema(request=HouseholdSerializer, responses=HouseholdSerializer, summary="Erstellt einen neuen Haushalt.")
    def post(self, request):
        if request.user.household:
            return Response(
                {"error": "Du bist bereits Teil eines Haushalts. Bitte verlasse diesen zuerst, um einen neuen zu gründen."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = HouseholdSerializer(data=request.data)
        if serializer.is_valid():
            try:
                household = create_household_for_user(request.user, serializer.validated_data)
                return Response(
                    HouseholdSerializer(household).data,
                    status=status.HTTP_201_CREATED
                )
            except ValidationError as e:
                return Response({"error": getattr(e, 'message', str(e))}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JoinHouseholdView(APIView):
    @extend_schema(
        summary="Sendet eine Beitrittsanfrage an einen Haushalt.",
        request=inline_serializer(
            name='JoinHouseholdRequest',
            fields={'household_id': serializers.UUIDField()}
        ),
        responses={201: HouseholdJoinRequestSerializer}
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
            join_request = request_to_join_household(person=request.user, household_id=household_id)
            return Response(
                {
                    "message": f"Beitrittsanfrage an '{join_request.household.name}' wurde gesendet und wartet auf Freigabe durch ein Mitglied.",
                    "join_request": HouseholdJoinRequestSerializer(join_request).data
                },
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            msg = getattr(e, 'message', str(e))
            status_code = status.HTTP_404_NOT_FOUND if "existiert nicht" in msg else status.HTTP_400_BAD_REQUEST
            return Response({"error": msg}, status=status_code)


class ListHouseholdJoinRequestsView(APIView):
    @extend_schema(
        summary="Ruft offene Beitrittsanfragen für den eigenen Haushalt ab.",
        responses=HouseholdJoinRequestSerializer(many=True)
    )
    def get(self, request):
        household = request.user.household
        if not household:
            return Response([], status=status.HTTP_200_OK)

        requests_qs = HouseholdJoinRequest.objects.filter(
            household=household,
            status=HouseholdJoinRequest.StatusChoices.PENDING
        ).select_related('person', 'household')

        return Response(
            HouseholdJoinRequestSerializer(requests_qs, many=True).data,
            status=status.HTTP_200_OK
        )


class MyJoinRequestsView(APIView):
    @extend_schema(
        summary="Ruft eigene gesendete Beitrittsanfragen ab.",
        responses=HouseholdJoinRequestSerializer(many=True)
    )
    def get(self, request):
        requests_qs = HouseholdJoinRequest.objects.filter(
            person=request.user
        ).select_related('person', 'household')

        return Response(
            HouseholdJoinRequestSerializer(requests_qs, many=True).data,
            status=status.HTTP_200_OK
        )


class RespondHouseholdJoinRequestView(APIView):
    @extend_schema(
        summary="Beitrittsanfrage annehmen oder ablehnen.",
        request=RespondJoinRequestSerializer,
        responses=HouseholdJoinRequestSerializer,
        parameters=[
            OpenApiParameter(name='request_id', type=OpenApiTypes.UUID, location=OpenApiParameter.PATH)
        ]
    )
    def post(self, request, request_id):
        if not request.user.household:
            return Response({"error": "Du gehörst aktuell keinem Haushalt an."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RespondJoinRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        approve = serializer.validated_data['approve']

        try:
            join_request = respond_to_join_request(
                responder=request.user,
                request_id=request_id,
                approve=approve
            )
            action_text = "angenommen" if approve else "abgelehnt"
            return Response(
                {
                    "message": f"Die Beitrittsanfrage von {join_request.person.first_name} wurde {action_text}.",
                    "join_request": HouseholdJoinRequestSerializer(join_request).data
                },
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response({"error": getattr(e, 'message', str(e))}, status=status.HTTP_400_BAD_REQUEST)


class MyHouseholdView(APIView):
    @extend_schema(responses=HouseholdSerializer, summary="Ruft detaillierte Informationen zum eigenen Haushalt ab.")
    def get(self, request):
        household = request.user.household
        if not household:
            return Response(None, status=status.HTTP_200_OK)

        data = HouseholdSerializer(household).data
        data['member_count'] = Person.objects.filter(household=household).count()
        return Response(data, status=status.HTTP_200_OK)


class UpdateHouseholdView(APIView):
    @extend_schema(request=HouseholdSerializer, responses=HouseholdSerializer, summary="Bearbeitet den eigenen Haushalt.")
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
        ),
        summary="Entfernt den ausführenden Benutzer aus dem aktuellen Haushalt."
    )
    def post(self, request):
        household = request.user.household
        if not household:
            return Response({"error": "Du bist aktuell in keinem Haushalt."}, status=status.HTTP_400_BAD_REQUEST)

        was_last_member = not household.person_set.exclude(pk=request.user.pk).exists()

        try:
            leave_household(person=request.user)
        except ValidationError as e:
            return Response({"error": getattr(e, 'message', str(e))}, status=status.HTTP_400_BAD_REQUEST)

        if was_last_member:
            return Response(
                {"message": "Du hast den Haushalt verlassen. Da du das letzte Mitglied warst, wurde der Haushalt aufgelöst."},
                status=status.HTTP_200_OK
            )

        return Response({"message": "Du hast den Haushalt erfolgreich verlassen."}, status=status.HTTP_200_OK)


class DeleteHouseholdView(APIView):
    @extend_schema(
        responses=inline_serializer(
            name='DeleteResponse',
            fields={'message': serializers.CharField()}
        ),
        summary="Löscht den eigenen Haushalt."
    )
    def delete(self, request):
        household = request.user.household
        if not household:
            return Response({"error": "Du bist aktuell in keinem Haushalt."}, status=status.HTTP_400_BAD_REQUEST)

        delete_household(household=household)
        return Response({"message": "Der Haushalt wurde erfolgreich aufgelöst."}, status=status.HTTP_200_OK)


class ListHouseholdMembersView(APIView):
    @extend_schema(
        responses=inline_serializer(
            name='HouseholdMemberList',
            fields={
                'person_id': serializers.UUIDField(),
                'first_name': serializers.CharField(),
                'last_name': serializers.CharField(),
            },
            many=True
        ),
        summary="Listet alle Teilnehmer des Haushalts detailliert auf."
    )
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
    @extend_schema(request=PositionCategorySerializer, responses=PositionCategorySerializer, summary="Erstellt eine neue, benutzerdefinierte Kategorie.")
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
        ],
        summary="Listet alle Kategorien des Haushalts detailliert auf."
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
    @extend_schema(responses=PositionCategorySerializer, summary="Zeigt detailliete Informationen zur angegebenen Kategorie.")
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
        responses=PositionCategorySerializer,
        summary="Bearbeitet die angegebene Kategorie.",
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
        ],
        summary="Löscht die angegebene Kategorie."
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