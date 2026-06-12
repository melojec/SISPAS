        # SISPAS — Contexto do projeto

## O que é
Sistema de acompanhamento do PAS (Programação Anual de Saúde) da SES-MA.
Substitui planilhas eletrônicas no registro/acompanhamento quadrimestral de metas e atividades.

## Stack
- Backend: Django 5 + Django REST Framework + SimpleJWT
- Frontend: React 18 + Vite + TailwindCSS + Zustand + React Query + Axios
- Banco: MariaDB 10.6
- Deploy: Nginx + Gunicorn + Supervisor (Ubuntu Server 22.04)
- PDF: xhtml2pdf (WeasyPrint rejeitado — sem GTK no Windows) | XLSX: openpyxl

## Repositório
- GitHub: https://github.com/melojec/SISPAS
- Superuser local: admin@admin.com

## Estrutura do backend (sispas/backend/)
- `config/` — settings, urls, wsgi/asgi
- `core/` — Area, Diretriz, Objetivo, Meta, Atividade
- `monitoramento/` — Ciclo, RegistroQuadrimestral, ExecucaoFinanceira
- `usuarios/` — Usuario customizado (AbstractBaseUser), 5 perfis
- `auditoria/` — LogAuditoria + AuditoriaMiddleware
- `relatorios/` — exportação PDF (WeasyPrint) e XLSX (openpyxl)
- `importar_pas.py` — script usado para importar dados da planilha Base PAS.xlsx

## Perfis de usuário
Administrador > ASPLAN > Coordenador > Usuário > Visualizador

## Estrutura do frontend (sispas/frontend/src/)
- `pages/` — Login, Dashboard, DOMI, Ciclos, Usuarios, Auditoria, Relatorios
- `components/` — Layout, Sidebar, ProtectedRoute
- `services/api.js` — cliente axios com interceptors JWT
- `store/authStore.js` — Zustand com fetchMe/login/logout

## Módulo DOMI (principal)
Navegação em 3 colunas: Diretrizes → Objetivos → Metas.
Modal da meta: indicador, valores planejados (PES 4 anos + PAS ano corrente), realizado por quadrimestre
(Q1/Q2/Q3 — apenas o quadrimestre do ciclo ativo é editável), registro qualitativo (problemas, ações,
análise), status de validação. Edição bloqueada após validação ASPLAN ou ciclo fechado.
Botão "Salvar em PDF" no header do modal exporta ficha individual da meta via blob download (JWT).

---

## Progresso por etapa (Plano de Desenvolvimento)

### ETAPA 1 — Configuração do ambiente local ✅ COMPLETA
- [x] Git init + .gitignore
- [x] Venv Python criado em sispas/backend/
- [x] Dependências Django instaladas (requirements.txt)
- [x] Projeto Django + apps criados (core, monitoramento, usuarios, auditoria, relatorios)
- [x] Banco local MariaDB configurado (sispas_dev)
- [x] settings.py completo (banco, JWT, CORS, DRF, .env)

### ETAPA 2 — Backend: modelos e API ✅ COMPLETA
- [x] Models: Diretriz, Objetivo, Meta, Atividade (core)
- [x] Models: Ciclo, RegistroQuadrimestral, ExecucaoFinanceira (monitoramento)
- [x] Models: Usuario customizado (AbstractBaseUser), LogAuditoria
- [x] Migrations geradas e aplicadas
- [x] Serializers para todos os models
- [x] ViewSets + DefaultRouter (CRUD completo)
- [x] Autenticação JWT (endpoints /api/token/ e /api/token/refresh/)
- [x] Permissões por perfil: IsASPLAN, IsCoordenador, IsUsuarioDeArea, IsUsuarioAtivo
- [x] Endpoints de exportação PDF (xhtml2pdf) e XLSX (openpyxl)
- [x] Endpoint de exportação PDF por meta individual (MetaPDFView — `GET /api/relatorios/meta/<id>/pdf/?ciclo=<id>`)
- [x] Auditoria via AuditoriaMiddleware (LogAuditoria)
- [x] Banco populado com dados reais (Base PAS.xlsx via importar_pas.py)
- [x] Django Admin configurado (ordem: Diretrizes, Objetivos, Metas, Indicadores)
- [x] Ordenação natural de códigos (1.1.1 → 1.1.2 → ... → 1.1.10) via RawSQL com prefixo de tabela (`_nat(table)`) para evitar ambiguidade em JOINs
- [x] URL do Admin alterada para `/admsispas/`

