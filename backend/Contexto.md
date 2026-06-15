        # SISPAS — Contexto do projeto

## O que é
Sistema de acompanhamento do PAS (Programação Anual de Saúde) da SES-MA.
Substitui planilhas eletrônicas no registro/acompanhamento quadrimestral de metas e atividades.

## Stack
- Backend: Django 5 + Django REST Framework + SimpleJWT
- Frontend: React 18 + Vite + TailwindCSS + Zustand + React Query + Axios
- Banco local: MariaDB 10.6 | Banco produção: PostgreSQL (Render)
- Deploy: Render (sispas.onrender.com) — Gunicorn + Whitenoise
- PDF: xhtml2pdf (WeasyPrint rejeitado — sem GTK no Windows) | XLSX: openpyxl

## Repositório
- GitHub: https://github.com/melojec/SISPAS
- Admin local: admin@sesa.ma.gov.br / 0000
- Produção: https://sispas.onrender.com

## Estrutura do backend (sispas/backend/)
- `config/` — settings, urls, wsgi/asgi
- `config/settings.py` — local (MariaDB)
- `config/settings_prod.py` — produção (PostgreSQL, Whitenoise, CORS aberto)
- `config/settings_test.py` — testes (SQLite in-memory)
- `core/` — Area, Diretriz, Objetivo, Meta, Atividade
- `monitoramento/` — Ciclo, RegistroQuadrimestral, ExecucaoFinanceira, AnexoIndicadores
- `usuarios/` — Usuario customizado (AbstractBaseUser), 5 perfis
- `usuarios/management/commands/criar_admin.py` — cria admin padrão no deploy
- `auditoria/` — LogAuditoria + AuditoriaMiddleware
- `relatorios/` — exportação PDF (xhtml2pdf) e XLSX (openpyxl)
- `Procfile` — migrate + criar_admin + gunicorn (usado pelo Render)
- `requirements.txt` — dependências Python
- `importar_pas.py` — script usado para importar dados da planilha Base PAS.xlsx

## Perfis de usuário
Administrador > ASPLAN > Coordenador > Usuário > Visualizador

## Estrutura do frontend (sispas/frontend/src/)
- `pages/` — Login, Dashboard, DOMI, Ciclos, Usuarios, Auditoria, Relatorios, AnexoIndicadores
- `components/` — Layout, Sidebar, ProtectedRoute
- `services/api.js` — cliente axios com interceptors JWT
- `store/authStore.js` — Zustand com fetchMe/login/logout

## Menu lateral (Sidebar.jsx)
- Dashboard → /
- DOMI → /domi
- Relatórios → /relatorios
- Análise de Indicadores → /analise-indicadores (todos os perfis)
- Ciclos → /ciclos (administrador, asplan)
- Usuários → /usuarios (administrador)
- Auditoria → /auditoria (administrador, asplan)

## Módulo DOMI (principal)
Navegação em 3 colunas: Diretrizes → Objetivos → Metas.
Modal da meta: indicador, valores planejados (PES 4 anos + PAS ano corrente), realizado por quadrimestre
(Q1/Q2/Q3 — apenas o quadrimestre do ciclo ativo é editável), registro qualitativo (problemas, ações,
análise), campo "Atividades Executadas e Não Planejadas" (`atividades_nao_realizadas`), status de validação.
Edição bloqueada após validação ASPLAN ou ciclo fechado.
Botão "Salvar em PDF" no header do modal exporta ficha individual da meta via blob download (JWT).
Botões de validação: `Validar (Coord.)` e `Validar (ASPLAN)` — visíveis conforme perfil.

## Módulo Dashboard
- Cards: Total de Metas, Registros no Ciclo, Validados (ASPLAN), Pendentes
- Gráfico rosca: preenchidas × não preenchidas com percentual central
- Tabela "Planejado × Realizado":
  - Filtros em grid: Diretriz, Objetivo, Busca por texto, checkbox Apenas preenchidas
  - Barra de progresso colorida por meta (verde ≥100%, âmbar ≥50%, vermelho <50%)
  - Botão "Exportar PDF" → abre nova aba com tabela formatada e dispara impressão
  - Altura máxima com scroll interno e header fixo

## Módulo Análise de Indicadores
- Página própria acessível pelo menu (ícone 📎)
- Upload de arquivos .docx via FormData POST para `/api/anexos-indicadores/`
- Lista arquivos enviados com nome, data, quem enviou, botões Baixar e Remover
- Model `AnexoIndicadores`: `arquivo`, `nome_original`, `enviado_por`, `enviado_em`

