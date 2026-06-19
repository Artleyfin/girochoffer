"""
DTOs de cadastro composto (GiroChoffer).

O auto-cadastro público cria um Usuario + um perfil específico:
  - tipo="Empresa"   -> Usuario + Empresa
  - tipo="Motorista" -> Usuario + Motorista + Veiculo inicial

O campo ``perfil`` NÃO é aceito do cliente: o servidor o FIXA a partir de
``tipo`` (auth_routes.post_cadastrar), evitando escalada de privilégio
(ADMIN nunca é selecionável publicamente).

Os blocos aninhados (``empresa`` / ``motorista``) são opcionais no schema, mas
um model_validator garante que o bloco correto esteja presente conforme o
``tipo`` escolhido. Reaproveita os validators de ``dtos/validators.py``.
"""

from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from dtos.validators import (
    validar_cnpj,
    validar_cpf,
    validar_comprimento,
    validar_email,
    validar_id_positivo,
    validar_inteiro_range,
    validar_nome_pessoa,
    validar_senha_forte,
    validar_senhas_coincidem,
    validar_string_obrigatoria,
    validar_telefone_br,
)


# Valores aceitos para o campo ``tipo`` (espelham os perfis selecionáveis no
# auto-cadastro: Empresa / Motorista). NUNCA inclui Administrador.
TIPO_EMPRESA = "Empresa"
TIPO_MOTORISTA = "Motorista"
TIPOS_CADASTRO = {TIPO_EMPRESA, TIPO_MOTORISTA}


class EmpresaCadastroDTO(BaseModel):
    """Bloco aninhado com os dados da empresa (tipo=Empresa)."""

    cnpj: str = Field(..., description="CNPJ da empresa (apenas dígitos ou formatado)")
    razao_social: str = Field(..., description="Razão social")
    nome_fantasia: str = Field(..., description="Nome fantasia")
    telefone: str = Field(..., description="Telefone de contato")
    whatsapp: Optional[str] = Field(None, description="WhatsApp (opcional)")

    _validar_cnpj = field_validator("cnpj")(validar_cnpj())
    _validar_razao = field_validator("razao_social")(
        validar_string_obrigatoria("Razão social", tamanho_minimo=2, tamanho_maximo=128)
    )
    _validar_fantasia = field_validator("nome_fantasia")(
        validar_string_obrigatoria("Nome fantasia", tamanho_minimo=2, tamanho_maximo=128)
    )
    _validar_telefone = field_validator("telefone")(validar_telefone_br())

    @field_validator("whatsapp")
    @classmethod
    def _validar_whatsapp(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        # Reaproveita a validação de telefone BR para o WhatsApp.
        return validar_telefone_br()(cls, v)


class MotoristaCadastroDTO(BaseModel):
    """Bloco aninhado com dados do motorista + veículo inicial (tipo=Motorista)."""

    cpf: str = Field(..., description="CPF do motorista (apenas dígitos ou formatado)")
    telefone: str = Field(..., description="Telefone de contato")
    cidade: Optional[str] = Field(None, description="Cidade base (opcional)")
    # Veículo inicial
    tipo_veiculo_id: int = Field(..., description="ID do tipo de veículo (catálogo)")
    tipo_carroceria_id: int = Field(..., description="ID do tipo de carroceria (catálogo)")
    placa: str = Field(..., description="Placa do veículo")
    capacidade_kg: int = Field(..., description="Capacidade de carga em kg")

    _validar_cpf = field_validator("cpf")(validar_cpf())
    _validar_telefone = field_validator("telefone")(validar_telefone_br())
    _validar_cidade = field_validator("cidade")(
        validar_comprimento(tamanho_maximo=128)
    )
    _validar_tipo_veiculo = field_validator("tipo_veiculo_id")(
        validar_id_positivo("Tipo de veículo")
    )
    _validar_tipo_carroceria = field_validator("tipo_carroceria_id")(
        validar_id_positivo("Tipo de carroceria")
    )
    _validar_placa = field_validator("placa")(
        validar_string_obrigatoria("Placa", tamanho_minimo=7, tamanho_maximo=8)
    )
    _validar_capacidade = field_validator("capacidade_kg")(
        validar_inteiro_range(1, 1_000_000, "Capacidade")
    )


class CadastroDTO(BaseModel):
    """
    DTO de cadastro composto. Carrega os dados base do usuário, o ``tipo``
    (Empresa|Motorista) e o bloco aninhado correspondente.

    O servidor IGNORA qualquer ``perfil`` enviado: o perfil é derivado de
    ``tipo`` no endpoint. Aqui só validamos a coerência entre ``tipo`` e o
    bloco aninhado presente.
    """

    tipo: str = Field(..., description="Tipo de cadastro: 'Empresa' ou 'Motorista'")
    nome: str = Field(..., description="Nome completo (ou responsável, no caso de empresa)")
    email: str = Field(..., description="E-mail do usuário")
    senha: str = Field(..., description="Senha do usuário")
    confirmar_senha: str = Field(..., description="Confirmação da senha")
    empresa: Optional[EmpresaCadastroDTO] = Field(
        None, description="Dados da empresa (obrigatório quando tipo='Empresa')"
    )
    motorista: Optional[MotoristaCadastroDTO] = Field(
        None, description="Dados do motorista (obrigatório quando tipo='Motorista')"
    )

    _validar_nome = field_validator("nome")(validar_nome_pessoa())
    _validar_email = field_validator("email")(validar_email())
    _validar_senha = field_validator("senha")(validar_senha_forte())
    _validar_confirmar = field_validator("confirmar_senha")(validar_senha_forte())

    _validar_senhas_match = model_validator(mode="after")(validar_senhas_coincidem())

    @field_validator("tipo")
    @classmethod
    def _validar_tipo(cls, v: str) -> str:
        valor = (v or "").strip()
        if valor not in TIPOS_CADASTRO:
            validos = ", ".join(f"'{t}'" for t in sorted(TIPOS_CADASTRO))
            raise ValueError(f"Tipo deve ser um de: {validos}.")
        return valor

    @model_validator(mode="after")
    def _validar_bloco_por_tipo(self) -> "CadastroDTO":
        """Garante que o bloco aninhado correto está presente conforme o tipo."""
        if self.tipo == TIPO_EMPRESA:
            if self.empresa is None:
                raise ValueError("Dados da empresa são obrigatórios para tipo 'Empresa'.")
        elif self.tipo == TIPO_MOTORISTA:
            if self.motorista is None:
                raise ValueError(
                    "Dados do motorista são obrigatórios para tipo 'Motorista'."
                )
        return self
