"""Schemas de resposta do módulo de usuários."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from model.usuario_model import Usuario
from util.foto_util import obter_caminho_foto_usuario


class UsuarioResponse(BaseModel):
    """Representação pública de um usuário (sem dados sensíveis)."""

    id: int
    nome: str
    email: str
    perfil: str
    foto_url: str = Field(..., description="URL relativa da foto de perfil")
    data_cadastro: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None

    @classmethod
    def de_usuario(cls, usuario: Usuario) -> "UsuarioResponse":
        """Constrói o response a partir da entidade de domínio."""
        return cls(
            id=usuario.id,
            nome=usuario.nome,
            email=usuario.email,
            perfil=usuario.perfil,
            # Usa a foto real do usuário (coluna foto_url, ex.: seed/upload);
            # cai no padrão por id ({id:06d}.jpg → user.jpg) quando ausente.
            foto_url=usuario.foto_url or obter_caminho_foto_usuario(usuario.id),
            data_cadastro=usuario.data_cadastro,
            data_atualizacao=usuario.data_atualizacao,
        )
