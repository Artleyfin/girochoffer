"""Rotas do dashboard administrativo (estatísticas agregadas da plataforma).

Expõe ``GET /api/admin/dashboard`` (perfil Administrador) com os números e as
séries usadas nos cards e gráficos da home do admin.
"""

from typing import Optional

from fastapi import APIRouter, Request

from dtos.responses.admin_dashboard_response import (
    AdminDashboardResponse,
    ContagemItem,
    SerieMensalItem,
)
from model.usuario_logado_model import UsuarioLogado
from util.api_helpers import checar_rate_limit
from util.auth_decorator import requer_autenticacao
from util.datetime_util import agora
from util.db_util import obter_conexao
from util.perfis import Perfil
from util.rate_limiter import DynamicRateLimiter

router = APIRouter(prefix="/admin/dashboard")

admin_dashboard_limiter = DynamicRateLimiter(
    chave_max="rate_limit_admin_dashboard_max",
    chave_minutos="rate_limit_admin_dashboard_minutos",
    padrao_max=60,
    padrao_minutos=1,
    nome="admin_dashboard",
)

# Meses abreviados em pt-br (índice 1..12).
_MESES_PT = [
    "",
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
]


def _contar(conn, sql: str) -> int:
    return conn.execute(sql).fetchone()[0]


def _cadastros_por_mes(conn) -> list[SerieMensalItem]:
    """Série dos últimos 6 meses (inclui meses sem cadastro, com total 0)."""
    hoje = agora()
    # Constrói os 6 buckets (ano, mês) do mais antigo ao atual.
    buckets: list[tuple[int, int]] = []
    ano, mes = hoje.year, hoje.month
    for _ in range(6):
        buckets.append((ano, mes))
        mes -= 1
        if mes == 0:
            mes = 12
            ano -= 1
    buckets.reverse()

    # Conta cadastros por 'YYYY-MM' direto no SQLite (data_cadastro é ISO8601).
    linhas = conn.execute(
        "SELECT strftime('%Y-%m', data_cadastro) AS ym, COUNT(*) AS total "
        "FROM usuario WHERE data_cadastro IS NOT NULL GROUP BY ym"
    ).fetchall()
    contagem = {linha["ym"]: linha["total"] for linha in linhas}

    serie: list[SerieMensalItem] = []
    for ano_b, mes_b in buckets:
        chave = f"{ano_b:04d}-{mes_b:02d}"
        rotulo = f"{_MESES_PT[mes_b]}/{ano_b % 100:02d}"
        serie.append(
            SerieMensalItem(mes=chave, rotulo=rotulo, total=contagem.get(chave, 0))
        )
    return serie


@router.get("", response_model=AdminDashboardResponse)
@requer_autenticacao([Perfil.ADMIN.value])
async def obter_dashboard(
    request: Request, usuario_logado: Optional[UsuarioLogado] = None
):
    """Retorna totais e séries agregadas para os cards e gráficos do admin."""
    assert usuario_logado is not None
    checar_rate_limit(admin_dashboard_limiter, request)

    with obter_conexao() as conn:
        total_usuarios = _contar(conn, "SELECT COUNT(*) FROM usuario")
        total_empresas = _contar(conn, "SELECT COUNT(*) FROM empresa")
        total_motoristas = _contar(conn, "SELECT COUNT(*) FROM motorista")
        total_cargas = _contar(conn, "SELECT COUNT(*) FROM carga")

        # Cargas por status (garante os 4 status, mesmo zerados, na ordem do fluxo).
        bruto_status = {
            linha["status"]: linha["total"]
            for linha in conn.execute(
                "SELECT status, COUNT(*) AS total FROM carga GROUP BY status"
            ).fetchall()
        }
        from model.carga_model import StatusCarga

        cargas_por_status = [
            ContagemItem(rotulo=s.value, total=bruto_status.get(s.value, 0))
            for s in StatusCarga
        ]

        # Usuários por perfil (garante todos os perfis do enum).
        bruto_perfil = {
            linha["perfil"]: linha["total"]
            for linha in conn.execute(
                "SELECT perfil, COUNT(*) AS total FROM usuario GROUP BY perfil"
            ).fetchall()
        }
        usuarios_por_perfil = [
            ContagemItem(rotulo=p.value, total=bruto_perfil.get(p.value, 0))
            for p in Perfil
        ]

        cadastros_por_mes = _cadastros_por_mes(conn)

    return AdminDashboardResponse(
        total_usuarios=total_usuarios,
        total_empresas=total_empresas,
        total_motoristas=total_motoristas,
        total_cargas=total_cargas,
        cargas_por_status=cargas_por_status,
        usuarios_por_perfil=usuarios_por_perfil,
        cadastros_por_mes=cadastros_por_mes,
    )
