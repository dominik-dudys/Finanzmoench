from django.urls import path
from . import views
from .views import TransactionListView, CreateCostItemView, UpdateCostItemView

urlpatterns = [
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('costitem-create/', CreateCostItemView.as_view(), name='create-cost-item'),
    path('costitem-update/', UpdateCostItemView.as_view(), name='update-cost-item'),
]
