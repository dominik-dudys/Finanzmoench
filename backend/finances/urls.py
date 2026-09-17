from rest_framework.routers import DefaultRouter
from .views import (
    CostItemViewSet,
    ItemEntryViewSet,
    IncomeViewSet,
    TransactionViewSet,
)

router = DefaultRouter()
router.register("cost-items", CostItemViewSet, basename="cost-item")
router.register("item-entries", ItemEntryViewSet, basename="item-entry")
router.register("incomes", IncomeViewSet, basename="income")
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = router.urls