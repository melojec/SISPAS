from django.db import models


class Area(models.Model):
    nome = models.CharField(max_length=200)
    sigla = models.CharField(max_length=20, unique=True)
    ativa = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Área'
        verbose_name_plural = 'Áreas'
        db_table = 'area'
        ordering = ['nome']

    def __str__(self):
        return f'{self.sigla} — {self.nome}'


class Diretriz(models.Model):
    codigo = models.CharField(max_length=20)
    descricao = models.TextField()
    situacao = models.BooleanField(default=True)
    ano = models.PositiveSmallIntegerField()

    class Meta:
        verbose_name = 'Diretriz'
        verbose_name_plural = 'Diretrizes'
        db_table = 'diretriz'
        ordering = ['codigo']

    def __str__(self):
        return f'{self.codigo} — {self.descricao[:60]}'


class Objetivo(models.Model):
    diretriz = models.ForeignKey(Diretriz, on_delete=models.CASCADE, related_name='objetivos')
    codigo = models.CharField(max_length=20)
    descricao = models.TextField()

    class Meta:
        verbose_name = 'Objetivo'
        verbose_name_plural = 'Objetivos'
        db_table = 'objetivo'
        ordering = ['codigo']

    def __str__(self):
        return f'{self.codigo} — {self.descricao[:60]}'


class Meta(models.Model):
    objetivo = models.ForeignKey(Objetivo, on_delete=models.CASCADE, related_name='metas')
    area = models.ForeignKey(Area, on_delete=models.PROTECT, related_name='metas')
    codigo = models.CharField(max_length=20)
    descricao = models.TextField()
    indicador = models.TextField(blank=True)
    unidade = models.CharField(max_length=50, blank=True)
    previsto_ppa = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    previsto_exercicio = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    previsto_q1 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    previsto_q2 = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    previsto_q3 = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Meta'
        verbose_name_plural = 'Metas'
        db_table = 'meta'
        ordering = ['codigo']

    def __str__(self):
        return f'{self.codigo} — {self.descricao[:60]}'


class Atividade(models.Model):
    meta = models.ForeignKey(Meta, on_delete=models.CASCADE, related_name='atividades')
    descricao = models.TextField()
    indicador = models.TextField(blank=True)
    unidade = models.CharField(max_length=50, blank=True)
    valor_previsto = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Indicador'
        verbose_name_plural = 'Indicadores'
        db_table = 'atividade'

    def __str__(self):
        return self.descricao[:80]