### ETAPA 3 — Frontend React ✅ COMPLETA
- [x] Projeto React + Vite criado
- [x] TailwindCSS, React Router, Zustand, React Query configurados
- [x] Proxy /api → Django em desenvolvimento (vite.config.js)
- [x] api.js com interceptors JWT (inject token + refresh automático)
- [x] authStore (Zustand): login, logout, fetchMe
- [x] ProtectedRoute com controle por perfil
- [x] Login (com logotipo SVG + dark mode toggle)
- [x] Layout + Sidebar (com logotipo SVG institucional)
- [x] DOMI (Diretrizes, Objetivos, Metas, Indicadores + Registro)
- [x] Dashboard
- [x] Ciclos
- [x] Usuários
- [x] Auditoria
- [x] Relatórios
- [x] Notificações (sino no header, polling 30s, marcar lida/todas)
- [x] Dark mode em todas as páginas + toggle no header e login
- [x] Identidade institucional: logotipo SVG (frontend/src/assets/logo.svg)

### ETAPA 4 — Testes ✅ COMPLETA
- [x] pytest + pytest-django configurados (SQLite in-memory via config/settings_test.py)
- [x] conftest.py com fixtures: api, area, admin, asplan, coordenador, usuario, visualizador
- [x] Testes de model e API — usuarios (14 testes)
- [x] Testes de model e API — core: Area, Diretriz, Meta (19 testes)
- [x] Testes de model e API — monitoramento: Ciclo, Registro, Validações, ExecucaoFinanceira (20 testes)
- [x] 53 testes passando, 0 falhas
- [x] Playwright (E2E frontend) — 22 testes passando (auth, dashboard, layout, domi)

### ETAPA 5 — Deploy 🔄 EM ANDAMENTO
- [ ] Preparar servidor Ubuntu
- [ ] Clonar projeto + instalar dependências
- [ ] Banco de produção + migrations
- [ ] Variáveis de ambiente produção
- [ ] Gunicorn via Supervisor
- [ ] Nginx (proxy reverso + servir frontend)
- [ ] Build final + go-live

---

## Notas técnicas importantes
- `_nat(table)` em `core/admin.py` e `core/views.py`: ordenação natural qualificada com nome da tabela. Necessário porque `select_related` gera JOINs entre tabelas que todas têm coluna `codigo`, tornando referência sem prefixo ambígua no MariaDB.
- No Admin, usar `get_ordering()` (não `get_queryset`) para ordenação — o `ChangeList` sobrescreve o `order_by` do queryset com o resultado de `get_ordering`.
- `_nat(table)` detecta o banco via `settings.DATABASES['default']['ENGINE']`: usa SUBSTRING_INDEX no MySQL/MariaDB e fallback `['codigo']` no SQLite (testes).
- Testes rodam com SQLite in-memory (`config/settings_test.py`) — não requer permissão de criação de banco no MariaDB de desenvolvimento.
- Logotipo SVG institucional em `frontend/src/assets/logo.svg` — usado no Sidebar e na tela de Login.
- PDF gerado com xhtml2pdf: não suporta CSS flex/grid (usar tabelas), não carrega arquivos locais via `file:///` (usar base64 data URI), SVG em `<img>` não renderiza (usar PNG).
- Logotipo do PDF em `frontend/src/assets/pdf.png` — carregado como base64 no `MetaPDFView`.
- Rodapé em todas as páginas via `@page { @frame footer { -pdf-frame-content: rodape } }`.
- Exportações PDF/XLSX no frontend usam `api.get(..., {responseType: 'blob'})` — links `<a href>` diretos não enviam JWT.
- Notificações: marcar como lida faz DELETE (apaga o registro), não PATCH.
- Usuario customizado usa campo `ativo` (não `is_active`) para ativar/desativar contas.

## Próximo foco
Etapa 5 — Deploy (Ubuntu Server 22.04 + Nginx + Gunicorn + Supervisor + MariaDB produção).
