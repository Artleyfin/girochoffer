from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Empresa:
    """Entidade Empresa (relação 1:1 com Usuario).

    Os campos ``usuario_nome``/``usuario_email``/``usuario_telefone``/
    ``usuario_foto_url`` vêm de um JOIN opcional com a tabela usuario
    (presentes apenas em consultas que fazem o JOIN; ``None`` caso contrário).
    """

    id: int
    usuario_id: int
    cnpj: str
    razao_social: str
    nome_fantasia: str
    telefone: str
    whatsapp: Optional[str] = None
    foto_url: Optional[str] = None
    verificada: bool = False
    data_cadastro: Optional[datetime] = None
    # Campos do JOIN com usuario (para exibição)
    usuario_nome: Optional[str] = None
    usuario_email: Optional[str] = None
    usuario_telefone: Optional[str] = None
    usuario_foto_url: Optional[str] = None
