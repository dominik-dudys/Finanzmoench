from django.urls import path
from . import views

urlpatterns = [
    path('jeremy/', views.jeremy_tip, name='jeremy_tip'),
    path('usage/', views.ai_usage, name='ai_usage'),
]