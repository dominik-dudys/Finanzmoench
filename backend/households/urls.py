from django.urls import path
from .views import CreateHouseholdView, JoinHouseholdView

urlpatterns = [
    path('create/', CreateHouseholdView.as_view(), name='household-create'),
    path('join/', JoinHouseholdView.as_view(), name='household-join'),
]