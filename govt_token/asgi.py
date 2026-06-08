import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'govt_token.settings')
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from apps.tokens.consumers import DisplayBoardConsumer
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r'ws/display/(?P<service_id>\d+)/$', DisplayBoardConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(websocket_urlpatterns),
})
