from django.urls import path
from . import views
from .views import TransactionListView, CreateCostItemView, UpdateCostItemView, DeleteCostItemView, ShowCostItemsView, CostItemDetailView

urlpatterns = [
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('costitem-create/', CreateCostItemView.as_view(), name='create-cost-item'),
    path('costitem-update/<uuid:cost_item_id>/', UpdateCostItemView.as_view(), name='update-cost-item'),
    path('costitem-delete/<uuid:cost_item_id>/', DeleteCostItemView.as_view(), name='delete-cost-item'),
    path('costitems-show/', ShowCostItemsView.as_view(), name='show-active-cost-items'),
    path('costitem-detail/<uuid:cost_item_id>/', CostItemDetailView.as_view(), name='cost-item-detail'),
]
