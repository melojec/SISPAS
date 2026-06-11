from rest_framework.routers import DefaultRouter
from .views import AreaViewSet, DiretrizViewSet, ObjetivoViewSet, MetaViewSet, AtividadeViewSet

router = DefaultRouter()
router.register('areas', AreaViewSet, basename='area')
router.register('diretrizes', DiretrizViewSet, basename='diretriz')
router.register('objetivos', ObjetivoViewSet, basename='objetivo')
router.register('metas', MetaViewSet, basename='meta')
router.register('atividades', AtividadeViewSet, basename='atividade')

urlpatterns = router.urls
