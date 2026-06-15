from .settings import *
import dj_database_url

DEBUG = False

SECRET_KEY = os.getenv('SECRET_KEY')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# Banco PostgreSQL via variável DATABASE_URL do Railway
DATABASES = {
    'default': dj_database_url.config(
        env='DATABASE_URL',
        conn_max_age=600,
        ssl_require=True,
    )
}

# Whitenoise serve os arquivos estáticos
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

STATIC_ROOT = BASE_DIR / 'staticfiles'

# CORS — libera tudo para validação
CORS_ALLOW_ALL_ORIGINS = True

# Arquivos de media no próprio servidor (Railway tem disco efêmero — ok para validação)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
