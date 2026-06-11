from django.apps import AppConfig


class AuditoriaConfig(AppConfig):
    name = 'auditoria'

    def ready(self):
        import auditoria.signals  # noqa: F401
