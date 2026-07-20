import html
import io
import re
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
    if 'postgresql' in engine:
        return [
            RawSQL(f'CAST(SPLIT_PART("{table}"."codigo", \'.\', 1) AS INTEGER)', []),
            RawSQL(f'CAST(SPLIT_PART("{table}"."codigo", \'.\', 2) AS INTEGER)', []),
            RawSQL(f'CAST(SPLIT_PART("{table}"."codigo", \'.\', 3) AS INTEGER)', []),
        ]
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
        _logo_candidates = [
            (os.path.join(os.path.dirname(__file__), 'logo_pdf.png'), 'image/png'),
            (os.path.join(os.path.dirname(__file__), 'logo.png'), 'image/png'),
            (os.path.join(os.path.dirname(__file__), 'logo.svg'), 'image/svg+xml'),
        ]
        logo_path = ''
        for _candidate, _mime in _logo_candidates:
            if os.path.exists(_candidate):
                with open(_candidate, 'rb') as f:
                    logo_path = f'data:{_mime};base64,{base64.b64encode(f.read()).decode()}'
                break

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
        import traceback
        try:
            return self._get(request)
        except Exception as e:
            import json
            body = json.dumps({'erro': f'{type(e).__name__}: {e}', 'detalhe': traceback.format_exc()})
            return HttpResponse(body, content_type='application/json', status=500)

    def _get(self, request):
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            Paragraph, Table, TableStyle, Spacer, PageBreak, SimpleDocTemplate, KeepTogether,
        )
        from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

        ciclo_id = request.query_params.get('ciclo')
        area_id  = request.query_params.get('area')
        ciclo       = Ciclo.objects.filter(pk=ciclo_id).first() if ciclo_id else None
        area_filtro = Area.objects.filter(pk=area_id).first()  if area_id  else None

        metas_qs = Meta.objects.select_related(
            'area', 'objetivo', 'objetivo__diretriz'
        ).prefetch_related('atividades').order_by(*_nat('meta'))
        if area_id:
            metas_qs = metas_qs.filter(area_id=area_id)

        registros_all = RegistroQuadrimestral.objects.filter(
            meta__in=metas_qs
        ).select_related('ciclo').order_by('ciclo__ano', 'ciclo__quadrimestre')
        regs_por_meta = {}   # {meta_id: {quadrimestre: registro}} — valores Q1/Q2/Q3
        regs_atual = {}      # {meta_id: registro} — campos qualitativos do ciclo selecionado
        for r in registros_all:
            regs_por_meta.setdefault(r.meta_id, {})[r.ciclo.quadrimestre] = r
            if ciclo:
                if r.ciclo_id == ciclo.pk:
                    regs_atual[r.meta_id] = r
            else:
                regs_atual[r.meta_id] = r  # sem filtro: o mais recente fica (order_by acima)

        # ── Cores e estilos ──────────────────────────────────────────────
        AZUL      = colors.HexColor('#172554')
        AZUL_CLARO= colors.HexColor('#dbeafe')
        CINZA     = colors.HexColor('#f3f4f6')
        BORDA     = colors.HexColor('#172457')

        def st(name, **kw):
            base = dict(fontName='Helvetica', fontSize=9, leading=12,
                        textColor=colors.black, spaceAfter=2)
            base.update(kw)
            return ParagraphStyle(name, **base)

        sNormal   = st('n')
        sSmall    = st('sm', fontSize=7, leading=9, textColor=colors.HexColor('#374151'))
        sLabel    = st('lbl', fontSize=7, leading=9, textColor=colors.HexColor('#6b7280'),
                       fontName='Helvetica-Bold')
        sWhite    = st('w', fontName='Helvetica-Bold', textColor=colors.white)
        sWhiteSm  = st('wsm', fontSize=7, textColor=colors.white)
        sCodigo   = st('cod', fontName='Helvetica-Bold', fontSize=10, textColor=colors.white)
        sDesc     = st('desc', fontSize=9, textColor=colors.white, leading=13)
        sArea     = st('area', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER)
        sNum      = st('num', fontSize=10, fontName='Helvetica-Bold', alignment=TA_CENTER)
        sQLabel   = st('ql', fontSize=7, textColor=colors.HexColor('#374151'), alignment=TA_CENTER)

        def _strip_html(text):
            """Remove tags HTML de campos rich text."""
            if not text:
                return ''
            return re.sub(r'<[^>]+>', '', html.unescape(str(text))).strip()

        def _fmt(val, unidade=''):
            if val is None:
                return '—'
            try:
                v = float(val)
                if 'porcentagem' in (unidade or '').lower():
                    return f'{v:,.2f}%'.replace(',', 'X').replace('.', ',').replace('X', '.')
                if 'unidade' in (unidade or '').lower():
                    return f'{int(v)}'
                return f'{v:,.4f}'.replace(',', 'X').replace('.', ',').replace('X', '.').rstrip('0').rstrip(',')
            except Exception:
                return str(val)

        # ── Monta elementos ───────────────────────────────────────────────
        W = A4[0] - 32*mm   # largura útil
        story = []

        for idx, meta in enumerate(metas_qs):
            reg_por_q = regs_por_meta.get(meta.pk, {})
            registro_atual = regs_atual.get(meta.pk)
            un = meta.unidade or ''

            if idx > 0:
                story.append(PageBreak())

            # ── Cabeçalho azul ────────────────────────────────────────────
            d = meta.objetivo.diretriz
            obj = meta.objetivo
            header_data = [[
                Paragraph(f'<b>{d.codigo}</b> {_strip_html(d.descricao)}', sWhiteSm),
            ]]
            story.append(Table(header_data, colWidths=[W],
                style=TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), AZUL),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('LEFTPADDING', (0,0), (-1,-1), 8),
                ])))

            # Objetivo
            obj_data = [[Paragraph(f'<b>{obj.codigo}</b> {_strip_html(obj.descricao)}', sSmall)]]
            story.append(Table(obj_data, colWidths=[W],
                style=TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), CINZA),
                    ('TOPPADDING', (0,0), (-1,-1), 3),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                    ('LEFTPADDING', (0,0), (-1,-1), 8),
                    ('BOX', (0,0), (-1,-1), 0.5, BORDA),
                ])))

            # Meta (código + descrição + área)
            w_area = 42*mm
            meta_data = [[
                [Paragraph(f'META {meta.codigo}', sCodigo),
                 Paragraph(_strip_html(meta.descricao), sDesc)],
                [Paragraph('ÁREA', sLabel),
                 Paragraph(meta.area.sigla if meta.area else '—', sArea)],
            ]]
            story.append(Table(meta_data, colWidths=[W - w_area, w_area],
                style=TableStyle([
                    ('BACKGROUND', (0,0), (0,0), AZUL),
                    ('BACKGROUND', (1,0), (1,0), AZUL_CLARO),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('TOPPADDING', (0,0), (-1,-1), 6),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                    ('LEFTPADDING', (0,0), (0,0), 8),
                    ('LEFTPADDING', (1,0), (1,0), 4),
                    ('BOX', (0,0), (-1,-1), 0.5, BORDA),
                    ('LINEAFTER', (0,0), (0,0), 0.5, BORDA),
                ])))

            # ── Indicador + Valores Planejados ────────────────────────────
            w_plan = 60*mm
            ppa  = _fmt(meta.previsto_ppa, un)
            exer = _fmt(meta.previsto_exercicio, un)
            ind_data = [[
                [Paragraph('INDICADOR DA META', sLabel),
                 Paragraph(_strip_html(meta.indicador) or 'Não informado', sNormal)],
                [Paragraph('VALORES PLANEJADOS', sLabel),
                 Paragraph(f'PES 2024–2027: <b>{ppa}</b>   |   PAS {ciclo.ano if ciclo else "—"}: <b>{exer}</b>', sSmall)],
            ]]
            story.append(Table(ind_data, colWidths=[W - w_plan, w_plan],
                style=TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('TOPPADDING', (0,0), (-1,-1), 5),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                    ('LEFTPADDING', (0,0), (-1,-1), 8),
                    ('BOX', (0,0), (-1,-1), 0.5, BORDA),
                    ('LINEAFTER', (0,0), (0,0), 0.5, BORDA),
                ])))

            # ── Realizado por Quadrimestre ─────────────────────────────────
            q_labels = ['1º Quadrimestre', '2º Quadrimestre', '3º Quadrimestre']
            q_vals   = [_fmt(reg_por_q[q].realizado, un) if q in reg_por_q else '—' for q in [1,2,3]]
            q_data   = [[Paragraph(l, sQLabel) for l in q_labels],
                        [Paragraph(v, sNum)    for v in q_vals]]
            story.append(Table(q_data, colWidths=[W/3]*3,
                style=TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), CINZA),
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('BOX', (0,0), (-1,-1), 0.5, BORDA),
                    ('INNERGRID', (0,0), (-1,-1), 0.5, BORDA),
                ])))

            # ── Campos qualitativos ───────────────────────────────────────
            def campo_qual(label, valor):
                txt = _strip_html(valor) if valor else ''
                return [Paragraph(label, sLabel), Paragraph(txt or '—', sNormal)]

            if registro_atual:
                qual_rows = [
                    campo_qual('PROBLEMAS ENCONTRADOS', registro_atual.problema),
                    campo_qual('AÇÕES REALIZADAS', registro_atual.acao),
                    campo_qual('ANÁLISE', registro_atual.analise),
                ]
                if getattr(registro_atual, 'atividades_nao_planejadas', None):
                    qual_rows.append(campo_qual('ATIVIDADES NÃO PLANEJADAS', registro_atual.atividades_nao_planejadas))
                for row in qual_rows:
                    story.append(Table([[row[0]], [row[1]]], colWidths=[W],
                        style=TableStyle([
                            ('BACKGROUND', (0,0), (-1,0), CINZA),
                            ('TOPPADDING', (0,0), (-1,-1), 3),
                            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                            ('LEFTPADDING', (0,0), (-1,-1), 8),
                            ('BOX', (0,0), (-1,-1), 0.5, BORDA),
                        ])))

            # ── Atividades ────────────────────────────────────────────────
            atividades = list(meta.atividades.all())
            if atividades:
                at_header = [[Paragraph('ATIVIDADES PREVISTAS', sLabel)]]
                story.append(Table(at_header, colWidths=[W],
                    style=TableStyle([
                        ('BACKGROUND', (0,0), (-1,-1), CINZA),
                        ('TOPPADDING', (0,0), (-1,-1), 3),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                        ('LEFTPADDING', (0,0), (-1,-1), 8),
                        ('BOX', (0,0), (-1,-1), 0.5, BORDA),
                    ])))
                for at in atividades:
                    at_row = [[Paragraph(f'<b>{at.codigo}</b>  {_strip_html(at.descricao)}', sSmall)]]
                    story.append(Table(at_row, colWidths=[W],
                        style=TableStyle([
                            ('TOPPADDING', (0,0), (-1,-1), 2),
                            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                            ('LEFTPADDING', (0,0), (-1,-1), 12),
                            ('LINEBELOW', (0,0), (-1,-1), 0.25, colors.HexColor('#e5e7eb')),
                        ])))

        # ── Gera PDF ──────────────────────────────────────────────────────
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
            leftMargin=16*mm, rightMargin=16*mm,
            topMargin=12*mm, bottomMargin=18*mm)
        doc.build(story)
        buffer.seek(0)
        return HttpResponse(buffer.read(), content_type='application/pdf',
            headers={'Content-Disposition': 'attachment; filename="fichas_metas.pdf"'})


class RelatorioPDFView(APIView):
    permission_classes = [IsUsuarioAtivo]

    def get(self, request):
        import traceback, json
        try:
            return self._get(request)
        except Exception as e:
            body = json.dumps({'erro': f'{type(e).__name__}: {e}', 'detalhe': traceback.format_exc()})
            return HttpResponse(body, content_type='application/json', status=500)

    def _get(self, request):
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
        import traceback, json
        try:
            return self._get(request)
        except Exception as e:
            body = json.dumps({'erro': f'{type(e).__name__}: {e}', 'detalhe': traceback.format_exc()})
            return HttpResponse(body, content_type='application/json', status=500)

    def _get(self, request):
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
            ws.cell(row=row, column=7, value=float(reg.meta.previsto_exercicio or 0))
            ws.cell(row=row, column=8, value=float(reg.realizado or 0))
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
