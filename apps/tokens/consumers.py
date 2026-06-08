import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class DisplayBoardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.slot_id = self.scope['url_route']['kwargs']['slot_id']
        self.group_name = f'display_{self.slot_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def token_update(self, event):
        await self.send(text_data=json.dumps(event['data']))


def broadcast_token_update(token):
    """Called from views/tasks to push state to display board."""
    layer = get_channel_layer()
    async_to_sync(layer.group_send)(
        f'display_{token.slot_id}',
        {
            'type': 'token_update',
            'data': {
                'token_number': token.token_number,
                'status': token.status,
                'counter': token.counter_number,
            }
        }
    )
