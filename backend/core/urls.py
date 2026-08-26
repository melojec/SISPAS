from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AreaViewSet, DiretrizViewSet, ObjetivoViewSet, MetaViewSet, AtividadeViewSet, MunicipioListView, DGMPOrcamentarioView
from .importar_pas_view import ImportarPASView

router = DefaultRouter()
router.register('areas', AreaViewSet, basename='area')
router.register('diretrizes', DiretrizViewSet, basename='diretriz')
router.register('objetivos', ObjetivoViewSet, basename='objetivo')
router.register('metas', MetaViewSet, basename='meta')
router.register('atividades', AtividadeViewSet, basename='atividade')

urlpatterns = router.urls + [
    path('importar-pas/', ImportarPASView.as_view(), name='importar-pas'),
    path('municipios/', MunicipioListView.as_view(), name='municipios'),
    path('dgmp/orcamentario/', DGMPOrcamentarioView.as_view(), name='dgmp-orcamentario'),
]
