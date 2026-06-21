"""Response DTOs do dashboard administrativo."""

from pydantic import BaseModel, Field


class ContagemItem(BaseModel):
    """Par rótulo/total usado nos gráficos de categoria (barras/rosca)."""

    rotulo: str = Field(..., description="Rótulo da categoria")
    total: int = Field(..., description="Quantidade")


class SerieMensalItem(BaseModel):
    """Ponto da série temporal de cadastros por mês."""

    mes: str = Field(..., description="Chave do mês no formato YYYY-MM")
    rotulo: str = Field(..., description="Rótulo curto do mês (ex.: jun/26)")
    total: int = Field(..., description="Total de cadastros no mês")


class AdminDashboardResponse(BaseModel):
    """Estatísticas agregadas para os cards e gráficos da home do admin."""

    total_usuarios: int
    total_empresas: int
    total_motoristas: int
    total_cargas: int
    cargas_por_status: list[ContagemItem]
    usuarios_por_perfil: list[ContagemItem]
    cadastros_por_mes: list[SerieMensalItem]
