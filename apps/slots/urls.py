from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_or_create_slots, name='list_or_create_slots'),
    path('<int:slot_id>/', views.slot_detail, name='slot_detail'),
]
