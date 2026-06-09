from django.urls import path
from . import views

urlpatterns = [
    path('lock/', views.lock_slot, name='lock_slot'),
    path('book/', views.book_token, name='book_token'),
    path('call-next/', views.call_next, name='call_next'),
    path('<int:token_id>/served/', views.mark_served, name='mark_served'),
    path('<int:token_id>/no_show/', views.mark_no_show, name='mark_no_show'),
    path('<int:token_id>/skipped/', views.mark_skipped, name='mark_skipped'),
    path('queue/', views.list_queue, name='list_queue'),
    path('serving/', views.list_serving, name='list_serving'),
    path('<int:token_id>/create-payment/', views.create_payment, name='create_payment'),
    path('<int:token_id>/verify-payment/', views.verify_payment, name='verify_payment'),
    path('ticket/<uuid:unique_hash>/', views.ticket_detail, name='ticket_detail'),
]
