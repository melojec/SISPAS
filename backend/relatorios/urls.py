from django.urls import path
from .views import RelatorioPDFView, RelatorioXLSXView

urlpatterns = [
    path('relatorios/pdf/', RelatorioPDFView.as_view(), name='relatorio-pdf'),
    path('relatorios/xlsx/', RelatorioXLSXView.as_view(), name='relatorio-xlsx'),
]
