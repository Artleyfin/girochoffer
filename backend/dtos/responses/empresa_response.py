"""Schemas de resposta do módulo Empresa."""
from typing import Optional

from pydantic import BaseModel, Field

from model.empresa_model import Empresa


class EmpresaResponse(BaseModel):
    """Representação pública de uma empresa (perfil + dados do usuário)."""

    id: int
    nome: str = Field(..., description="Nome do usuário responsável")
    email: str = Field(..., description="E-mail de login do usuário")
    telefone: str = Field(..., description="Telefone de contato da empresa")
    cnpj: str
    razao_social: str
    nome_fantasia: str
    whatsapp: Optional[str] = None
    foto_url: Optional[str] = None
    verificada: bool = False

    @classmethod
    def de_empresa(cls, empresa: Empresa) -> "EmpresaResponse":
        """Constrói o response a partir da entidade de domínio.

        ``nome`` e ``email`` vêm do JOIN com usuario. A ``foto_url`` da
        empresa tem precedência; caindo para a foto do usuário quando ausente.
        """
        return cls(
            id=empresa.id,
            nome=empresa.usuario_nome or "",
            email=empresa.usuario_email or "",
            telefone=empresa.telefone,
            cnpj=empresa.cnpj,
            razao_social=empresa.razao_social,
            nome_fantasia=empresa.nome_fantasia,
            whatsapp=empresa.whatsapp,
            foto_url=empresa.foto_url or empresa.usuario_foto_url,
            verificada=empresa.verificada,
        )
