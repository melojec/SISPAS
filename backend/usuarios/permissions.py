from rest_framework.permissions import BasePermission
from .models import Usuario


class IsAdministrador(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.perfil == Usuario.ADMINISTRADOR


class IsASPLAN(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.perfil in (
            Usuario.ADMINISTRADOR, Usuario.ASPLAN
        )


class IsCoordenador(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.perfil in (
            Usuario.ADMINISTRADOR, Usuario.ASPLAN, Usuario.COORDENADOR
        )


class IsUsuarioAtivo(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.ativo


class IsUsuarioDeArea(BasePermission):
    """Permite acesso apenas a registros da própria área do usuário (exceto ASPLAN/Admin)."""
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.perfil in (Usuario.ADMINISTRADOR, Usuario.ASPLAN):
            return True
        meta_area = getattr(getattr(obj, 'meta', None), 'area_id', None)
        return meta_area is None or meta_area == user.area_id
