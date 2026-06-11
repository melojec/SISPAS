from django.db import models
from django.conf import settings


class LogAuditoria(models.Model):
    CRIACAO = 'criacao'
    EDICAO = 'edicao'
    EXCLUSAO = 'exclusao'
    ACAO_CHOICES = [
        (CRIACAO, 'Criação'),
        (EDICAO, 'Edição'),
        (EXCLUSAO, 'Exclusão'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='logs',
    )
    acao = models.CharField(max_length=10, choices=ACAO_CHOICES)
    modulo = models.CharField(max_length=100)
    objeto_id = models.PositiveIntegerField(null=True, blank=True)
    dados_antes = models.JSONField(null=True, blank=True)
    dados_depois = models.JSONField(null=True, blank=True)
    data_hora = models.DateTimeField(auto_now_add=True)
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        verbose_name = 'Log de Auditoria'
        verbose_name_plural = 'Logs de Auditoria'
        db_table = 'log_auditoria'
        ordering = ['-data_hora']

    def __str__(self):
        return f'[{self.data_hora:%d/%m/%Y %H:%M}] {self.get_acao_display()} em {self.modulo} (id={self.objeto_id})'
