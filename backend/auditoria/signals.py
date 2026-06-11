import json
from datetime import date, datetime
from decimal import Decimal
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.forms.models import model_to_dict
from .models import LogAuditoria
from .middleware import get_current_user, get_current_ip


def _usuario_autenticado():
    user = get_current_user()
    if user is None:
        return None
    from django.contrib.auth.models import AnonymousUser
    if isinstance(user, AnonymousUser) or not getattr(user, 'pk', None):
        return None
    return user


class _Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return str(obj)

MODULOS_AUDITADOS = [
    'core.Diretriz', 'core.Objetivo', 'core.Meta', 'core.Atividade',
    'monitoramento.Ciclo', 'monitoramento.RegistroQuadrimestral',
    'monitoramento.ExecucaoFinanceira',
    'usuarios.Usuario',
]


def _label(instance):
    return f'{instance._meta.app_label}.{instance.__class__.__name__}'


def _serializar(instance):
    try:
        raw = model_to_dict(instance)
        return json.loads(json.dumps(raw, cls=_Encoder))
    except Exception:
        return {}


@receiver(post_save)
def registrar_save(sender, instance, created, **kwargs):
    label = _label(instance)
    if label not in MODULOS_AUDITADOS:
        return
    LogAuditoria.objects.create(
        usuario=_usuario_autenticado(),
        acao=LogAuditoria.CRIACAO if created else LogAuditoria.EDICAO,
        modulo=label,
        objeto_id=instance.pk,
        dados_depois=_serializar(instance),
        ip=get_current_ip(),
    )


@receiver(post_delete)
def registrar_delete(sender, instance, **kwargs):
    label = _label(instance)
    if label not in MODULOS_AUDITADOS:
        return
    LogAuditoria.objects.create(
        usuario=_usuario_autenticado(),
        acao=LogAuditoria.EXCLUSAO,
        modulo=label,
        objeto_id=instance.pk,
        dados_antes=_serializar(instance),
        ip=get_current_ip(),
    )
