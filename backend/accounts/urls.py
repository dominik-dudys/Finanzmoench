from django.urls import path
from .views import MeView, DsgvoDataExportView

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('dsgvo-export/', DsgvoDataExportView.as_view(), name='dsgvo-export'),
]

