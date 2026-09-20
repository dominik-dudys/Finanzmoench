from django.urls import path
from .views import CreateHouseholdView, JoinHouseholdView, MyHouseholdsView

urlpatterns = [
    path('create/', CreateHouseholdView.as_view(), name='household-create'),
    path('join/', JoinHouseholdView.as_view(), name='household-join'),
    path('me/', MyHouseholdsView.as_view(), name='my-households'),
]