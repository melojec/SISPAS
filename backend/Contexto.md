# SISPAS — Contexto do projeto

## O que é
Sistema de acompanhamento do PAS (Programação Anual de Saúde) da SESA-MA.
Substitui planilhas eletrônicas no registro/acompanhamento quadrimestral de metas e atividades.

## Stack
- Backend: Django 5 + Django REST Framework + SimpleJWT
- Frontend: React 18 + Vite + TailwindCSS + Zustand + React Query + Axios
- Banco: MariaDB 10.6
- Deploy: Nginx + Gunicorn + Supervisor (Ubuntu Server 22.04)
- PDF: WeasyPrint | XLSX: openpyxl

## Repositório
- GitHub: https://github.com/melojec/SISPAS
- Superuser local: admin@sesa.ma.gov.br

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
Modal da meta: indicador, valores planejados (PES/Ano/Q1/Q2/Q3), execução financeira por atividade,
registro qualitativo (realizado, problemas, ações, análise), status de validação.
Edição bloqueada após validação ASPLAN ou ciclo fechado.

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
- [x] Endpoints de exportação PDF (WeasyPrint) e XLSX (openpyxl)
- [x] Auditoria via AuditoriaMiddleware (LogAuditoria)
- [x] Banco populado com dados reais (Base PAS.xlsx via importar_pas.py)
- [x] Django Admin configurado (ordem: Diretrizes, Objetivos, Metas, Indicadores)
- [x] Ordenação natural de códigos (1.1.1 → 1.1.2 → ... → 1.1.10) via RawSQL

### ETAPA 3 — Frontend React 🔄 EM ANDAMENTO
- [x] Projeto React + Vite criado
- [x] TailwindCSS, React Router, Zustand, React Query configurados
- [x] Proxy /api → Django em desenvolvimento (vite.config.js)
- [x] api.js com interceptors JWT (inject token + refresh automático)
- [x] authStore (Zustand): login, logout, fetchMe
- [x] ProtectedRoute com controle por perfil
- [x] Login
- [x] Layout + Sidebar
- [x] DOMI (Diretrizes, Objetivos, Metas, Indicadores + Registro) ← módulo principal
- [ ] Dashboard — existe o arquivo, verificar se está completo
- [ ] Ciclos — existe o arquivo, verificar se está completo
- [ ] Usuários — existe o arquivo, verificar se está completo
- [ ] Auditoria — existe o arquivo, verificar se está completo
- [ ] Relatórios — existe o arquivo, verificar se está completo
- [ ] Notificações — não iniciado
- [ ] Build de produção (npm run build)

### ETAPA 4 — Testes ❌ NÃO INICIADA
- [ ] pytest + pytest-django (backend)
- [ ] Testes de serializers, permissões, regras de negócio
- [ ] Playwright (E2E frontend)

### ETAPA 5 — Deploy ❌ NÃO INICIADA
- [ ] Preparar servidor Ubuntu
- [ ] Clonar projeto + instalar dependências
- [ ] Banco de produção + migrations
- [ ] Variáveis de ambiente produção
- [ ] Gunicorn via Supervisor
- [ ] Nginx (proxy reverso + servir frontend)
- [ ] Build final + go-live

---

## Próximo foco
Verificar e completar as páginas existentes da Etapa 3:
Dashboard, Ciclos, Usuarios, Auditoria, Relatorios.
Depois: Notificações → Testes → Deploy.
