import pytest
from core.models import Area, Diretriz, Objetivo, Meta, Atividade
from conftest import auth


@pytest.fixture
def diretriz(db):
    return Diretriz.objects.create(codigo='1', descricao='Diretriz Teste', ano=2026)


@pytest.fixture
def objetivo(db, diretriz):
    return Objetivo.objects.create(diretriz=diretriz, codigo='1.1', descricao='Objetivo Teste')


@pytest.fixture
def meta(db, objetivo, area):
    return Meta.objects.create(
        objetivo=objetivo,
        area=area,
        codigo='1.1.1',
        descricao='Meta Teste',
        previsto_exercicio=100,
    )


@pytest.fixture
def atividade(db, meta):
    return Atividade.objects.create(meta=meta, descricao='Atividade Teste', valor_previsto=50)


@pytest.mark.django_db
class TestCoreModels:
    def test_area_str(self, area):
        assert 'ATBAS' in str(area)

    def test_diretriz_str(self, diretriz):
        assert '1' in str(diretriz)

    def test_objetivo_fk_diretriz(self, objetivo, diretriz):
        assert objetivo.diretriz == diretriz

    def test_meta_fk_objetivo_e_area(self, meta, objetivo, area):
        assert meta.objetivo == objetivo
        assert meta.area == area

    def test_atividade_fk_meta(self, atividade, meta):
        assert atividade.meta == meta


@pytest.mark.django_db
class TestAreaAPI:
    def test_lista_areas(self, api, usuario):
        auth(api, usuario)
        r = api.get('/api/areas/')
        assert r.status_code == 200

    def test_anonimo_nao_lista_areas(self, api):
        r = api.get('/api/areas/')
        assert r.status_code == 401

    def test_admin_cria_area(self, api, admin):
        auth(api, admin)
        r = api.post('/api/areas/', {'nome': 'Vigilância', 'sigla': 'VIG'})
        assert r.status_code == 201

    def test_usuario_nao_cria_area(self, api, usuario):
        auth(api, usuario)
        r = api.post('/api/areas/', {'nome': 'Vigilância', 'sigla': 'VIG2'})
        assert r.status_code == 403


@pytest.mark.django_db
class TestDiretrizAPI:
    def test_lista_diretrizes(self, api, usuario, diretriz):
        auth(api, usuario)
        r = api.get('/api/diretrizes/')
        assert r.status_code == 200
        assert r.data['count'] >= 1

    def test_asplan_cria_diretriz(self, api, asplan):
        auth(api, asplan)
        r = api.post('/api/diretrizes/', {
            'codigo': '2', 'descricao': 'Nova Diretriz', 'ano': 2026, 'situacao': True
        })
        assert r.status_code == 201

    def test_usuario_nao_cria_diretriz(self, api, usuario):
        auth(api, usuario)
        r = api.post('/api/diretrizes/', {
            'codigo': '3', 'descricao': 'Diretriz Bloqueada', 'ano': 2026, 'situacao': True
        })
        assert r.status_code == 403


@pytest.mark.django_db
class TestMetaAPI:
    def test_lista_metas(self, api, usuario, meta):
        auth(api, usuario)
        r = api.get('/api/metas/')
        assert r.status_code == 200

    def test_detalhe_meta(self, api, usuario, meta):
        auth(api, usuario)
        r = api.get(f'/api/metas/{meta.id}/')
        assert r.status_code == 200
        assert r.data['codigo'] == '1.1.1'

    def test_asplan_cria_meta(self, api, asplan, objetivo, area):
        auth(api, asplan)
        r = api.post('/api/metas/', {
            'objetivo': objetivo.id,
            'area': area.id,
            'codigo': '1.1.2',
            'descricao': 'Meta Nova',
            'previsto_exercicio': '200.00',
            'previsto_ppa': '0.00',
            'previsto_q1': '0.00',
            'previsto_q2': '0.00',
            'previsto_q3': '0.00',
        })
        assert r.status_code == 201

    def test_usuario_nao_cria_meta(self, api, usuario, objetivo, area):
        auth(api, usuario)
        r = api.post('/api/metas/', {
            'objetivo': objetivo.id,
            'area': area.id,
            'codigo': '1.1.3',
            'descricao': 'Meta Bloqueada',
            'previsto_exercicio': '100.00',
            'previsto_ppa': '0.00',
            'previsto_q1': '0.00',
            'previsto_q2': '0.00',
            'previsto_q3': '0.00',
        })
        assert r.status_code == 403
