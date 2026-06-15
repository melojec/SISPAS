from django.core.management.base import BaseCommand
from usuarios.models import Usuario


class Command(BaseCommand):
    help = 'Cria o usuário administrador padrão se não existir'

    def handle(self, *args, **kwargs):
        email = 'admin@admin.com'
        if not Usuario.objects.filter(email=email).exists():
            Usuario.objects.create_superuser(
                email=email,
                nome='Admin',
                password='0000',
                perfil='administrador',
            )
            self.stdout.write(self.style.SUCCESS(f'Admin criado: {email}'))
        else:
            self.stdout.write(f'Admin já existe: {email}')
