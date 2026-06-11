from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admsispas/', admin.site.urls),
    # JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Apps
    path('api/', include('usuarios.urls')),
    path('api/', include('core.urls')),
    path('api/', include('monitoramento.urls')),
    path('api/', include('relatorios.urls')),
    path('api/', include('auditoria.urls')),
    path('api/', include('notificacoes.urls')),
]
