from rest_framework import serializers
from .models import Notificacao


class NotificacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacao
        fields = ['id', 'mensagem', 'tipo', 'lida', 'criada_em']
        read_only_fields = ['mensagem', 'tipo', 'criada_em']
