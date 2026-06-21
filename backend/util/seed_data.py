import json
import sqlite3
from pathlib import Path

from repo import usuario_repo
from model.usuario_model import Usuario
from util.config import IS_DEVELOPMENT
from util.security import criar_hash_senha
from util.logger_config import logger
from util.perfis import Perfil

# Diretório das fotos de seed geradas por IA, servidas em /static/uploads/seed/.
# foto_url no banco usa o caminho público; em disco verificamos a existência
# do arquivo (o seed deve ser robusto a imagem ausente -> foto_url = None).
DIR_FOTOS_SEED = (
    Path(__file__).resolve().parent.parent / "static" / "uploads" / "seed"
)

# Senha padrão de todos os usuários demo do GiroChoffer (armazenada com hash).
SENHA_PADRAO_SEED = "1234aA@#"

# Caminho do arquivo de seed de usuários (raiz_do_projeto/data/admin_seed.json).
# Este arquivo é gerado/atualizado pelo scripts/configurar_projeto.py.
CAMINHO_SEED_USUARIOS = Path(__file__).resolve().parent.parent / "data" / "admin_seed.json"


def _ler_usuarios_do_json() -> list[dict]:
    """
    Lê os usuários definidos em data/admin_seed.json.

    Returns:
        Lista de dicionários de usuários. Retorna lista vazia se o arquivo
        não existir, estiver vazio ou for inválido.
    """
    if not CAMINHO_SEED_USUARIOS.exists():
        return []
    try:
        dados = json.loads(CAMINHO_SEED_USUARIOS.read_text(encoding="utf-8"))
        return dados.get("usuarios", [])
    except (json.JSONDecodeError, OSError) as e:
        logger.error(
            f"Erro ao ler {CAMINHO_SEED_USUARIOS.name}: {e}. "
            "Usando perfis do enum como fallback."
        )
        return []


def _gerar_usuarios_dos_perfis() -> list[dict]:
    """
    Gera um usuário padrão para cada perfil do enum Perfil (fallback).

    Formato gerado por perfil:
    - nome: {Perfil} Padrão
    - email: padrao@{perfil}.com
    - senha: 1234aA@#
    - perfil: {Perfil}
    """
    usuarios = []
    for perfil_enum in Perfil:
        perfil_valor = perfil_enum.value
        usuarios.append({
            "nome": f"{perfil_valor} Padrão",
            "email": f"padrao@{perfil_valor.lower()}.com",
            "senha": "1234aA@#",
            "perfil": perfil_valor,
        })
    return usuarios


def carregar_usuarios_seed():
    """
    Carrega usuários padrão no banco de dados.

    Prioriza os usuários definidos em data/admin_seed.json (gerado pelo
    scripts/configurar_projeto.py). Caso o arquivo não exista ou esteja vazio/inválido,
    gera automaticamente 1 usuário para cada perfil do enum Perfil como fallback.

    Só insere usuários se não houver nenhum usuário cadastrado no banco.
    A senha de cada usuário é sempre armazenada com hash bcrypt.
    """
    # Verificar se já existem usuários cadastrados
    quantidade_usuarios = usuario_repo.obter_quantidade()
    if quantidade_usuarios > 0:
        logger.info(f"Já existem {quantidade_usuarios} usuários cadastrados. Seed não será executado.")
        return

    usuarios_seed = _ler_usuarios_do_json()
    if usuarios_seed:
        logger.info(
            f"Nenhum usuário encontrado. Carregando {len(usuarios_seed)} usuário(s) "
            f"de {CAMINHO_SEED_USUARIOS.name}..."
        )
    else:
        usuarios_seed = _gerar_usuarios_dos_perfis()
        logger.info(
            "Nenhum usuário encontrado e seed JSON ausente/vazio. "
            "Gerando usuários padrão a partir dos perfis..."
        )

    usuarios_criados = 0
    usuarios_com_erro = 0

    for dados in usuarios_seed:
        email = dados.get("email", "")
        try:
            usuario = Usuario(
                id=0,
                nome=dados.get("nome", ""),
                email=email,
                senha=criar_hash_senha(dados.get("senha", "")),
                perfil=dados.get("perfil", ""),
            )

            usuario_id = usuario_repo.inserir(usuario)
            if usuario_id:
                logger.info(f"✓ Usuário {email} criado com sucesso (ID: {usuario_id})")
                usuarios_criados += 1
            else:
                logger.error(f"✗ Falha ao inserir usuário {email} no banco")
                usuarios_com_erro += 1

        except sqlite3.Error as e:
            logger.error(f"✗ Erro ao processar usuário {email}: {e}")
            usuarios_com_erro += 1

    # Resumo
    logger.info(f"Resumo do seed de usuários: {usuarios_criados} criados, {usuarios_com_erro} com erro")


