from django.urls import path
from myhost import views

urlpatterns = [
    path('process_message/', views.process_message, name='process_message'),
    path('messages/', views.message_list, name='message_list'),
]
