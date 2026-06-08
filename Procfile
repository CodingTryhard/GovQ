web: gunicorn govt_token.wsgi:application --log-file -
worker: celery -A govt_token worker -l info
