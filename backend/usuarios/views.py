from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Usuario
from .serializers import UsuarioSerializer, UsuarioCreateSerializer, UsuarioMeSerializer
from .permissions import IsAdministrador


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related('area').order_by('nome')
    permission_classes = [IsAdministrador]

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = UsuarioMeSerializer(request.user)
        return Response(serializer.data)
