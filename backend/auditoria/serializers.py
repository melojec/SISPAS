from rest_framework import serializers
from .models import LogAuditoria


class LogAuditoriaSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.nome', read_only=True)
    acao_display = serializers.CharField(source='get_acao_display', read_only=True)

    class Meta:
        model = LogAuditoria
        fields = [
            'id', 'usuario', 'usuario_nome', 'acao', 'acao_display',
            'modulo', 'objeto_id', 'dados_antes', 'dados_depois',
            'data_hora', 'ip',
        ]
