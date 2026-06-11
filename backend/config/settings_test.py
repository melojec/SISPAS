from .settings import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Desabilita middleware de auditoria nos testes para evitar dependências extras
MIDDLEWARE = [m for m in MIDDLEWARE if 'AuditoriaMiddleware' not in m]
