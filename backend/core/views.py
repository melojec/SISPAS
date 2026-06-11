from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models.expressions import RawSQL
from .models import Area, Diretriz, Objetivo, Meta, Atividade
from .serializers import (
    AreaSerializer, DiretrizSerializer, DiretrizDetalheSerializer,
    ObjetivoSerializer, MetaSerializer, AtividadeSerializer,
)
from usuarios.permissions import IsASPLAN, IsUsuarioAtivo

def _nat(table):
    """Ordenação natural qualificada com nome da tabela para evitar ambiguidade em JOINs."""
    return [
        RawSQL(f"CAST(SUBSTRING_INDEX(`{table}`.`codigo`, '.', 1) AS UNSIGNED)", []),
        RawSQL(f"CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(`{table}`.`codigo`, '.', 2), '.', -1) AS UNSIGNED)", []),
        RawSQL(f"CAST(SUBSTRING_INDEX(`{table}`.`codigo`, '.', -1) AS UNSIGNED)", []),
    ]


class AreaViewSet(viewsets.ModelViewSet):
    queryset = Area.objects.filter(ativa=True).order_by('nome')
    serializer_class = AreaSerializer
    permission_classes = [IsUsuarioAtivo]
    filter_backends = [SearchFilter]
    search_fields = ['nome', 'sigla']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsASPLAN()]
        return [IsUsuarioAtivo()]


class DiretrizViewSet(viewsets.ModelViewSet):
    queryset = Diretriz.objects.order_by(*_nat('diretriz'))
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['ano', 'situacao']
    search_fields = ['codigo', 'descricao']
    permission_classes = [IsUsuarioAtivo]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DiretrizDetalheSerializer
        return DiretrizSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsASPLAN()]
        return [IsUsuarioAtivo()]


class ObjetivoViewSet(viewsets.ModelViewSet):
    queryset = Objetivo.objects.select_related('diretriz').order_by(*_nat('objetivo'))
    serializer_class = ObjetivoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['diretriz']
    search_fields = ['codigo', 'descricao']
    permission_classes = [IsUsuarioAtivo]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsASPLAN()]
        return [IsUsuarioAtivo()]


class MetaViewSet(viewsets.ModelViewSet):
    queryset = Meta.objects.select_related('objetivo', 'area').order_by(*_nat('meta'))
    serializer_class = MetaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['objetivo', 'area', 'objetivo__diretriz']
    search_fields = ['codigo', 'descricao', 'indicador']
    permission_classes = [IsUsuarioAtivo]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsASPLAN()]
        return [IsUsuarioAtivo()]


class AtividadeViewSet(viewsets.ModelViewSet):
    queryset = Atividade.objects.select_related('meta').order_by('id')
    serializer_class = AtividadeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['meta']
    permission_classes = [IsUsuarioAtivo]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsASPLAN()]
        return [IsUsuarioAtivo()]
