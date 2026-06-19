"""
Modelo de domínio para Veículo (GiroChoffer).

Um veículo pertence a um motorista (1:N) e referencia um tipo de veículo e um
tipo de carroceria do catálogo. Os campos ``tipo_veiculo_nome`` e
``carroceria_nome`` são opcionais e populados via JOIN com as tabelas de
catálogo, apenas para exibição (não persistidos diretamente nesta entidade).
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Veiculo:
    id: int
    motorista_id: int
    tipo_veiculo_id: int
    tipo_carroceria_id: int
    placa: str
    capacidade_kg: int
    ativo: bool = True
    data_cadastro: Optional[datetime] = None
    # Campos do JOIN (para exibição) — opcionais
    tipo_veiculo_nome: Optional[str] = None
    carroceria_nome: Optional[str] = None
