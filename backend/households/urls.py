from django.urls import path
from .views import (
    CreateHouseholdView,
    JoinHouseholdView,
    MyHouseholdView,
    UpdateHouseholdView,
    LeaveHouseholdView,
    DeleteHouseholdView
)

urlpatterns = [
    path('create/', CreateHouseholdView.as_view(), name='household-create'),
    path('join/', JoinHouseholdView.as_view(), name='household-join'),
    path('myhousehold/', MyHouseholdView.as_view(), name='my-household'),
    path('update/', UpdateHouseholdView.as_view(), name='update-household'),
    path('leave/', LeaveHouseholdView.as_view(), name='leave-household'),
    path('delete/', DeleteHouseholdView.as_view(), name='delete-household'),
]