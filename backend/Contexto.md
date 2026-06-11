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
### Páginas no router (App.jsx)
- Login, Dashboard, DOMI, Ciclos, Usuarios, Auditoria, Relatorios

### Componentes
- Layout, Sidebar, ProtectedRoute

### Serviços/Store
- `services/api.js` — cliente axios
- `store/authStore.js` — Zustand com fetchMe/login/logout

## Módulo DOMI (principal do sistema)
Página única com 3 colunas: Diretrizes → Objetivos → Metas.
Ao clicar em uma meta abre o ModalMeta que permite:
- Ver indicador, valores planejados (PES, Ano, Q1, Q2, Q3)
- Preencher execução financeira das atividades por quadrimestre
- Registrar: quantidade realizada, problemas, ações e análise
- Ver status de validação (Pendente / Aguard. Coord. / Aguard. ASPLAN / Validado)
- Edição bloqueada após validação ASPLAN ou ciclo fechado

## O que já foi feito
- [x] Setup: venv, Django, apps, settings, banco MariaDB
- [x] Models, serializers, views e urls em todos os apps
- [x] Ordenação natural de códigos (1.1.1 → 1.1.2 → ... → 1.1.10) via RawSQL
- [x] Banco populado com dados reais da planilha Base PAS.xlsx
- [x] Django Admin configurado (ordem: Diretrizes, Objetivos, Metas, Indicadores)
- [x] Superuser: admin@sesa.ma.gov.br
- [x] Frontend: Login, Layout, Sidebar, ProtectedRoute, Dashboard
- [x] Módulo DOMI completo (navegação + modal de registro + execução financeira)
- [x] Páginas: Ciclos, Usuarios, Auditoria, Relatorios (verificar implementação)

## Pendências
- Verificar conteúdo real das páginas Ciclos, Usuarios, Auditoria, Relatorios e Dashboard
- Testes unitários
- Preparação para deploy no servidor SESA-MA
