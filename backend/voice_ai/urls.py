from django.urls import path
from .views import (
    JeremyTipView,
    AiUsageView,
    AiSessionListView,
    AiSessionDetailView,
    AiSessionDeleteView
)

urlpatterns = [
    path('jeremy/', JeremyTipView.as_view(), name='jeremy_tip'),
    path('ai-usage/', AiUsageView.as_view(), name='ai_usage'),
    path('ai-sessions-list/', AiSessionListView.as_view(), name='ai_session_list'),
    path('ai-session-detail/<uuid:session_id>/', AiSessionDetailView.as_view(), name='ai_session_detail'),
    path('ai-session-delete/<uuid:session_id>/', AiSessionDeleteView.as_view(), name='ai-session-delete'),
]