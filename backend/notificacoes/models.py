from django.db import models
from django.conf import settings


class Notificacao(models.Model):
    CICLO_ABERTO     = 'ciclo_aberto'
    CICLO_FECHADO    = 'ciclo_fechado'
    REGISTRO_ENVIADO = 'registro_enviado'
    VALIDADO_COORD   = 'validado_coord'
    VALIDADO_ASPLAN  = 'validado_asplan'

    TIPO_CHOICES = [
        (CICLO_ABERTO,     'Ciclo aberto'),
        (CICLO_FECHADO,    'Ciclo encerrado'),
        (REGISTRO_ENVIADO, 'Registro enviado'),
        (VALIDADO_COORD,   'Validado pelo coordenador'),
        (VALIDADO_ASPLAN,  'Validado pela ASPLAN'),
    ]

    usuario   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notificacoes')
    mensagem  = models.CharField(max_length=300)
    tipo      = models.CharField(max_length=30, choices=TIPO_CHOICES)
    lida      = models.BooleanField(default=False)
    criada_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        db_table = 'notificacao'
        ordering = ['-criada_em']

    def __str__(self):
        return f'{self.usuario} | {self.tipo}'
