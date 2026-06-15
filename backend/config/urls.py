from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
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
    # Frontend (catch-all para React Router)
    re_path(r'^(?!api/|admsispas/|media/|static/).*$',
            TemplateView.as_view(template_name='frontend/index.html')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
