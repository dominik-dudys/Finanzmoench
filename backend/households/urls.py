from django.urls import path
from .views import (
    CreateHouseholdView,
    JoinHouseholdView,
    MyHouseholdView,
    UpdateHouseholdView,
    LeaveHouseholdView,
    DeleteHouseholdView,
    ListHouseholdMembersView,
    ShowCategoriesView,
    CreateCategoryView,
    CategoryDetailView,
    UpdateCategoryView,
    DeleteCategoryView
)

urlpatterns = [
    path('create/', CreateHouseholdView.as_view(), name='household-create'),
    path('join/', JoinHouseholdView.as_view(), name='household-join'),
    path('myhousehold/', MyHouseholdView.as_view(), name='my-household'),
    path('update/', UpdateHouseholdView.as_view(), name='update-household'),
    path('leave/', LeaveHouseholdView.as_view(), name='leave-household'),
    path('delete/', DeleteHouseholdView.as_view(), name='delete-household'),
    path('householdmembers/', ListHouseholdMembersView.as_view(), name='household-members'),
    path('category-create/', CreateCategoryView.as_view(), name='category-create'),
    path('category-update/<uuid:position_id>/', UpdateCategoryView.as_view(), name='category-update'),
    path('category-delete/<uuid:position_id>/', DeleteCategoryView.as_view(), name='category-delete'),
    path('categories-show/', ShowCategoriesView.as_view(), name='show-categories'),
    path('category-detail/<uuid:position_id>/', CategoryDetailView.as_view(), name='category-detail'),
]