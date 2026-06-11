import pytest
from datetime import date
from monitoramento.models import Ciclo, RegistroQuadrimestral, ExecucaoFinanceira
from core.models import Area, Diretriz, Objetivo, Meta, Atividade
from conftest import auth


@pytest.fixture
def diretriz(db):
    return Diretriz.objects.create(codigo='1', descricao='Diretriz', ano=2026)


@pytest.fixture
def objetivo(db, diretriz):
    return Objetivo.objects.create(diretriz=diretriz, codigo='1.1', descricao='Objetivo')


@pytest.fixture
def meta(db, objetivo, area):
    return Meta.objects.create(
        objetivo=objetivo, area=area, codigo='1.1.1',
        descricao='Meta', previsto_exercicio=100,
        previsto_ppa=0, previsto_q1=0, previsto_q2=0, previsto_q3=0,
    )


@pytest.fixture
def atividade(db, meta):
    return Atividade.objects.create(meta=meta, descricao='Atividade', valor_previsto=50)


@pytest.fixture
def ciclo_aberto(db):
    return Ciclo.objects.create(
        ano=2026, quadrimestre=Ciclo.Q2,
        dt_abertura=date(2026, 5, 1),
        dt_encerramento=date(2026, 8, 31),
        situacao=Ciclo.ABERTO,
    )


@pytest.fixture
def ciclo_fechado(db):
    return Ciclo.objects.create(
        ano=2026, quadrimestre=Ciclo.Q1,
        dt_abertura=date(2026, 1, 1),
        dt_encerramento=date(2026, 4, 30),
        situacao=Ciclo.FECHADO,
    )


@pytest.fixture
def registro(db, meta, ciclo_aberto, usuario):
    return RegistroQuadrimestral.objects.create(
        meta=meta, ciclo=ciclo_aberto,
        realizado=50, criado_por=usuario,
    )


# ── Ciclo ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCicloModel:
    def test_esta_aberto(self, ciclo_aberto):
        assert ciclo_aberto.esta_aberto is True

    def test_esta_fechado(self, ciclo_fechado):
        assert ciclo_fechado.esta_aberto is False

    def test_unique_together(self, ciclo_aberto):
        with pytest.raises(Exception):
            Ciclo.objects.create(
                ano=2026, quadrimestre=Ciclo.Q2,
                dt_abertura=date(2026, 5, 1),
                dt_encerramento=date(2026, 8, 31),
            )


@pytest.mark.django_db
class TestCicloAPI:
    def test_lista_ciclos(self, api, usuario, ciclo_aberto):
        auth(api, usuario)
        r = api.get('/api/ciclos/')
        assert r.status_code == 200

    def test_asplan_cria_ciclo(self, api, asplan):
        auth(api, asplan)
        r = api.post('/api/ciclos/', {
            'ano': 2027, 'quadrimestre': Ciclo.Q1,
            'dt_abertura': '2027-01-01',
            'dt_encerramento': '2027-04-30',
            'situacao': Ciclo.ABERTO,
        })
        assert r.status_code == 201

    def test_usuario_nao_cria_ciclo(self, api, usuario):
        auth(api, usuario)
        r = api.post('/api/ciclos/', {
            'ano': 2028, 'quadrimestre': Ciclo.Q1,
            'dt_abertura': '2028-01-01',
            'dt_encerramento': '2028-04-30',
        })
        assert r.status_code == 403

    def test_ciclo_atual(self, api, usuario, ciclo_aberto):
        auth(api, usuario)
        r = api.get('/api/ciclos/atual/')
        assert r.status_code == 200
        assert r.data['situacao'] == Ciclo.ABERTO

    def test_ciclo_atual_sem_aberto(self, api, usuario, ciclo_fechado):
        auth(api, usuario)
        r = api.get('/api/ciclos/atual/')
        assert r.status_code == 404

    def test_asplan_fecha_ciclo(self, api, asplan, ciclo_aberto):
        auth(api, asplan)
        r = api.patch(f'/api/ciclos/{ciclo_aberto.id}/', {'situacao': Ciclo.FECHADO})
        assert r.status_code == 200
        ciclo_aberto.refresh_from_db()
        assert ciclo_aberto.situacao == Ciclo.FECHADO


# ── RegistroQuadrimestral ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRegistroModel:
    def test_unique_together(self, registro, meta, ciclo_aberto, usuario):
        with pytest.raises(Exception):
            RegistroQuadrimestral.objects.create(
                meta=meta, ciclo=ciclo_aberto, realizado=10, criado_por=usuario
            )

    def test_str(self, registro):
        assert str(registro) != ''


