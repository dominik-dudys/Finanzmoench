from django.urls import path
from .views import (
    CreateHouseholdView,
    JoinHouseholdView,
    MyHouseholdView,
    UpdateHouseholdView,
    LeaveHouseholdView,
    DeleteHouseholdView,
    ListHouseholdMembersView,
    CategoryListCreateView,
    CategoryDetailView,
)

urlpatterns = [
    path('create/', CreateHouseholdView.as_view(), name='household-create'),
    path('join/', JoinHouseholdView.as_view(), name='household-join'),
    path('myhousehold/', MyHouseholdView.as_view(), name='my-household'),
    path('update/', UpdateHouseholdView.as_view(), name='update-household'),
    path('leave/', LeaveHouseholdView.as_view(), name='leave-household'),
    path('delete/', DeleteHouseholdView.as_view(), name='delete-household'),
    path('householdmembers/', ListHouseholdMembersView.as_view(), name='household-members'),
    path('categories/', CategoryListCreateView.as_view(), name='category-list'),
    path('categories/<uuid:position_id>/', CategoryDetailView.as_view(), name='category-detail'),
]