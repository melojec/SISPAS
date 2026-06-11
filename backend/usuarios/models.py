from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):
    def create_user(self, email, nome, password=None, **extra_fields):
        if not email:
            raise ValueError('Email é obrigatório')
        email = self.normalize_email(email)
        user = self.model(email=email, nome=nome, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nome, password=None, **extra_fields):
        extra_fields.setdefault('perfil', Usuario.ADMINISTRADOR)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, nome, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    ADMINISTRADOR = 'administrador'
    ASPLAN = 'asplan'
    COORDENADOR = 'coordenador'
    USUARIO = 'usuario'
    VISUALIZADOR = 'visualizador'

    PERFIL_CHOICES = [
        (ADMINISTRADOR, 'Administrador'),
        (ASPLAN, 'ASPLAN'),
        (COORDENADOR, 'Coordenador'),
        (USUARIO, 'Usuário'),
        (VISUALIZADOR, 'Visualizador'),
    ]

    email = models.EmailField(unique=True)
    nome = models.CharField(max_length=150)
    perfil = models.CharField(max_length=20, choices=PERFIL_CHOICES, default=USUARIO)
    area = models.ForeignKey(
        'core.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
    )
    ativo = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    data_criacao = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome']

    objects = UsuarioManager()

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        db_table = 'usuario'

    def __str__(self):
        return f'{self.nome} ({self.get_perfil_display()})'

    @property
    def is_active(self):
        return self.ativo
