from django.contrib import admin
from django.contrib.admin import AdminSite
from django.db.models.expressions import RawSQL
from .models import Area, Diretriz, Objetivo, Meta, Atividade

def _nat(table):
    """Ordenação natural qualificada com nome da tabela para evitar ambiguidade em JOINs."""
    return [
        RawSQL(f"CAST(SUBSTRING_INDEX(`{table}`.`codigo`, '.', 1) AS UNSIGNED)", []),
        RawSQL(f"CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(`{table}`.`codigo`, '.', 2), '.', -1) AS UNSIGNED)", []),
        RawSQL(f"CAST(SUBSTRING_INDEX(`{table}`.`codigo`, '.', -1) AS UNSIGNED)", []),
    ]


class AtividadeInline(admin.TabularInline):
    model = Atividade
    extra = 0
    fields = ['descricao', 'indicador', 'unidade', 'valor_previsto']
    verbose_name = 'Indicador'
    verbose_name_plural = 'Indicadores'


class MetaInline(admin.TabularInline):
    model = Meta
    extra = 0
    fields = ['codigo', 'descricao', 'indicador', 'unidade', 'previsto_ppa', 'previsto_exercicio']
    show_change_link = True


class ObjetivoInline(admin.TabularInline):
    model = Objetivo
    extra = 0
    fields = ['codigo', 'descricao']
    show_change_link = True


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ['sigla', 'nome', 'ativa']
    list_filter = ['ativa']
    search_fields = ['nome', 'sigla']


@admin.register(Diretriz)
class DiretrizAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'descricao', 'ano', 'situacao']
    list_filter = ['ano', 'situacao']
    search_fields = ['codigo', 'descricao']
    inlines = [ObjetivoInline]

    def get_ordering(self, request):
        return _nat('diretriz')


@admin.register(Objetivo)
class ObjetivoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'descricao', 'diretriz']
    list_filter = ['diretriz']
    search_fields = ['codigo', 'descricao']
    inlines = [MetaInline]

    def get_ordering(self, request):
        return _nat('objetivo')


@admin.register(Meta)
class MetaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'descricao', 'area', 'objetivo']
    list_filter = ['area', 'objetivo__diretriz']
    search_fields = ['codigo', 'descricao', 'indicador']
    inlines = [AtividadeInline]
    fieldsets = [
        (None, {'fields': ['objetivo', 'area', 'codigo', 'descricao', 'indicador', 'unidade']}),
        ('Valores Planejados', {'fields': [
            'previsto_ppa', 'previsto_exercicio',
            'previsto_q1', 'previsto_q2', 'previsto_q3',
        ]}),
    ]

    def get_ordering(self, request):
        return _nat('meta')


@admin.register(Atividade)
class IndicadorAdmin(admin.ModelAdmin):
    list_display = ['descricao', 'meta', 'unidade', 'valor_previsto']
    list_filter = ['meta__area']
    search_fields = ['descricao', 'indicador']


# Força a ordem do sidebar: Diretrizes → Objetivos → Metas → Indicadores
_CORE_ORDER = ['Diretriz', 'Objetivo', 'Meta', 'Atividade']
_orig_get_app_list = AdminSite.get_app_list


def _ordered_app_list(self, request, app_label=None):
    app_list = _orig_get_app_list(self, request, app_label)
    for app in app_list:
        if app['app_label'] == 'core':
            app['models'].sort(
                key=lambda m: _CORE_ORDER.index(m['object_name'])
                if m['object_name'] in _CORE_ORDER else 99
            )
    return app_list


AdminSite.get_app_list = _ordered_app_list
