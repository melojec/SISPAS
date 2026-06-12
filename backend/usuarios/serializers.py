from rest_framework import serializers
from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    perfil_display = serializers.CharField(source='get_perfil_display', read_only=True)
    area_nome = serializers.CharField(source='area.nome', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nome', 'perfil', 'perfil_display',
            'area', 'area_nome', 'ativo', 'data_criacao',
        ]
        read_only_fields = ['data_criacao']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6,
        error_messages={'min_length': 'A senha deve ter pelo menos 6 caracteres.'})

    class Meta:
        model = Usuario
        fields = ['email', 'nome', 'perfil', 'area', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UsuarioMeSerializer(serializers.ModelSerializer):
    perfil_display = serializers.CharField(source='get_perfil_display', read_only=True)
    area_nome = serializers.CharField(source='area.nome', read_only=True)

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nome', 'perfil', 'perfil_display', 'area', 'area_nome']
