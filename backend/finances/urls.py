from django.urls import path
from . import views
from .views import TransactionListView

urlpatterns = [
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('jeremy/', views.jeremy_tip, name='jeremy_tip'),
]