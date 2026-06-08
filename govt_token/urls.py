from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/services/', include('apps.services.urls')),
    path('api/slots/', include('apps.slots.urls')),
    path('api/tokens/', include('apps.tokens.urls')),
    path('api/admin/', include('apps.accounts.urls')),
]
