web: cd backend && python manage.py migrate --settings=config.settings_prod && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
