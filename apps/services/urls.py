from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_or_create_services, name='list_or_create_services'),
    path('<int:service_id>/', views.service_detail, name='service_detail'),
]
