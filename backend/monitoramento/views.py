from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import Ciclo, RegistroQuadrimestral, ExecucaoFinanceira
from .serializers import CicloSerializer, RegistroQuadrimestralSerializer, ExecucaoFinanceiraSerializer
from usuarios.permissions import IsASPLAN, IsCoordenador, IsUsuarioAtivo, IsUsuarioDeArea
from notificacoes import services as notif


class CicloViewSet(viewsets.ModelViewSet):
    queryset = Ciclo.objects.order_by('-ano', '-quadrimestre')
    serializer_class = CicloSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ano', 'situacao']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsASPLAN()]
        return [IsUsuarioAtivo()]

    def perform_update(self, serializer):
        anterior = self.get_object().situacao
        ciclo = serializer.save()
        if anterior != ciclo.situacao:
            if ciclo.situacao == Ciclo.ABERTO:
                notif.notificar_ciclo_aberto(ciclo)
            else:
                notif.notificar_ciclo_fechado(ciclo)

    @action(detail=False, methods=['get'])
    def atual(self, request):
        ciclo = Ciclo.objects.filter(situacao=Ciclo.ABERTO).order_by('-ano', '-quadrimestre').first()
        if not ciclo:
            return Response({'detail': 'Nenhum ciclo aberto.'}, status=404)
        return Response(CicloSerializer(ciclo).data)


class RegistroQuadrimestralViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroQuadrimestralSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['ciclo', 'meta', 'meta__area', 'validado_coord', 'validado_asplan']
    permission_classes = [IsUsuarioAtivo, IsUsuarioDeArea]

    def get_queryset(self):
        user = self.request.user
        qs = RegistroQuadrimestral.objects.select_related(
            'meta', 'meta__area', 'ciclo', 'criado_por'
        )
        from usuarios.models import Usuario
        if user.perfil in (Usuario.ADMINISTRADOR, Usuario.ASPLAN):
            return qs
        return qs.filter(meta__area=user.area)

    def perform_create(self, serializer):
        registro = serializer.save(criado_por=self.request.user)
        notif.notificar_registro_enviado(registro)

    @action(detail=True, methods=['patch'], permission_classes=[IsCoordenador])
    def validar_coord(self, request, pk=None):
        registro = self.get_object()
        registro.validado_coord = True
        registro.save(update_fields=['validado_coord'])
        notif.notificar_validado_coord(registro)
        return Response({'status': 'validado pelo coordenador'})

    @action(detail=True, methods=['patch'], permission_classes=[IsASPLAN])
    def validar_asplan(self, request, pk=None):
        registro = self.get_object()
        registro.validado_asplan = True
        registro.save(update_fields=['validado_asplan'])
        notif.notificar_validado_asplan(registro)
        return Response({'status': 'validado pela ASPLAN'})


class ExecucaoFinanceiraViewSet(viewsets.ModelViewSet):
    queryset = ExecucaoFinanceira.objects.select_related('atividade', 'ciclo')
    serializer_class = ExecucaoFinanceiraSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ciclo', 'atividade', 'atividade__meta', 'ciclo__ano']
    permission_classes = [IsUsuarioAtivo]
