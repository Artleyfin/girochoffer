"""
Modelos do catálogo de referência do GiroChoffer.

Define os tipos de veículo e tipos de carroceria disponíveis para
cadastro de veículos de motoristas e publicação de cargas por empresas.

São tabelas de referência (seed fixo) usadas como FK por Veiculo e Carga.
"""

from dataclasses import dataclass


@dataclass
class TipoVeiculo:
    """
    Tipo de veículo (ex: Caminhão, Carreta, Bitrem, VUC, Van).

    Campos:
        id: ID do tipo de veículo
        nome: Nome do tipo (com acentuação correta)
        ativo: Se está disponível para seleção
    """

    id: int
    nome: str
    ativo: bool = True


@dataclass
class TipoCarroceria:
    """
    Tipo de carroceria (ex: Baú, Sider, Graneleiro, Refrigerado, Aberto/Prancha, Tanque).

    Campos:
        id: ID do tipo de carroceria
        nome: Nome do tipo (com acentuação correta)
        ativo: Se está disponível para seleção
    """

    id: int
    nome: str
    ativo: bool = True