## Deploy — Render
- URL: https://sispas.onrender.com
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput --settings=config.settings_prod`
- Start Command (Procfile): `migrate + criar_admin + gunicorn`
- Banco: PostgreSQL (Render free tier) — conectado via `DATABASE_URL`
- Whitenoise serve estáticos + `WHITENOISE_ROOT = staticfiles/frontend` para o React
- Frontend build commitado em `backend/staticfiles/frontend/`
- Para atualizar produção: `npm run build` no frontend → commitar `staticfiles/frontend/` → push

## Variáveis de ambiente (produção)
- `DJANGO_SETTINGS_MODULE=config.settings_prod`
- `SECRET_KEY=<valor seguro>`
- `DATABASE_URL=<url do PostgreSQL do Render>`

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
- [x] Models: Ciclo, RegistroQuadrimestral, ExecucaoFinanceira, AnexoIndicadores (monitoramento)
- [x] Models: Usuario customizado (AbstractBaseUser), LogAuditoria
- [x] Migrations geradas e aplicadas
- [x] Serializers para todos os models
- [x] ViewSets + DefaultRouter (CRUD completo)
- [x] Autenticação JWT (endpoints /api/token/ e /api/token/refresh/)
- [x] Permissões por perfil: IsASPLAN, IsCoordenador, IsUsuarioDeArea, IsUsuarioAtivo
- [x] Endpoints de exportação PDF (xhtml2pdf) e XLSX (openpyxl)
- [x] Endpoint de exportação PDF por meta individual (MetaPDFView)
- [x] Auditoria via AuditoriaMiddleware (LogAuditoria)
- [x] Banco populado com dados reais (Base PAS.xlsx via importar_pas.py)
- [x] Django Admin configurado
- [x] Ordenação natural de códigos via RawSQL (_nat(table))
- [x] URL do Admin alterada para `/admsispas/`
- [x] Validações Coord/ASPLAN nos registros
- [x] Visibilidade de registros por área/ciclo
- [x] Campo `atividades_nao_realizadas` em RegistroQuadrimestral
- [x] Model AnexoIndicadores + endpoint `/api/anexos-indicadores/`
- [x] Comando `criar_admin` para setup automático no deploy

### ETAPA 3 — Frontend React ✅ COMPLETA
- [x] Projeto React + Vite criado
- [x] TailwindCSS, React Router, Zustand, React Query configurados
- [x] Proxy /api e /media → Django em desenvolvimento (vite.config.js)
- [x] api.js com interceptors JWT
- [x] authStore (Zustand): login, logout, fetchMe
- [x] ProtectedRoute com controle por perfil
- [x] Login (com logotipo SVG + dark mode toggle)
- [x] Layout + Sidebar
- [x] DOMI com modal completo (registro, validação, PDF, gráfico, atividades)
- [x] Dashboard com rosca + tabela Planejado × Realizado + exportação PDF
- [x] Análise de Indicadores (upload/listagem .docx)
- [x] Ciclos, Usuários, Auditoria, Relatórios
- [x] Notificações (sino no header, polling 30s)
- [x] Dark mode em todas as páginas

### ETAPA 4 — Testes ✅ COMPLETA
- [x] pytest + pytest-django — 53 testes passando
- [x] Playwright E2E frontend — 22 testes passando

### ETAPA 5 — Deploy ✅ COMPLETA (Render — validação)
- [x] settings_prod.py (PostgreSQL, Whitenoise, CORS)
- [x] Procfile + railway.json + nixpacks.toml
- [x] Frontend build commitado em staticfiles/frontend/
- [x] Deploy funcionando em https://sispas.onrender.com
- [x] Banco PostgreSQL conectado
- [x] Admin criado automaticamente no deploy
- [ ] Deploy definitivo em servidor da TI da SES-MA (Ubuntu + Nginx + MariaDB)

---

## Notas técnicas importantes
- `_nat(table)` em `core/admin.py` e `core/views.py`: ordenação natural qualificada com nome da tabela.
- Testes rodam com SQLite in-memory (`config/settings_test.py`).
- PDF gerado com xhtml2pdf: não suporta CSS flex/grid (usar tabelas), não carrega arquivos locais via `file:///`.
- Logotipo do PDF em `backend/relatorios/logo.png` — carregado como base64 no `MetaPDFView`.
- Exportações PDF/XLSX no frontend usam `api.get(..., {responseType: 'blob'})`.
- Notificações: marcar como lida faz DELETE (apaga o registro), não PATCH.
- Usuario customizado usa campo `ativo` (não `is_active`) para ativar/desativar contas.
- Query key `metas-todas-v2` é compartilhada entre Dashboard e DOMI — mudanças no serializer de Meta exigem bumpar essa key.
- Upload de arquivos usa FormData + `Content-Type: multipart/form-data` (separado do save JSON principal).
- Render free tier: servidor "dorme" após 15min sem uso — primeira requisição demora ~30s para acordar.

## Próximo foco
Deploy definitivo em servidor da TI da SES-MA (Ubuntu Server 22.04 + Nginx + Gunicorn + MariaDB produção).
