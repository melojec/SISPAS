from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from usuarios.permissions import IsUsuarioAtivo
from .models import Notificacao
from .serializers import NotificacaoSerializer


class NotificacaoViewSet(
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificacaoSerializer
    permission_classes = [IsUsuarioAtivo]

    def get_queryset(self):
        return Notificacao.objects.filter(usuario=self.request.user)[:50]

    @action(detail=False, methods=['post'])
    def marcar_todas_lidas(self, request):
        Notificacao.objects.filter(usuario=request.user).delete()
        return Response({'status': 'ok'})
