"""
Modelos de domínio do módulo de cargas (fretes) do GiroChoffer.

- StatusCarga: enum do ciclo de vida de uma carga.
- Carga: dataclass da carga publicada por uma empresa, com campos
  derivados de JOIN (empresa_nome, tipo_veiculo_nome, carroceria_nome)
  e o contador agregado total_interesses.
- InteresseCarga: dataclass do relacionamento N:N entre carga e motorista
  (manifestação de interesse de um motorista por uma carga).
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from util.enum_base import EnumEntidade


class StatusCarga(EnumEntidade):
    """
    Enum do ciclo de vida de uma carga.

    Herda de EnumEntidade que fornece métodos úteis:
        - valores(): Lista todos os valores
        - existe(valor): Verifica se valor existe
        - from_valor(valor): Converte string para enum
        - validar(valor): Valida e retorna ou levanta ValueError

    NOTA: o rótulo "Com interessados" NÃO é um status armazenado; é
    derivado em tempo de resposta (status DISPONIVEL e total_interesses > 0).
    """

    DISPONIVEL = "Disponível"
    CONTRATADA = "Contratada"
    CONCLUIDA = "Concluída"
    CANCELADA = "Cancelada"


@dataclass
class Carga:
    """Carga (frete) publicada por uma empresa."""

    id: int
    empresa_id: int
    titulo: str
    origem: str
    destino: str
    tipo_veiculo_id: int
    tipo_carroceria_id: int
    valor_frete: float
    descricao: str
    status: StatusCarga
    peso_kg: Optional[int] = None
    volume_m3: Optional[float] = None
    data_coleta: Optional[str] = None
    foto_url: Optional[str] = None
    motorista_escolhido_id: Optional[int] = None
    data_publicacao: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None
    # Campos derivados (JOIN / agregação) — só para exibição
    total_interesses: int = 0
    empresa_nome: Optional[str] = None
    tipo_veiculo_nome: Optional[str] = None
    carroceria_nome: Optional[str] = None


@dataclass
class InteresseCarga:
    """Manifestação de interesse de um motorista por uma carga (N:N)."""

    id: int
    carga_id: int
    motorista_id: int
    data_criacao: Optional[datetime] = None
