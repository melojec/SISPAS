from rest_framework import serializers
from .models import Area, Diretriz, Objetivo, Meta, Atividade


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ['id', 'nome', 'sigla', 'ativa']


class DiretrizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diretriz
        fields = ['id', 'codigo', 'descricao', 'situacao', 'ano']


class AtividadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Atividade
        fields = ['id', 'meta', 'descricao', 'indicador', 'unidade', 'valor_previsto']


class MetaSerializer(serializers.ModelSerializer):
    atividades = AtividadeSerializer(many=True, read_only=True)
    area_nome = serializers.CharField(source='area.nome', read_only=True)
    objetivo_codigo = serializers.CharField(source='objetivo.codigo', read_only=True)

    class Meta:
        model = Meta
        fields = [
            'id', 'objetivo', 'objetivo_codigo', 'area', 'area_nome',
            'codigo', 'descricao', 'indicador', 'unidade',
            'previsto_ppa', 'previsto_exercicio',
            'previsto_q1', 'previsto_q2', 'previsto_q3',
            'atividades',
        ]


class ObjetivoSerializer(serializers.ModelSerializer):
    metas = MetaSerializer(many=True, read_only=True)
    diretriz_codigo = serializers.CharField(source='diretriz.codigo', read_only=True)

    class Meta:
        model = Objetivo
        fields = ['id', 'diretriz', 'diretriz_codigo', 'codigo', 'descricao', 'metas']


class DiretrizDetalheSerializer(serializers.ModelSerializer):
    objetivos = ObjetivoSerializer(many=True, read_only=True)

    class Meta:
        model = Diretriz
        fields = ['id', 'codigo', 'descricao', 'situacao', 'ano', 'objetivos']
