import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from apps.tokens.consumers import DisplayBoardConsumer
from django.urls import re_path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'govt_token.settings')

websocket_urlpatterns = [
    re_path(r'ws/display/(?P<service_id>\d+)/$', DisplayBoardConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter(websocket_urlpatterns),
})