@pytest.mark.django_db
class TestRegistroAPI:
    def test_usuario_cria_registro(self, api, usuario, meta, ciclo_aberto):
        auth(api, usuario)
        r = api.post('/api/registros/', {
            'meta': meta.id,
            'ciclo': ciclo_aberto.id,
            'realizado': '75.00',
            'problema': '',
            'acao': '',
            'analise': '',
        })
        assert r.status_code == 201
        assert r.data['criado_por'] == usuario.id

    def test_usuario_ve_apenas_propria_area(self, api, db, area, objetivo, ciclo_aberto, usuario):
        area2 = Area.objects.create(nome='Outra Área', sigla='OUT')
        meta2 = Meta.objects.create(
            objetivo=objetivo, area=area2, codigo='1.1.9',
            descricao='Meta outra área', previsto_exercicio=0,
            previsto_ppa=0, previsto_q1=0, previsto_q2=0, previsto_q3=0,
        )
        RegistroQuadrimestral.objects.create(meta=meta2, ciclo=ciclo_aberto, realizado=10, criado_por=usuario)
        auth(api, usuario)
        r = api.get('/api/registros/')
        assert r.status_code == 200
        ids_areas = [reg['meta'] for reg in r.data['results']]
        # usuario só vê registros da própria área
        for reg_id in ids_areas:
            m = Meta.objects.get(id=reg_id)
            assert m.area_id == usuario.area_id

    def test_asplan_ve_todos_registros(self, api, asplan, db, objetivo, ciclo_aberto, usuario):
        area2 = Area.objects.create(nome='Outra B', sigla='OTB')
        meta2 = Meta.objects.create(
            objetivo=objetivo, area=area2, codigo='1.1.8',
            descricao='Meta B', previsto_exercicio=0,
            previsto_ppa=0, previsto_q1=0, previsto_q2=0, previsto_q3=0,
        )
        RegistroQuadrimestral.objects.create(meta=meta2, ciclo=ciclo_aberto, realizado=5, criado_por=usuario)
        auth(api, asplan)
        r = api.get('/api/registros/')
        assert r.status_code == 200
        assert r.data['count'] >= 1

    def test_anonimo_nao_acessa_registros(self, api):
        r = api.get('/api/registros/')
        assert r.status_code == 401


@pytest.mark.django_db
class TestValidacoes:
    def test_coordenador_valida_registro(self, api, coordenador, registro):
        auth(api, coordenador)
        r = api.patch(f'/api/registros/{registro.id}/validar_coord/')
        assert r.status_code == 200
        registro.refresh_from_db()
        assert registro.validado_coord is True

    def test_usuario_nao_valida_coord(self, api, usuario, registro):
        auth(api, usuario)
        r = api.patch(f'/api/registros/{registro.id}/validar_coord/')
        assert r.status_code == 403

    def test_asplan_valida_registro(self, api, asplan, registro):
        auth(api, asplan)
        r = api.patch(f'/api/registros/{registro.id}/validar_asplan/')
        assert r.status_code == 200
        registro.refresh_from_db()
        assert registro.validado_asplan is True

    def test_coordenador_nao_valida_asplan(self, api, coordenador, registro):
        auth(api, coordenador)
        r = api.patch(f'/api/registros/{registro.id}/validar_asplan/')
        assert r.status_code == 403

    def test_usuario_nao_valida_asplan(self, api, usuario, registro):
        auth(api, usuario)
        r = api.patch(f'/api/registros/{registro.id}/validar_asplan/')
        assert r.status_code == 403


# ── ExecucaoFinanceira ───────────────────────────────────────────────────────

@pytest.mark.django_db
class TestExecucaoFinanceiraAPI:
    def test_usuario_cria_execucao(self, api, usuario, atividade, ciclo_aberto):
        auth(api, usuario)
        r = api.post('/api/execucoes/', {
            'atividade': atividade.id,
            'ciclo': ciclo_aberto.id,
            'valor_realizado': '1000.00',
        })
        assert r.status_code == 201

    def test_lista_execucoes(self, api, usuario, atividade, ciclo_aberto):
        ExecucaoFinanceira.objects.create(
            atividade=atividade, ciclo=ciclo_aberto, valor_realizado=500
        )
        auth(api, usuario)
        r = api.get('/api/execucoes/')
        assert r.status_code == 200
        assert r.data['count'] >= 1

    def test_anonimo_nao_acessa_execucoes(self, api):
        r = api.get('/api/execucoes/')
        assert r.status_code == 401