def _foto_seed(nome_arquivo: str) -> str | None:
    """
    Retorna o caminho público ``/static/uploads/seed/<arquivo>`` se o arquivo
    existir em disco; caso contrário, ``None`` (seed robusto a imagem ausente).
    """
    if (DIR_FOTOS_SEED / nome_arquivo).exists():
        return f"/static/uploads/seed/{nome_arquivo}"
    return None


def _mapear_catalogo() -> tuple[dict, dict]:
    """
    Monta dois dicts {nome -> id} para tipos de veículo e carrocerias ativos,
    resolvendo as FKs das cargas/veículos demo por nome (UTF-8 com acentos).
    """
    from repo import catalogo_repo

    tipos_veiculo = {
        t.nome: t.id for t in catalogo_repo.obter_tipos_veiculo_ativos()
    }
    carrocerias = {
        c.nome: c.id for c in catalogo_repo.obter_carrocerias_ativas()
    }
    return tipos_veiculo, carrocerias


def carregar_girochoffer_demo():
    """
    Carrega dados de demonstração do GiroChoffer (5 empresas, 6 motoristas com
    1 veículo cada, 10 cargas, interesses e contratações), espelhando o design
    de referência em design/girochoffer-react/src/data/*.json.

    Idempotente: se a empresa âncora (por e-mail) já existir, não faz nada.
    Usa exclusivamente os repositórios (SQL puro, sem ORM). Perfis e status
    vêm sempre dos enums (Perfil, StatusCarga) — nunca strings literais.
    """
    from repo import empresa_repo, motorista_repo, veiculo_repo, carga_repo
    from repo import interesse_carga_repo
    from model.empresa_model import Empresa
    from model.motorista_model import Motorista
    from model.veiculo_model import Veiculo
    from model.carga_model import Carga, StatusCarga

    senha_hash = criar_hash_senha(SENHA_PADRAO_SEED)

    # -- Guarda de idempotência: empresa âncora já cadastrada? --------------
    email_ancora = "contato@andradelog.com.br"
    if usuario_repo.obter_por_email(email_ancora) is not None:
        logger.info(
            "Seed demo GiroChoffer já aplicado (empresa âncora existe). Pulando."
        )
        return

    tipos_veiculo, carrocerias = _mapear_catalogo()
    if not tipos_veiculo or not carrocerias:
        logger.error(
            "Catálogo (tipos de veículo/carroceria) vazio; "
            "seed demo do GiroChoffer abortado."
        )
        return

    # =====================================================================
    # 1) EMPRESAS (Usuario perfil Empresa + Empresa)
    # =====================================================================
    empresas_demo = [
        {
            "nome": "Transportes Andrade",
            "email": email_ancora,
            "telefone": "(11) 3322-7788",
            "cnpj": "18.402.551/0001-04",
            "razao_social": "Transportes Andrade Ltda",
            "nome_fantasia": "Andrade Logística",
            "whatsapp": "(11) 99745-2210",
            "foto": "emp_1.jpg",
            "verificada": True,
        },
        {
            "nome": "Agro Cerrado S/A",
            "email": "logistica@agrocerrado.com.br",
            "telefone": "(65) 3421-9900",
            "cnpj": "24.118.903/0001-77",
            "razao_social": "Agro Cerrado Agroindustrial S/A",
            "nome_fantasia": "Agro Cerrado",
            "whatsapp": "(65) 98112-3344",
            "foto": "emp_2.jpg",
            "verificada": True,
        },
        {
            "nome": "Laticínios Bela Vista",
            "email": "contato@belavistalat.com.br",
            "telefone": "(34) 3232-5566",
            "cnpj": "31.207.448/0001-12",
            "razao_social": "Laticínios Bela Vista Ltda",
            "nome_fantasia": "Bela Vista",
            "whatsapp": "(34) 99654-8821",
            "foto": "emp_3.jpg",
            "verificada": False,
        },
        {
            "nome": "MóveisExpress",
            "email": "frete@moveisexpress.com.br",
            "telefone": "(54) 3055-1020",
            "cnpj": "09.873.215/0001-60",
            "razao_social": "Móveis Express Indústria e Comércio Ltda",
            "nome_fantasia": "MóveisExpress",
            "whatsapp": "(54) 99178-4567",
            "foto": "emp_4.jpg",
            "verificada": False,
        },
        {
            "nome": "Distribuidora Vale",
            "email": "operacoes@distribuidoravale.com.br",
            "telefone": "(19) 3877-2200",
            "cnpj": "42.560.118/0001-39",
            "razao_social": "Distribuidora Vale de Combustíveis Ltda",
            "nome_fantasia": "Distribuidora Vale",
            "whatsapp": "(19) 99203-7788",
            "foto": "emp_5.jpg",
            "verificada": True,
        },
    ]

    # ref_empresa (e1..e5 do JSON) -> empresa_id no banco
    empresa_id_por_ref: dict[str, int] = {}
    refs_empresa = ["e1", "e2", "e3", "e4", "e5"]
    empresas_criadas = 0

    for ref, dados in zip(refs_empresa, empresas_demo):
        usuario_existente = usuario_repo.obter_por_email(dados["email"])
        if usuario_existente is not None:
            usuario_id = usuario_existente.id
        else:
            usuario_id = usuario_repo.inserir(Usuario(
                id=0,
                nome=dados["nome"],
                email=dados["email"],
                senha=senha_hash,
                perfil=Perfil.EMPRESA.value,
                telefone=dados["telefone"],
                foto_url=_foto_seed(dados["foto"]),
            ))
        if not usuario_id:
            logger.error(f"✗ Falha ao criar usuário empresa {dados['email']}")
            continue

        empresa_existente = empresa_repo.obter_por_usuario_id(usuario_id)
        if empresa_existente is not None:
            empresa_id_por_ref[ref] = empresa_existente.id
            continue

        empresa_id = empresa_repo.inserir(Empresa(
            id=0,
            usuario_id=usuario_id,
            cnpj=dados["cnpj"],
            razao_social=dados["razao_social"],
            nome_fantasia=dados["nome_fantasia"],
            telefone=dados["telefone"],
            whatsapp=dados["whatsapp"],
            foto_url=_foto_seed(dados["foto"]),
            verificada=dados["verificada"],
        ))
        if not empresa_id:
            # Rollback manual (sem transação automática entre repos).
            usuario_repo.excluir(usuario_id)
            logger.error(f"✗ Falha ao criar empresa {dados['nome']} (rollback usuário)")
            continue
        empresa_id_por_ref[ref] = empresa_id
        empresas_criadas += 1

    # =====================================================================
    # 2) MOTORISTAS (Usuario perfil Motorista + Motorista + 1 Veículo)
    # =====================================================================
    motoristas_demo = [
        {
            "ref": "m1",
            "nome": "Carlos Henrique Souza",
            "email": "carlos.souza@email.com.br",
            "cpf": "327.118.940-55",
            "telefone": "(11) 99812-4477",
            "cidade": "São Paulo/SP",
            "nota": 4.9,
            "viagens": 128,
            "verificado": True,
            "foto": "mot_1.jpg",
            "tipo_veiculo": "Caminhão",
            "carroceria": "Baú",
            "placa": "FQT-2D18",
            "capacidade_kg": 9000,
        },
        {
            "ref": "m2",
            "nome": "Marcos Vinícius Lima",
            "email": "marcos.lima@email.com.br",
            "cpf": "415.882.071-09",
            "telefone": "(41) 99723-1188",
            "cidade": "Curitiba/PR",
            "nota": 4.7,
            "viagens": 86,
            "verificado": True,
            "foto": "mot_2.jpg",
            "tipo_veiculo": "Carreta",
            "carroceria": "Sider",
            "placa": "RKL-7H42",
            "capacidade_kg": 27000,
        },
        {
            "ref": "m3",
            "nome": "Rafael Oliveira Dias",
            "email": "rafael.dias@email.com.br",
            "cpf": "508.334.612-80",
            "telefone": "(62) 99540-7733",
            "cidade": "Goiânia/GO",
            "nota": 4.8,
            "viagens": 154,
            "verificado": True,
            "foto": "mot_3.jpg",
            "tipo_veiculo": "Bitrem",
            "carroceria": "Graneleiro",
            "placa": "GYN-9C07",
            "capacidade_kg": 30000,
        },
        {
            "ref": "m4",
            "nome": "André Pereira Nogueira",
            "email": "andre.nogueira@email.com.br",
            "cpf": "229.760.155-41",
            "telefone": "(31) 99466-2255",
            "cidade": "Belo Horizonte/MG",
            "nota": 4.6,
            "viagens": 73,
            "verificado": False,
            "foto": "mot_4.jpg",
            "tipo_veiculo": "Caminhão",
            "carroceria": "Refrigerado",
            "placa": "PUC-4B91",
            "capacidade_kg": 12000,
        },
        {
            "ref": "m5",
            "nome": "Jonatas Ferreira Campos",
            "email": "jonatas.campos@email.com.br",
            "cpf": "364.901.228-13",
            "telefone": "(54) 99388-6610",
            "cidade": "Caxias do Sul/RS",
            "nota": 4.5,
            "viagens": 41,
            "verificado": False,
            "foto": "mot_5.jpg",
            "tipo_veiculo": "VUC",
            "carroceria": "Baú",
            "placa": "IVL-1F23",
            "capacidade_kg": 3500,
        },
        {
            "ref": "m6",
            "nome": "Eduardo Martins Rocha",
            "email": "eduardo.rocha@email.com.br",
            "cpf": "471.025.683-92",
            "telefone": "(19) 99811-9047",
            "cidade": "Campinas/SP",
            "nota": 4.4,
            "viagens": 58,
            "verificado": False,
            "foto": "mot_6.jpg",
            "tipo_veiculo": "Carreta",
            "carroceria": "Tanque",
            "placa": "BAU-6E55",
            "capacidade_kg": 20000,
        },
    ]

    # ref_motorista (m1..m6) -> motorista_id no banco
    motorista_id_por_ref: dict[str, int] = {}
    motoristas_criados = 0
    veiculos_criados = 0

    for dados in motoristas_demo:
        usuario_existente = usuario_repo.obter_por_email(dados["email"])
        if usuario_existente is not None:
            usuario_id = usuario_existente.id
        else:
            usuario_id = usuario_repo.inserir(Usuario(
                id=0,
                nome=dados["nome"],
                email=dados["email"],
                senha=senha_hash,
                perfil=Perfil.MOTORISTA.value,
                telefone=dados["telefone"],
                foto_url=_foto_seed(dados["foto"]),
            ))
        if not usuario_id:
            logger.error(f"✗ Falha ao criar usuário motorista {dados['email']}")
            continue

        motorista_existente = motorista_repo.obter_por_usuario_id(usuario_id)
        if motorista_existente is not None:
            motorista_id_por_ref[dados["ref"]] = motorista_existente.id
            continue

        motorista_id = motorista_repo.inserir(Motorista(
            id=0,
            usuario_id=usuario_id,
            cpf=dados["cpf"],
            telefone=dados["telefone"],
            cidade=dados["cidade"],
            nota=dados["nota"],
            total_viagens=dados["viagens"],
            foto_url=_foto_seed(dados["foto"]),
            verificado=dados["verificado"],
        ))
        if not motorista_id:
            usuario_repo.excluir(usuario_id)  # rollback manual
            logger.error(f"✗ Falha ao criar motorista {dados['nome']} (rollback usuário)")
            continue
        motorista_id_por_ref[dados["ref"]] = motorista_id
        motoristas_criados += 1

        tipo_veiculo_id = tipos_veiculo.get(dados["tipo_veiculo"])
        tipo_carroceria_id = carrocerias.get(dados["carroceria"])
        if tipo_veiculo_id and tipo_carroceria_id:
            veiculo_id = veiculo_repo.inserir(Veiculo(
                id=0,
                motorista_id=motorista_id,
                tipo_veiculo_id=tipo_veiculo_id,
                tipo_carroceria_id=tipo_carroceria_id,
                placa=dados["placa"],
                capacidade_kg=dados["capacidade_kg"],
                ativo=True,
            ))
            if veiculo_id:
                veiculos_criados += 1
        else:
            logger.error(
                f"✗ Catálogo não resolvido p/ veículo de {dados['nome']} "
                f"({dados['tipo_veiculo']}/{dados['carroceria']})"
            )

    # =====================================================================
    # 3) CARGAS (espelham cargas.json) + interesses + escolhidos
    # =====================================================================
    cargas_demo = [
        {
            "ref": "c1", "empresa": "e1",
            "titulo": "Linha branca — geladeiras e fogões",
            "origem": "São Paulo/SP", "destino": "Curitiba/PR",
            "tipo_veiculo": "Caminhão", "carroceria": "Baú",
            "peso_kg": 8500, "volume_m3": 24.0, "valor_frete": 4200.0,
            "data_coleta": "22/06/2026",
            "descricao": "Carga paletizada de eletrodomésticos da linha branca. "
                         "Necessário uso de cintas e mantas para proteção. Descarga "
                         "no centro de distribuição em Curitiba com agendamento prévio.",
            "status": StatusCarga.DISPONIVEL,
            "interessados": ["m1", "m2", "m3"], "escolhido": None,
            "foto": "carga_1.jpg",
        },
        {
            "ref": "c2", "empresa": "e1",
            "titulo": "Bebidas paletizadas",
            "origem": "Jundiaí/SP", "destino": "Belo Horizonte/MG",
            "tipo_veiculo": "Carreta", "carroceria": "Sider",
            "peso_kg": 18000, "volume_m3": 32.0, "valor_frete": 5100.0,
            "data_coleta": "24/06/2026",
            "descricao": "Bebidas em paletes padrão PBR. Carregamento lateral. "
                         "Entrega em rede de supermercados na região metropolitana de BH.",
            "status": StatusCarga.DISPONIVEL,
            "interessados": ["m2"], "escolhido": None,
            "foto": "carga_2.jpg",
        },
        {
            "ref": "c3", "empresa": "e1",
            "titulo": "Autopeças e componentes",
            "origem": "Joinville/SC", "destino": "São Paulo/SP",
            "tipo_veiculo": "Caminhão", "carroceria": "Baú",
            "peso_kg": 6000, "volume_m3": 18.0, "valor_frete": 3900.0,
            "data_coleta": "18/06/2026",
            "descricao": "Autopeças embaladas em caixas. Carga de valor agregado, "
                         "exige veículo fechado e pontualidade na entrega.",
            "status": StatusCarga.CONTRATADA,
            "interessados": ["m1"], "escolhido": "m1",
            "foto": "carga_3.jpg",
        },
        {
            "ref": "c4", "empresa": "e1",
            "titulo": "Material de construção — cimento e blocos",
            "origem": "Campinas/SP", "destino": "Ribeirão Preto/SP",
            "tipo_veiculo": "Caminhão", "carroceria": "Aberto/Prancha",
            "peso_kg": 15000, "volume_m3": None, "valor_frete": 2400.0,
            "data_coleta": "10/06/2026",
            "descricao": "Material de construção em sacaria e paletes. Descarga "
                         "com Munck por conta do destinatário.",
            "status": StatusCarga.CONCLUIDA,
            "interessados": ["m1"], "escolhido": "m1",
            "foto": "carga_4.jpg",
        },
        {
            "ref": "c5", "empresa": "e1",
            "titulo": "Produtos de limpeza",
            "origem": "Sorocaba/SP", "destino": "Londrina/PR",
            "tipo_veiculo": "Caminhão", "carroceria": "Baú",
            "peso_kg": 7200, "volume_m3": 20.0, "valor_frete": 3300.0,
            "data_coleta": "26/06/2026",
            "descricao": "Produtos de limpeza em caixas. Carga seca, sem "
                         "exigências especiais de manuseio.",
            "status": StatusCarga.DISPONIVEL,
            "interessados": [], "escolhido": None,
            "foto": "carga_5.jpg",
        },
        {
            "ref": "c6", "empresa": "e2",
            "titulo": "Grãos de soja a granel",
            "origem": "Rondonópolis/MT", "destino": "Santos/SP",
            "tipo_veiculo": "Bitrem", "carroceria": "Graneleiro",
            "peso_kg": 32000, "volume_m3": None, "valor_frete": 9800.0,
            "data_coleta": "25/06/2026",
            "descricao": "Soja em grão para exportação. Descarga no porto de Santos. "
                         "Necessária lona e documentação fiscal completa.",
            "status": StatusCarga.DISPONIVEL,
            "interessados": ["m1"], "escolhido": None,
            "foto": "carga_6.jpg",
        },
        {
            "ref": "c7", "empresa": "e3",
            "titulo": "Laticínios refrigerados",
            "origem": "Uberlândia/MG", "destino": "Goiânia/GO",
            "tipo_veiculo": "Caminhão", "carroceria": "Refrigerado",
            "peso_kg": 12000, "volume_m3": 28.0, "valor_frete": 3600.0,
            "data_coleta": "23/06/2026",
            "descricao": "Queijos e iogurtes. Temperatura controlada entre 2°C e "
                         "6°C durante todo o transporte.",
            "status": StatusCarga.DISPONIVEL,
            "interessados": [], "escolhido": None,
            "foto": "carga_7.jpg",
        },
        {
            "ref": "c8", "empresa": "e4",
            "titulo": "Móveis planejados — desmontados",
            "origem": "Bento Gonçalves/RS", "destino": "Porto Alegre/RS",
            "tipo_veiculo": "Caminhão", "carroceria": "Baú",
            "peso_kg": 5400, "volume_m3": 22.0, "valor_frete": 1900.0,
            "data_coleta": "21/06/2026",
            "descricao": "Móveis planejados desmontados e embalados. Manuseio "
                         "cuidadoso, carga frágil.",
            "status": StatusCarga.DISPONIVEL,
            "interessados": [], "escolhido": None,
            "foto": "carga_8.jpg",
        },
        {
            "ref": "c9", "empresa": "e5",
            "titulo": "Diesel S10 a granel",
            "origem": "Paulínia/SP", "destino": "Bauru/SP",
            "tipo_veiculo": "Carreta", "carroceria": "Tanque",
            "peso_kg": 20000, "volume_m3": None, "valor_frete": 4500.0,
            "data_coleta": "27/06/2026",
            "descricao": "Transporte de diesel S10. Exige MOPP, veículo tanque e "
                         "documentação para produtos perigosos.",
            "status": StatusCarga.DISPONIVEL,
            "interessados": [], "escolhido": None,
            "foto": "carga_9.jpg",
        },
        {
            "ref": "c10", "empresa": "e1",
            "titulo": "Carga de teste — eletrônicos diversos",
            "origem": "Vitória/ES", "destino": "Rio de Janeiro/RJ",
            "tipo_veiculo": "Caminhão", "carroceria": "Baú",
            "peso_kg": 5500, "volume_m3": None, "valor_frete": 3800.0,
            "data_coleta": "30/06/2026",
            "descricao": "Carga de teste publicada via validação Playwright. "
                         "Manuseio cuidadoso.",
            "status": StatusCarga.DISPONIVEL,
            "interessados": [], "escolhido": None,
            "foto": "carga_10.jpg",
        },
    ]

    cargas_criadas = 0
    interesses_criados = 0
    escolhidos_definidos = 0

    for dados in cargas_demo:
        empresa_id = empresa_id_por_ref.get(dados["empresa"])
        tipo_veiculo_id = tipos_veiculo.get(dados["tipo_veiculo"])
        tipo_carroceria_id = carrocerias.get(dados["carroceria"])
        if not (empresa_id and tipo_veiculo_id and tipo_carroceria_id):
            logger.error(
                f"✗ Carga '{dados['titulo']}' não pôde resolver "
                f"empresa/catálogo; pulando."
            )
            continue

        # A carga é sempre inserida como DISPONIVEL (regra do repo); o status
        # final (Contratada/Concluída) é aplicado em seguida via definir_status.
        carga_id = carga_repo.inserir(Carga(
            id=0,
            empresa_id=empresa_id,
            titulo=dados["titulo"],
            origem=dados["origem"],
            destino=dados["destino"],
            tipo_veiculo_id=tipo_veiculo_id,
            tipo_carroceria_id=tipo_carroceria_id,
            valor_frete=dados["valor_frete"],
            descricao=dados["descricao"],
            status=StatusCarga.DISPONIVEL,
            peso_kg=dados["peso_kg"],
            volume_m3=dados["volume_m3"],
            data_coleta=dados["data_coleta"],
            foto_url=_foto_seed(dados["foto"]),
        ))
        if not carga_id:
            logger.error(f"✗ Falha ao inserir carga '{dados['titulo']}'")
            continue
        cargas_criadas += 1

        # Interesses dos motoristas.
        for ref_mot in dados["interessados"]:
            motorista_id = motorista_id_por_ref.get(ref_mot)
            if motorista_id and interesse_carga_repo.inserir(carga_id, motorista_id):
                interesses_criados += 1

        # Motorista escolhido (Contratada/Concluída).
        ref_escolhido = dados["escolhido"]
        if ref_escolhido:
            motorista_id = motorista_id_por_ref.get(ref_escolhido)
            if motorista_id and carga_repo.escolher_motorista(carga_id, motorista_id):
                escolhidos_definidos += 1
                # escolher_motorista move p/ Contratada; ajusta se Concluída.
                if dados["status"] == StatusCarga.CONCLUIDA:
                    carga_repo.definir_status(carga_id, StatusCarga.CONCLUIDA)
                elif dados["status"] not in (
                    StatusCarga.CONTRATADA, StatusCarga.CONCLUIDA
                ):
                    carga_repo.definir_status(carga_id, dados["status"])
        elif dados["status"] != StatusCarga.DISPONIVEL:
            # Status não-disponível sem escolhido (ex.: Cancelada).
            carga_repo.definir_status(carga_id, dados["status"])

    logger.info(
        "Seed demo GiroChoffer concluído: "
        f"{empresas_criadas} empresas, {motoristas_criados} motoristas, "
        f"{veiculos_criados} veículos, {cargas_criadas} cargas, "
        f"{interesses_criados} interesses, {escolhidos_definidos} contratações."
    )


