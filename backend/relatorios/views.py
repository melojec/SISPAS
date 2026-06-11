import io
from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework.views import APIView
from rest_framework.response import Response
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from monitoramento.models import RegistroQuadrimestral, Ciclo
from usuarios.permissions import IsUsuarioAtivo


class RelatorioPDFView(APIView):
    permission_classes = [IsUsuarioAtivo]

    def get(self, request):
        ciclo_id = request.query_params.get('ciclo')
        area_id = request.query_params.get('area')

        qs = RegistroQuadrimestral.objects.select_related(
            'meta', 'meta__area', 'meta__objetivo', 'meta__objetivo__diretriz', 'ciclo'
        )
        if ciclo_id:
            qs = qs.filter(ciclo_id=ciclo_id)
        if area_id:
            qs = qs.filter(meta__area_id=area_id)

        ciclo = Ciclo.objects.filter(pk=ciclo_id).first() if ciclo_id else None
        html_string = render_to_string('relatorios/relatorio_pas.html', {
            'registros': qs,
            'ciclo': ciclo,
        })
        from weasyprint import HTML
        pdf_file = HTML(string=html_string).write_pdf()
        return HttpResponse(pdf_file, content_type='application/pdf',
                            headers={'Content-Disposition': 'attachment; filename="relatorio_pas.pdf"'})


class RelatorioXLSXView(APIView):
    permission_classes = [IsUsuarioAtivo]

    def get(self, request):
        ciclo_id = request.query_params.get('ciclo')
        area_id = request.query_params.get('area')

        qs = RegistroQuadrimestral.objects.select_related(
            'meta', 'meta__area', 'meta__objetivo', 'meta__objetivo__diretriz', 'ciclo'
        )
        if ciclo_id:
            qs = qs.filter(ciclo_id=ciclo_id)
        if area_id:
            qs = qs.filter(meta__area_id=area_id)

        wb = Workbook()
        ws = wb.active
        ws.title = 'Registros PAS'

        cabecalho = [
            'Diretriz', 'Objetivo', 'Meta (Código)', 'Meta (Descrição)',
            'Área', 'Ciclo', 'Previsto (Exercício)', 'Realizado',
            'Problema', 'Ação', 'Análise', 'Valid. Coord.', 'Valid. ASPLAN',
        ]
        header_fill = PatternFill('solid', fgColor='1a3a5c')
        header_font = Font(bold=True, color='FFFFFF')

        for col, titulo in enumerate(cabecalho, 1):
            cell = ws.cell(row=1, column=col, value=titulo)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center')

        for row, reg in enumerate(qs, 2):
            ws.cell(row=row, column=1, value=reg.meta.objetivo.diretriz.codigo)
            ws.cell(row=row, column=2, value=reg.meta.objetivo.codigo)
            ws.cell(row=row, column=3, value=reg.meta.codigo)
            ws.cell(row=row, column=4, value=reg.meta.descricao)
            ws.cell(row=row, column=5, value=reg.meta.area.nome)
            ws.cell(row=row, column=6, value=str(reg.ciclo))
            ws.cell(row=row, column=7, value=float(reg.meta.previsto_exercicio))
            ws.cell(row=row, column=8, value=float(reg.realizado))
            ws.cell(row=row, column=9, value=reg.problema)
            ws.cell(row=row, column=10, value=reg.acao)
            ws.cell(row=row, column=11, value=reg.analise)
            ws.cell(row=row, column=12, value='Sim' if reg.validado_coord else 'Não')
            ws.cell(row=row, column=13, value='Sim' if reg.validado_asplan else 'Não')

        for col in ws.columns:
            max_len = max((len(str(c.value or '')) for c in col), default=10)
            ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return HttpResponse(
            buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': 'attachment; filename="relatorio_pas.xlsx"'},
        )
