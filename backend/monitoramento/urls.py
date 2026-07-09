from rest_framework.routers import DefaultRouter
from .views import CicloViewSet, RegistroQuadrimestralViewSet, ExecucaoFinanceiraViewSet, AnexoIndicadoresViewSet, AuditoriaViewSet

router = DefaultRouter()
router.register('ciclos', CicloViewSet, basename='ciclo')
router.register('registros', RegistroQuadrimestralViewSet, basename='registro')
router.register('execucoes', ExecucaoFinanceiraViewSet, basename='execucao')
router.register('anexos-indicadores', AnexoIndicadoresViewSet, basename='anexo-indicadores')
router.register('auditorias-sus', AuditoriaViewSet, basename='auditoria-sus')

urlpatterns = router.urls
