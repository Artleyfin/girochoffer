"""
Modelo de domínio para Motorista (GiroChoffer).

Relação 1:1 com Usuario (via ``usuario_id`` UNIQUE) e 1:N com Veiculo. A lista
``veiculos`` é populada apenas em leituras de detalhe (ex.: ``obter_detalhe``);
nas leituras simples fica vazia para não carregar dados desnecessários.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from model.veiculo_model import Veiculo


@dataclass
class Motorista:
    id: int
    usuario_id: int
    cpf: str
    telefone: str
    cidade: Optional[str] = None
    nota: float = 0.0
    total_viagens: int = 0
    foto_url: Optional[str] = None
    verificado: bool = False
    data_cadastro: Optional[datetime] = None
    # Campos do JOIN com usuario (para exibição)
    nome: Optional[str] = None
    email: Optional[str] = None
    # Veículos do motorista (populado em leituras de detalhe)
    veiculos: list[Veiculo] = field(default_factory=list)
