from rest_framework import serializers
from .models import Ciclo, RegistroQuadrimestral, ExecucaoFinanceira


class CicloSerializer(serializers.ModelSerializer):
    quadrimestre_display = serializers.CharField(source='get_quadrimestre_display', read_only=True)
    esta_aberto = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ciclo
        fields = [
            'id', 'ano', 'quadrimestre', 'quadrimestre_display',
            'dt_abertura', 'dt_encerramento', 'situacao', 'esta_aberto',
        ]


class RegistroQuadrimestralSerializer(serializers.ModelSerializer):
    meta_codigo = serializers.CharField(source='meta.codigo', read_only=True)
    meta_descricao = serializers.CharField(source='meta.descricao', read_only=True)
    meta_previsto = serializers.DecimalField(source='meta.previsto_exercicio', max_digits=15, decimal_places=2, read_only=True)
    meta_unidade = serializers.CharField(source='meta.unidade', read_only=True)
    ciclo_display = serializers.CharField(source='ciclo.__str__', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)

    class Meta:
        model = RegistroQuadrimestral
        fields = [
            'id', 'meta', 'meta_codigo', 'meta_descricao', 'meta_previsto', 'meta_unidade',
            'ciclo', 'ciclo_display',
            'realizado', 'problema', 'acao', 'analise',
            'validado_coord', 'validado_asplan',
            'criado_por', 'criado_por_nome',
            'criado_em', 'atualizado_em',
        ]
        read_only_fields = ['criado_por', 'criado_em', 'atualizado_em', 'validado_asplan']

    def validate(self, data):
        ciclo = data.get('ciclo') or (self.instance.ciclo if self.instance else None)
        if ciclo and not ciclo.esta_aberto:
            raise serializers.ValidationError('Não é possível registrar dados em um ciclo fechado.')
        return data

    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)


class ExecucaoFinanceiraSerializer(serializers.ModelSerializer):
    atividade_descricao = serializers.CharField(source='atividade.descricao', read_only=True)
    ciclo_display = serializers.CharField(source='ciclo.__str__', read_only=True)

    class Meta:
        model = ExecucaoFinanceira
        fields = [
            'id', 'atividade', 'atividade_descricao',
            'ciclo', 'ciclo_display',
            'valor_realizado', 'atualizado_em',
        ]
        read_only_fields = ['atualizado_em']
