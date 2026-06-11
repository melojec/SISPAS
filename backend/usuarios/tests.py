import pytest
from usuarios.models import Usuario
from conftest import auth


@pytest.mark.django_db
class TestUsuarioModel:
    def test_create_user(self, area):
        u = Usuario.objects.create_user(
            email='teste@sespas.ma.gov.br',
            nome='Teste',
            password='senha123',
            perfil=Usuario.USUARIO,
            area=area,
        )
        assert u.email == 'teste@sespas.ma.gov.br'
        assert u.check_password('senha123')
        assert u.is_active is True
        assert u.perfil == Usuario.USUARIO

    def test_usuario_inativo(self, area):
        u = Usuario.objects.create_user(
            email='inativo@sespas.ma.gov.br', nome='Inativo', password='senha123'
        )
        u.ativo = False
        u.save()
        assert u.is_active is False

    def test_create_superuser(self):
        u = Usuario.objects.create_superuser(
            email='super@sespas.ma.gov.br', nome='Super', password='senha123'
        )
        assert u.perfil == Usuario.ADMINISTRADOR
        assert u.is_staff is True
        assert u.is_superuser is True

    def test_email_obrigatorio(self):
        with pytest.raises(ValueError):
            Usuario.objects.create_user(email='', nome='X', password='123')


@pytest.mark.django_db
class TestPermissoesUsuario:
    def test_admin_acessa_lista(self, api, admin):
        auth(api, admin)
        r = api.get('/api/usuarios/')
        assert r.status_code == 200

    def test_usuario_nao_acessa_lista(self, api, usuario):
        auth(api, usuario)
        r = api.get('/api/usuarios/')
        assert r.status_code == 403

    def test_visualizador_nao_acessa_lista(self, api, visualizador):
        auth(api, visualizador)
        r = api.get('/api/usuarios/')
        assert r.status_code == 403

    def test_anonimo_nao_acessa(self, api):
        r = api.get('/api/usuarios/')
        assert r.status_code == 401

    def test_admin_cria_usuario(self, api, admin, area):
        auth(api, admin)
        r = api.post('/api/usuarios/', {
            'email': 'novo@sespas.ma.gov.br',
            'nome': 'Novo',
            'password': 'senha123',
            'perfil': Usuario.USUARIO,
            'area': area.id,
        })
        assert r.status_code == 201

    def test_asplan_nao_cria_usuario(self, api, asplan, area):
        auth(api, asplan)
        r = api.post('/api/usuarios/', {
            'email': 'novo2@sespas.ma.gov.br',
            'nome': 'Novo2',
            'password': 'senha123',
            'perfil': Usuario.USUARIO,
            'area': area.id,
        })
        assert r.status_code == 403


@pytest.mark.django_db
class TestJWT:
    def test_login_retorna_tokens(self, api, usuario):
        r = api.post('/api/token/', {'email': usuario.email, 'password': 'senha123'})
        assert r.status_code == 200
        assert 'access' in r.data
        assert 'refresh' in r.data

    def test_login_senha_errada(self, api, usuario):
        r = api.post('/api/token/', {'email': usuario.email, 'password': 'errada'})
        assert r.status_code == 401

    def test_refresh_token(self, api, usuario):
        r = api.post('/api/token/', {'email': usuario.email, 'password': 'senha123'})
        r2 = api.post('/api/token/refresh/', {'refresh': r.data['refresh']})
        assert r2.status_code == 200
        assert 'access' in r2.data

    def test_usuario_inativo_nao_loga(self, api, usuario):
        usuario.ativo = False
        usuario.save()
        r = api.post('/api/token/', {'email': usuario.email, 'password': 'senha123'})
        assert r.status_code == 401
