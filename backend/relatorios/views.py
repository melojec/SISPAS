import io
from datetime import date
from django.conf import settings
from django.db.models.expressions import RawSQL
from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from core.models import Meta, Area
from monitoramento.models import RegistroQuadrimestral, Ciclo
from usuarios.permissions import IsUsuarioAtivo


def _nat(table):
    engine = settings.DATABASES['default']['ENGINE']
    if 'sqlite' in engine:
        return ['codigo']
    return [
        RawSQL(f"CAST(SUBSTRING_INDEX(`{table}`.`codigo`, '.', 1) AS UNSIGNED)", []),
        RawSQL(f"CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(`{table}`.`codigo`, '.', 2), '.', -1) AS UNSIGNED)", []),
        RawSQL(f"CAST(SUBSTRING_INDEX(`{table}`.`codigo`, '.', -1) AS UNSIGNED)", []),
    ]


class MetaPDFView(APIView):
    permission_classes = [IsUsuarioAtivo]

    def get(self, request, meta_id):
        try:
            meta = Meta.objects.select_related(
                'area', 'objetivo', 'objetivo__diretriz'
            ).prefetch_related('atividades').get(pk=meta_id)
        except Meta.DoesNotExist:
            raise NotFound('Meta não encontrada.')

        ciclo_id = request.query_params.get('ciclo')
        ciclo = Ciclo.objects.filter(pk=ciclo_id).first() if ciclo_id else None

        registros_qs = RegistroQuadrimestral.objects.filter(
            meta=meta
        ).select_related('ciclo').order_by('ciclo__ano', 'ciclo__quadrimestre')

        # Monta lista fixa de 3 quadrimestres com valor realizado (0 se sem registro)
        reg_por_q = {r.ciclo.quadrimestre: r for r in registros_qs if r.ciclo}
        labels_q = {1: '1º Quadrimestre', 2: '2º Quadrimestre', 3: '3º Quadrimestre'}
        valores_realizados = [
            {
                'label': labels_q[q],
                'valor': reg_por_q[q].realizado if q in reg_por_q else 0,
                'registro': reg_por_q.get(q),
            }
            for q in [1, 2, 3]
        ]

        # Registro do ciclo atual para campos qualitativos
        registro_atual = reg_por_q.get(ciclo.quadrimestre) if ciclo else None

        import os, base64
        logo_file = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'src', 'assets', 'pdf.png')
        )
        with open(logo_file, 'rb') as f:
            logo_b64 = base64.b64encode(f.read()).decode()
        logo_path = f'data:image/png;base64,{logo_b64}'

        html_string = render_to_string('relatorios/meta_pdf.html', {
            'meta': meta,
            'ciclo': ciclo,
            'valores_realizados': valores_realizados,
            'registro_atual': registro_atual,
            'logo_path': logo_path,
            'data_geracao': date.today().strftime('%d/%m/%Y'),
        })
        from xhtml2pdf import pisa
        buffer = io.BytesIO()
        pisa.CreatePDF(html_string, dest=buffer)
        buffer.seek(0)
        nome = f'meta_{meta.codigo.replace(".", "_")}.pdf'
        return HttpResponse(buffer.read(), content_type='application/pdf',
                            headers={'Content-Disposition': f'attachment; filename="{nome}"'})


class TodasMetasPDFView(APIView):
    permission_classes = [IsUsuarioAtivo]

    def get(self, request):
        ciclo_id = request.query_params.get('ciclo')
        area_id = request.query_params.get('area')

        ciclo = Ciclo.objects.filter(pk=ciclo_id).first() if ciclo_id else None
        area_filtro = Area.objects.filter(pk=area_id).first() if area_id else None

        metas_qs = Meta.objects.select_related(
            'area', 'objetivo', 'objetivo__diretriz'
        ).prefetch_related('atividades').order_by(*_nat('meta'))
        if area_id:
            metas_qs = metas_qs.filter(area_id=area_id)

        labels_q = {1: '1º Quadrimestre', 2: '2º Quadrimestre', 3: '3º Quadrimestre'}

        registros_all = RegistroQuadrimestral.objects.filter(
            meta__in=metas_qs
        ).select_related('ciclo').order_by('ciclo__ano', 'ciclo__quadrimestre')

        regs_por_meta = {}
        for r in registros_all:
            regs_por_meta.setdefault(r.meta_id, {})[r.ciclo.quadrimestre] = r

        metas_data = []
        for meta in metas_qs:
            reg_por_q = regs_por_meta.get(meta.pk, {})
            valores_realizados = [
                {'label': labels_q[q], 'valor': reg_por_q[q].realizado if q in reg_por_q else 0}
                for q in [1, 2, 3]
            ]
            registro_atual = reg_por_q.get(ciclo.quadrimestre) if ciclo else None
            metas_data.append({
                'meta': meta,
                'valores_realizados': valores_realizados,
                'registro_atual': registro_atual,
            })

        import os, base64
        logo_file = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'src', 'assets', 'pdf.png')
        )
        with open(logo_file, 'rb') as f:
            logo_b64 = base64.b64encode(f.read()).decode()
        logo_path = f'data:image/png;base64,{logo_b64}'

        html_string = render_to_string('relatorios/todas_metas_pdf.html', {
            'metas_data': metas_data,
            'ciclo': ciclo,
            'area_filtro': area_filtro,
            'total_metas': len(metas_data),
            'logo_path': logo_path,
            'data_geracao': date.today().strftime('%d/%m/%Y'),
        })
        from xhtml2pdf import pisa
        buffer = io.BytesIO()
        pisa.CreatePDF(html_string, dest=buffer)
        buffer.seek(0)
        return HttpResponse(buffer.read(), content_type='application/pdf',
                            headers={'Content-Disposition': 'attachment; filename="fichas_metas.pdf"'})


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
        from xhtml2pdf import pisa
        buffer = io.BytesIO()
        pisa.CreatePDF(html_string, dest=buffer)
        buffer.seek(0)
        return HttpResponse(buffer.read(), content_type='application/pdf',
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
