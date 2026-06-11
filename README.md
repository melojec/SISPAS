# SISPAS

**Sistema de Monitoramento da Programação Anual de Saúde**
Secretaria de Estado da Saúde do Maranhão — SES-MA

---

## Sobre o projeto

O SISPAS substitui planilhas eletrônicas no processo de monitoramento da PAS (Programação Anual de Saúde). Permite que as áreas da secretaria registrem, acompanhem e validem a execução quadrimestral de metas e atividades, com geração automatizada de relatórios.

## Módulos

| Módulo | Descrição |
|---|---|
| **DOMI** | Navegação hierárquica: Diretrizes → Objetivos → Metas → Indicadores |
| **Registro Quadrimestral** | Preenchimento de realizado, problemas, ações e análise por ciclo |
| **Execução Financeira** | Lançamento de valores realizados por atividade e quadrimestre |
| **Relatórios** | Exportação em PDF e XLSX filtrados por área, ciclo e objetivo |
| **Ciclos** | Abertura e encerramento de períodos com bloqueio automático |
| **Usuários** | Gestão de 5 perfis: Administrador, ASPLAN, Coordenador, Usuário, Visualizador |
| **Auditoria** | Log completo de todas as ações com usuário, data e hora |
| **Dashboard** | Visão consolidada com métricas e execução por área |

## Stack

**Backend**
- Python 3.11 + Django 5 + Django REST Framework
- Autenticação JWT (djangorestframework-simplejwt)
- MariaDB 10.6
- WeasyPrint (PDF) + openpyxl (XLSX)

**Frontend**
- React 18 + Vite
- TailwindCSS
- Zustand (estado global) + React Query (cache/requisições)
- Axios

**Deploy**
- Nginx + Gunicorn + Supervisor
- Ubuntu Server 22.04

## Estrutura do projeto

```
sispas/
├── backend/
│   ├── config/          # settings, urls, wsgi
│   ├── core/            # Diretriz, Objetivo, Meta, Atividade
│   ├── monitoramento/   # Ciclo, RegistroQuadrimestral, ExecucaoFinanceira
│   ├── usuarios/        # Usuario customizado, permissões por perfil
│   ├── auditoria/       # LogAuditoria, middleware
│   ├── relatorios/      # Exportação PDF e XLSX
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/       # Dashboard, DOMI, Ciclos, Usuarios, Auditoria, Relatorios
        ├── components/  # Layout, Sidebar, ProtectedRoute
        ├── store/       # authStore (Zustand)
        └── services/    # api.js (Axios + interceptors JWT)
```

## Como rodar localmente

### Pré-requisitos
- Python 3.11+
- Node.js 20 LTS
- MariaDB ou MySQL rodando localmente

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt

# Copie e edite o arquivo de variáveis de ambiente
cp .env.example .env

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

### Variáveis de ambiente (backend/.env)

```env
SECRET_KEY=sua-chave-secreta
DEBUG=True
DB_NAME=sispas_dev
DB_USER=sispas
DB_PASSWORD=sua-senha
DB_HOST=localhost
DB_PORT=3306
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## Perfis de acesso

| Perfil | Permissões |
|---|---|
| Administrador | Acesso total |
| ASPLAN | Gerencia estrutura, ciclos, valida registros |
| Coordenador | Valida registros da sua área |
| Usuário | Preenche registros da sua área |
| Visualizador | Somente leitura |

---

Desenvolvido para a SES-MA · 2026
