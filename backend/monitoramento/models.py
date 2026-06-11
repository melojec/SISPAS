from django.db import models
from django.conf import settings


class Ciclo(models.Model):
    ABERTO = 'aberto'
    FECHADO = 'fechado'
    SITUACAO_CHOICES = [
        (ABERTO, 'Aberto'),
        (FECHADO, 'Fechado'),
    ]

    Q1 = 1
    Q2 = 2
    Q3 = 3
    QUADRIMESTRE_CHOICES = [
        (Q1, '1º Quadrimestre (Jan–Abr)'),
        (Q2, '2º Quadrimestre (Mai–Ago)'),
        (Q3, '3º Quadrimestre (Set–Dez)'),
    ]

    ano = models.PositiveSmallIntegerField()
    quadrimestre = models.PositiveSmallIntegerField(choices=QUADRIMESTRE_CHOICES)
    dt_abertura = models.DateField()
    dt_encerramento = models.DateField()
    situacao = models.CharField(max_length=10, choices=SITUACAO_CHOICES, default=ABERTO)

    class Meta:
        verbose_name = 'Ciclo'
        verbose_name_plural = 'Ciclos'
        db_table = 'ciclo'
        unique_together = ('ano', 'quadrimestre')
        ordering = ['-ano', '-quadrimestre']

    def __str__(self):
        return f'{self.ano} — {self.get_quadrimestre_display()}'

    @property
    def esta_aberto(self):
        return self.situacao == self.ABERTO


class RegistroQuadrimestral(models.Model):
    meta = models.ForeignKey('core.Meta', on_delete=models.CASCADE, related_name='registros')
    ciclo = models.ForeignKey(Ciclo, on_delete=models.PROTECT, related_name='registros')
    realizado = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    problema = models.TextField(blank=True)
    acao = models.TextField(blank=True)
    analise = models.TextField(blank=True)
    validado_coord = models.BooleanField(default=False)
    validado_asplan = models.BooleanField(default=False)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='registros_criados',
    )
    atualizado_em = models.DateTimeField(auto_now=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Registro Quadrimestral'
        verbose_name_plural = 'Registros Quadrimestrais'
        db_table = 'registro_quad'
        unique_together = ('meta', 'ciclo')
        ordering = ['-ciclo__ano', '-ciclo__quadrimestre']

    def __str__(self):
        return f'{self.meta} | {self.ciclo}'


class ExecucaoFinanceira(models.Model):
    atividade = models.ForeignKey('core.Atividade', on_delete=models.CASCADE, related_name='execucoes')
    ciclo = models.ForeignKey(Ciclo, on_delete=models.PROTECT, related_name='execucoes')
    valor_realizado = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Execução Financeira'
        verbose_name_plural = 'Execuções Financeiras'
        db_table = 'execucao_financeira'
        unique_together = ('atividade', 'ciclo')

    def __str__(self):
        return f'{self.atividade} | {self.ciclo}'
