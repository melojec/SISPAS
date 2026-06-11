from rest_framework import viewsets, mixins
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import LogAuditoria
from .serializers import LogAuditoriaSerializer
from usuarios.permissions import IsASPLAN


class LogAuditoriaViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = LogAuditoria.objects.select_related('usuario').order_by('-data_hora')
    serializer_class = LogAuditoriaSerializer
    permission_classes = [IsASPLAN]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['acao', 'modulo', 'usuario']
