from rest_framework import serializers
from core.models import Municipio
from .models import Ciclo, RegistroQuadrimestral, ExecucaoFinanceira, AnexoIndicadores, Auditoria

_INDICADORES_MUNICIPIO = {'nº de municípios beneficiados'}


def _is_municipio(indicador):
    return (indicador or '').strip().lower() in _INDICADORES_MUNICIPIO


class CicloSerializer(serializers.ModelSerializer):
    quadrimestre_display = serializers.CharField(source='get_quadrimestre_display', read_only=True)
    esta_aberto = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ciclo
        fields = [
            'id', 'ano', 'quadrimestre', 'quadrimestre_display',
            'pas_ano', 'dt_abertura', 'dt_encerramento', 'situacao', 'esta_aberto',
        ]


class RegistroQuadrimestralSerializer(serializers.ModelSerializer):
    meta_codigo = serializers.CharField(source='meta.codigo', read_only=True)
    meta_descricao = serializers.CharField(source='meta.descricao', read_only=True)
    meta_previsto = serializers.DecimalField(source='meta.previsto_exercicio', max_digits=15, decimal_places=2, read_only=True)
    meta_unidade = serializers.CharField(source='meta.unidade', read_only=True)
    meta_indicador = serializers.CharField(source='meta.indicador', read_only=True)
    ciclo_display = serializers.CharField(source='ciclo.__str__', read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True)
    municipios_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Municipio.objects.all(),
        source='municipios_beneficiados',
        required=False,
    )

    class Meta:
        model = RegistroQuadrimestral
        fields = [
            'id', 'meta', 'meta_codigo', 'meta_descricao', 'meta_previsto', 'meta_unidade', 'meta_indicador',
            'ciclo', 'ciclo_display',
            'realizado', 'municipios_ids',
            'problema', 'acao', 'analise', 'atividades_nao_realizadas',
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

    def _calc_realizado(self, municipios):
        return len(set(m.pk for m in municipios))

    def create(self, validated_data):
        municipios = validated_data.pop('municipios_beneficiados', [])
        meta = validated_data.get('meta')
        if _is_municipio(getattr(meta, 'indicador', '')):
            validated_data['realizado'] = self._calc_realizado(municipios)
        validated_data['criado_por'] = self.context['request'].user
        instance = super().create(validated_data)
        instance.municipios_beneficiados.set(municipios)
        return instance

    def update(self, instance, validated_data):
        municipios = validated_data.pop('municipios_beneficiados', None)
        if _is_municipio(instance.meta.indicador) and municipios is not None:
            validated_data['realizado'] = self._calc_realizado(municipios)
        instance = super().update(instance, validated_data)
        if municipios is not None:
            instance.municipios_beneficiados.set(municipios)
        return instance


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


class AnexoIndicadoresSerializer(serializers.ModelSerializer):
    enviado_por_nome = serializers.CharField(source='enviado_por.nome', read_only=True)

    class Meta:
        model = AnexoIndicadores
        fields = ['id', 'arquivo', 'nome_original', 'enviado_por', 'enviado_por_nome', 'enviado_em']
        read_only_fields = ['enviado_por', 'enviado_em']


class AuditoriaSerializer(serializers.ModelSerializer):
    municipio_nome = serializers.CharField(source='municipio.nome', read_only=True, default=None)
    criado_por_nome = serializers.CharField(source='criado_por.nome', read_only=True, default=None)

    class Meta:
        model = Auditoria
        fields = [
            'id', 'meta', 'ano',
            'municipio', 'municipio_nome',
            'demandante', 'orgao_responsavel', 'unidade_auditada',
            'finalidade', 'recomendacoes', 'encaminhamentos',
            'criado_por', 'criado_por_nome', 'criado_em', 'atualizado_em',
        ]
        read_only_fields = ['criado_por', 'criado_em', 'atualizado_em']

    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)
