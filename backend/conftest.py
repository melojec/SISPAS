import pytest
from rest_framework.test import APIClient
from usuarios.models import Usuario
from core.models import Area


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def area(db):
    return Area.objects.create(nome='Atenção Básica', sigla='ATBAS')


def _make_user(db, perfil, area=None, email=None):
    email = email or f'{perfil}@sespas.test'
    u = Usuario.objects.create_user(email=email, nome=perfil.title(), password='senha123', perfil=perfil)
    if area:
        u.area = area
        u.save()
    return u


@pytest.fixture
def admin(db, area):
    return _make_user(db, Usuario.ADMINISTRADOR, area)


@pytest.fixture
def asplan(db, area):
    return _make_user(db, Usuario.ASPLAN, area)


@pytest.fixture
def coordenador(db, area):
    return _make_user(db, Usuario.COORDENADOR, area)


@pytest.fixture
def usuario(db, area):
    return _make_user(db, Usuario.USUARIO, area)


@pytest.fixture
def visualizador(db, area):
    return _make_user(db, Usuario.VISUALIZADOR, area)


def auth(api, user):
    api.force_authenticate(user=user)
    return api
