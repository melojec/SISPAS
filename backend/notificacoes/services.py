from .models import Notificacao


def _criar_para(usuarios_qs, mensagem, tipo):
    Notificacao.objects.bulk_create([
        Notificacao(usuario=u, mensagem=mensagem, tipo=tipo)
        for u in usuarios_qs
    ])


def notificar_ciclo_aberto(ciclo):
    from usuarios.models import Usuario
    _criar_para(
        Usuario.objects.filter(ativo=True),
        f'Ciclo {ciclo} foi aberto para preenchimento.',
        Notificacao.CICLO_ABERTO,
    )


def notificar_ciclo_fechado(ciclo):
    from usuarios.models import Usuario
    _criar_para(
        Usuario.objects.filter(ativo=True),
        f'Ciclo {ciclo} foi encerrado.',
        Notificacao.CICLO_FECHADO,
    )


def notificar_registro_enviado(registro):
    from usuarios.models import Usuario
    coordenadores = Usuario.objects.filter(
        ativo=True, perfil=Usuario.COORDENADOR, area=registro.meta.area
    )
    _criar_para(
        coordenadores,
        f'Meta {registro.meta.codigo} tem novo registro aguardando validação.',
        Notificacao.REGISTRO_ENVIADO,
    )


def notificar_validado_coord(registro):
    from usuarios.models import Usuario
    _criar_para(
        Usuario.objects.filter(ativo=True, perfil=Usuario.ASPLAN),
        f'Meta {registro.meta.codigo} validada pelo coordenador — aguarda validação ASPLAN.',
        Notificacao.VALIDADO_COORD,
    )


def notificar_validado_asplan(registro):
    if registro.criado_por:
        Notificacao.objects.create(
            usuario=registro.criado_por,
            mensagem=f'Seu registro da meta {registro.meta.codigo} foi validado pela ASPLAN.',
            tipo=Notificacao.VALIDADO_ASPLAN,
        )
