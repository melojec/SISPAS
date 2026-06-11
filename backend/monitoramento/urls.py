from rest_framework.routers import DefaultRouter
from .views import CicloViewSet, RegistroQuadrimestralViewSet, ExecucaoFinanceiraViewSet

router = DefaultRouter()
router.register('ciclos', CicloViewSet, basename='ciclo')
router.register('registros', RegistroQuadrimestralViewSet, basename='registro')
router.register('execucoes', ExecucaoFinanceiraViewSet, basename='execucao')

urlpatterns = router.urls
