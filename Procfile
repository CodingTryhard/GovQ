web: daphne -b 0.0.0.0 -p $PORT govt_token.asgi:application
worker: celery -A govt_token worker -l info
