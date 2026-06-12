from django.urls import path
from .views import RelatorioPDFView, RelatorioXLSXView, MetaPDFView, TodasMetasPDFView

urlpatterns = [
    path('relatorios/pdf/', RelatorioPDFView.as_view(), name='relatorio-pdf'),
    path('relatorios/xlsx/', RelatorioXLSXView.as_view(), name='relatorio-xlsx'),
    path('relatorios/meta/<int:meta_id>/pdf/', MetaPDFView.as_view(), name='meta-pdf'),
    path('relatorios/metas/pdf/', TodasMetasPDFView.as_view(), name='todas-metas-pdf'),
]
