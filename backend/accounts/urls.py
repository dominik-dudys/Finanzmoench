from django.urls import path
from .views import MeView, DsgvoDataExportView, DsgvoDeleteAccountView

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('dsgvo-export/', DsgvoDataExportView.as_view(), name='dsgvo-export'),
    path('dsgvo-delete/', DsgvoDeleteAccountView.as_view(), name='dsgvo-delete'),
]