def inicializar_dados():
    """Inicializa todos os dados seed"""
    logger.info("=" * 50)
    logger.info("Iniciando carga de dados seed...")
    logger.info("=" * 50)

    try:
        # Admin/usuários-base: SEMPRE carregados (dev e produção). É a única
        # forma de ter um administrador inicial num banco recém-criado.
        carregar_usuarios_seed()

        # Dados de DEMO de domínio (clientes/registros de exemplo): só em
        # desenvolvimento/QA. inicializar_dados() roda incondicionalmente no
        # startup, então sem este gate os dados de demo vazariam para produção
        # na primeira subida com banco vazio (ver docs/FORKING.md §10e).
        #
        # Fork: registre aqui suas funções carregar_<dominio>_demo() — elas
        # devem ser idempotentes (guarda de tabela vazia). Ex.:
        #     carregar_imoveis_demo()
        if IS_DEVELOPMENT:
            logger.info("Ambiente de desenvolvimento: seed de dados demo habilitado.")
            carregar_girochoffer_demo()
        else:
            logger.info("Ambiente de produção: seed de dados demo ignorado.")

        logger.info("=" * 50)
        logger.info("Dados seed carregados!")
        logger.info("=" * 50)
    except sqlite3.Error as e:
        logger.error(f"Erro crítico ao inicializar dados seed: {e}", exc_info=True)
