from django.urls import path
from . import views
from .views import (
    TransactionListView,
    CreateCostItemView,
    UpdateCostItemView,
    DeleteCostItemView,
    ShowCostItemsView,
    CostItemDetailView,
    CreateIncomeView,
    UpdateIncomeView,
    DeleteIncomeView,
    ShowIncomesView,
    IncomeDetailView,
)

urlpatterns = [
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('costitem-create/', CreateCostItemView.as_view(), name='create-cost-item'),
    path('costitem-update/<uuid:cost_item_id>/', UpdateCostItemView.as_view(), name='update-cost-item'),
    path('costitem-delete/<uuid:cost_item_id>/', DeleteCostItemView.as_view(), name='delete-cost-item'),
    path('costitems-show/', ShowCostItemsView.as_view(), name='show-active-cost-items'),
    path('costitem-detail/<uuid:cost_item_id>/', CostItemDetailView.as_view(), name='cost-item-detail'),
    path('income-create/', CreateIncomeView.as_view(), name='income-create'),
    path('income-update/<uuid:income_id>/', UpdateIncomeView.as_view(), name='income-update'),
    path('income-delete/<uuid:income_id>/', DeleteIncomeView.as_view(), name='income-delete'),
    path('incomes-show/', ShowIncomesView.as_view(), name='show-incomes'),
    path('income-detail/<uuid:income_id>/', IncomeDetailView.as_view(), name='income-detail'),
]
