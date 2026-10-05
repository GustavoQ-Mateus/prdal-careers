export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SaudeController_health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SaudeController_ready"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/acoes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["AcoesController_atualizar"];
        trace?: never;
    };
    "/v1/acoes/{id}/cancelar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AcoesController_cancelar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/acoes/{id}/concluir": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AcoesController_concluir"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/senha": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_trocarSenha"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/sessao": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AuthController_sessao"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/candidaturas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CandidaturasController_listar"];
        put?: never;
        post: operations["CandidaturasController_criar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/candidaturas/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["CandidaturasController_atualizar"];
        trace?: never;
    };
    "/v1/conta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ContaController_buscar"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/conta/consentimento": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ContaController_consentir"];
        delete: operations["ContaController_revogar"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/conta/exclusao": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ContaController_agendarExclusao"];
        delete: operations["ContaController_cancelarExclusao"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/conta/exportacoes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ContaController_exportar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/conta/exportacoes/{jobId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ContaController_statusExportacao"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/contexto/reindexar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ContextoController_reindexar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/contexto/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ContextoController_status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/contexto/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ContextoController_upload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/copiloto/chat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["CopilotoController_chatSse"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/copiloto/conversas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CopilotoController_listarConversas"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/copiloto/conversas/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CopilotoController_buscarConversa"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/copiloto/mensagem-recrutador": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["CopilotoController_mensagemRecrutador"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/copiloto/respostas-formulario": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["CopilotoController_respostasFormulario"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/curriculos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CurriculosController_listar"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/curriculos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CurriculosController_buscar"];
        put: operations["CurriculosController_editar"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/curriculos/{id}/arquivos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["CurriculosController_gerarArquivos"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/curriculos/{id}/docx": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CurriculosController_docx"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/curriculos/{id}/pacote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CurriculosController_pacote"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/curriculos/{id}/pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CurriculosController_pdf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/geracoes-curriculo/{jobId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CurriculosController_status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/hoje": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HojeController_agenda"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/lotes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["LotesController_status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OportunidadesController_listar"];
        put?: never;
        post: operations["OportunidadesController_criar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/entradas/{id}/ativar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OportunidadesController_ativar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/importar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OportunidadesController_importar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OportunidadesController_buscar"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["OportunidadesController_atualizar"];
        trace?: never;
    };
    "/v1/oportunidades/{id}/acoes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AcoesController_listar"];
        put?: never;
        post: operations["AcoesController_criar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/{id}/analisar-ats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OportunidadesController_analisarAts"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/{id}/candidatura-principal": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OportunidadesController_candidaturaPrincipal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/{id}/curriculos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OportunidadesController_curriculosDaOportunidade"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/{id}/gerar-cv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OportunidadesController_gerarCv"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/{id}/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OportunidadesController_timeline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/{id}/timeline/notas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OportunidadesController_nota"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/{id}/transicoes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OportunidadesController_transicionar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oportunidades/{id}/workspace": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OportunidadesController_workspace"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/perfil-mestre": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PerfilController_buscar"];
        put: operations["PerfilController_salvar"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pipeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PipelineController_listar"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pipeline/grafo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PipelineController_grafo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/preferencias": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HojeController_preferencias"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["HojeController_atualizar"];
        trace?: never;
    };
    "/v1/taxonomia": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TaxonomiaController_listar"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AgendarExclusaoDto: {
            senha: string;
        };
        AtualizarAcaoDto: {
            lembrarEm?: string | null;
            principal?: boolean;
            tipo?: "REVISAR_VAGA" | "GERAR_CURRICULO" | "ENVIAR_CANDIDATURA" | "FAZER_FOLLOW_UP" | "PREPARAR_ENTREVISTA" | "PARTICIPAR_ENTREVISTA" | "ENVIAR_MATERIAL" | "OUTRO";
            titulo?: string;
            venceEm?: string | null;
        };
        AtualizarCandidaturaDto: {
            curriculoId?: string;
            notas?: string;
            status?: "RASCUNHO" | "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "REJEITADA" | "DESISTIU";
        };
        AtualizarOportunidadeDto: {
            arquivar?: boolean;
            descricao?: string;
            empresa?: string;
            fonte?: string;
            prioridade?: "BAIXA" | "MEDIA" | "ALTA";
            titulo?: string;
        };
        CadastroDto: {
            email: string;
            senha: string;
        };
        CertificacaoPerfilDto: {
            descricao: string;
            id: string;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
            titulo: string;
        };
        ChatDto: {
            confirmacao?: components["schemas"]["ConfirmacaoDto"];
            conversaId?: string;
            mensagem?: string;
            modo?: "assistido" | "autopiloto";
            oportunidadeId?: string;
        };
        ConfirmacaoDto: {
            ajustes?: {
                [key: string]: unknown;
            };
            callId: string;
            decisao: "confirmar" | "recusar";
        };
        CriarAcaoDto: {
            candidaturaId?: string;
            lembrarEm?: string;
            principal?: boolean;
            tipo: "REVISAR_VAGA" | "GERAR_CURRICULO" | "ENVIAR_CANDIDATURA" | "FAZER_FOLLOW_UP" | "PREPARAR_ENTREVISTA" | "PARTICIPAR_ENTREVISTA" | "ENVIAR_MATERIAL" | "OUTRO";
            titulo: string;
            venceEm?: string;
        };
        CriarCandidaturaDto: {
            curriculoId?: string;
            vagaId: string;
        };
        CriarOportunidadeDto: {
            descricao: string;
            empresa: string;
            fonte?: string;
            titulo: string;
        };
        EditarCurriculoDto: {
            markdown: string;
            rotulo?: string;
        };
        EmailPerfilDto: {
            id: string;
            principal: boolean;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
            valor: string;
        };
        EnderecoPerfilDto: {
            bairro?: string;
            cidade: string;
            complemento?: string;
            estado: string;
            legado?: string;
            logradouro?: string;
            pais: string;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
        };
        ExperienciaPerfilDto: {
            atual?: boolean;
            cargo: string;
            dataFimAno?: number | null;
            dataFimMes?: number | null;
            dataInicioAno?: number | null;
            dataInicioMes?: number | null;
            descricao: string;
            empresa: string;
            id: string;
            local?: (string | components["schemas"]["LocalPerfilDto"]) | null;
            localLegado?: string;
            periodo?: string;
            periodoLegado?: string;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
        };
        FormacaoPerfilDto: {
            curso: string;
            fimAno?: number | null;
            fimMes?: number | null;
            grau: string;
            id: string;
            inicioAno?: number | null;
            inicioMes?: number | null;
            instituicao: string;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
            status: "concluido" | "em_andamento" | "trancado" | "";
        };
        HealthResponseDto: {
            service: "api";
            status: "ok";
        };
        ImportarOportunidadesDto: {
            itens: components["schemas"]["ItemImportacaoDto"][];
        };
        ItemImportacaoDto: {
            descricao: string;
            empresa: string;
            fonte?: string;
            titulo: string;
        };
        LinkPerfilDto: {
            id: string;
            tipo: "linkedin" | "github" | "facebook" | "instagram" | "site";
            url: string;
        };
        LocalPerfilDto: {
            cidade: string;
            estado: string;
            pais: string;
        };
        LoginDto: {
            email: string;
            senha: string;
        };
        MensagemRecrutadorDto: {
            contexto?: string;
            oportunidadeId: string;
        };
        NotaTimelineDto: {
            descricao: string;
        };
        OutroContatoPerfilDto: {
            id: string;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
            rotulo: string;
            valor: string;
        };
        PatchPreferenciasDto: {
            fusoHorario?: string;
        };
        PerfilMestreDto: {
            certificacoes?: components["schemas"]["CertificacaoPerfilDto"][];
            emails: components["schemas"]["EmailPerfilDto"][];
            endereco?: (string | components["schemas"]["EnderecoPerfilDto"]) | null;
            experiencias: components["schemas"]["ExperienciaPerfilDto"][];
            formacao: components["schemas"]["FormacaoPerfilDto"][];
            idiomas?: string[];
            links: components["schemas"]["LinkPerfilDto"][];
            nome: string;
            outrosContatos?: components["schemas"]["OutroContatoPerfilDto"][];
            resumo: string;
            skills: string[];
            telefones: components["schemas"]["TelefonePerfilDto"][];
        };
        RespostaObjeto100Dto: {
            estado: "ok" | "indisponivel" | "desconhecido";
            nome: string;
            obrigatoria: false | true;
        };
        RespostaObjeto101Dto: {
            categorias: string[];
            niveis: string[];
        };
        RespostaObjeto10Dto: {
            id: string;
            rotulo: string;
            score: number | null;
        };
        RespostaObjeto11Dto: {
            id: string;
            titulo: string;
            venceEm: string | null;
        };
        RespostaObjeto12Dto: {
            consentimento: components["schemas"]["RespostaObjeto13Dto"];
            email: string;
            exclusaoAgendadaPara: string | null;
        };
        RespostaObjeto13Dto: {
            aceitoEm: string | null;
            provedor: string;
            regiao: string;
        };
        RespostaObjeto14Dto: {
            jobId: string;
        };
        RespostaObjeto15Dto: {
            expiraEm?: Record<string, never>;
            status: "PENDENTE" | "PROCESSANDO" | "ERRO";
            url?: Record<string, never>;
        };
        RespostaObjeto16Dto: {
            expiraEm: string;
            status: "CONCLUIDO";
            url: string;
        };
        RespostaObjeto17Dto: {
            exclusaoAgendadaPara: string;
        };
        RespostaObjeto18Dto: {
            loteId: string;
            total: number;
        };
        RespostaObjeto19Dto: {
            loteId: string;
            total: number;
        };
        RespostaObjeto1Dto: {
            atualizadoEm: string;
            canceladaEm: string | null;
            candidaturaId: string | null;
            concluidaEm: string | null;
            criadoEm: string;
            id: string;
            lembrarEm: string | null;
            lembreteEnviadoEm: string | null;
            principal: false | true;
            tipo: "REVISAR_VAGA" | "GERAR_CURRICULO" | "ENVIAR_CANDIDATURA" | "FAZER_FOLLOW_UP" | "PREPARAR_ENTREVISTA" | "PARTICIPAR_ENTREVISTA" | "ENVIAR_MATERIAL" | "OUTRO";
            titulo: string;
            usuarioId: string;
            vagaId: string;
            venceEm: string | null;
        };
        RespostaObjeto20Dto: {
            disponivel: false | true;
            documentos: number;
            porOrigem: components["schemas"]["RespostaObjeto21Dto"];
            ultimaIndexacao: string | null;
        };
        RespostaObjeto21Dto: {
            candidatura: number;
            nota: number;
            perfil: number;
        };
        RespostaObjeto22Dto: {
            atualizadoEm: string;
            criadoEm: string;
            id: string;
            modo: "assistido" | "autopiloto";
            oportunidadeId: string | null;
            titulo: string;
            totalMensagens: number;
            ultimaMensagem: string;
        };
        RespostaObjeto23Dto: {
            atualizadoEm: string;
            criadoEm: string;
            id: string;
            mensagens: components["schemas"]["RespostaObjeto24Dto"][];
            modo: "assistido" | "autopiloto";
            oportunidadeId: string | null;
            pendencia: components["schemas"]["RespostaObjeto33Dto"] | null;
        };
        RespostaObjeto24Dto: {
            blocos?: (components["schemas"]["RespostaObjeto25Dto"] | components["schemas"]["RespostaObjeto26Dto"] | components["schemas"]["RespostaObjeto27Dto"] | components["schemas"]["RespostaObjeto28Dto"] | components["schemas"]["RespostaObjeto29Dto"])[];
            conteudo: string;
            dados?: components["schemas"]["RespostaObjeto30Dto"];
            papel: "user" | "assistant" | "tool" | "evento";
            tool?: string | null;
        };
        RespostaObjeto25Dto: {
            text: string;
            type: "text";
        };
        RespostaObjeto26Dto: {
            id: string;
            input: {
                [key: string]: unknown;
            };
            name: string;
            type: "tool_use";
        };
        RespostaObjeto27Dto: {
            content: string;
            is_error?: false | true;
            tool_use_id: string;
            type: "tool_result";
        };
        RespostaObjeto28Dto: {
            signature: string;
            thinking: string;
            type: "thinking";
        };
        RespostaObjeto29Dto: {
            data: string;
            type: "redacted_thinking";
        };
        RespostaObjeto2Dto: {
            mensagem: "cadastro recebido; entre com seu e-mail e senha";
        };
        RespostaObjeto30Dto: {
            args?: {
                [key: string]: unknown;
            };
            callId?: string;
            efeito?: "leitura" | "escrita" | "entrega_externa";
            entrega?: components["schemas"]["RespostaObjeto31Dto"];
            erro?: string;
            escopo?: string;
            etapa?: 1 | 3;
            evento?: "erro" | "cancelado";
            jobId?: string;
            narracao?: components["schemas"]["RespostaObjeto32Dto"];
            ok?: false | true;
            origem?: "geracao_assincrona";
            resultado?: unknown;
        };
        RespostaObjeto31Dto: {
            destino?: string;
            texto: string;
            tipo: string;
            titulo: string;
        };
        RespostaObjeto32Dto: {
            degradacao: string | null;
            keywordsAusentes: string[];
            keywordsAusentesIniciais: string[];
            keywordsCobertas: string[];
            keywordsEncontradas: string[];
            pontosDeAtencao: string[];
            scoreFinal: number;
            scoreInicial: number;
            veredicto: string;
        };
        RespostaObjeto33Dto: {
            args: {
                [key: string]: unknown;
            };
            callId: string;
            efeito: "escrita";
            executando?: false | true;
            resumo?: string;
            tool: string;
        };
        RespostaObjeto34Dto: {
            destino: string;
            texto: string;
            tipo: "mensagem_recrutador";
            titulo: string;
        };
        RespostaObjeto35Dto: {
            respostas: components["schemas"]["RespostaObjeto36Dto"][];
            texto: string;
            tipo: "resposta_formulario";
            titulo: string;
        };
        RespostaObjeto36Dto: {
            campo: string;
            texto: string;
        };
        RespostaObjeto37Dto: {
            itens: components["schemas"]["RespostaObjeto38Dto"][];
            limit: number | null;
            offset: number;
            total: number;
        };
        RespostaObjeto38Dto: {
            analiseFinal: unknown;
            analiseInicial: unknown;
            breakdown: unknown;
            categoria: string | null;
            degradacao: string | null;
            downloadDocxUrl: string | null;
            downloadPdfUrl: string | null;
            geradoEm: string;
            id: string;
            nivel: string | null;
            oportunidade: components["schemas"]["RespostaObjeto39Dto"];
            rotulo: string;
            score: number | null;
            vagaId: string;
            vinculo: components["schemas"]["RespostaObjeto40Dto"] | null;
        };
        RespostaObjeto39Dto: {
            empresa: string;
            id: string;
            titulo: string;
        };
        RespostaObjeto3Dto: {
            csrfToken: string;
            usuario: components["schemas"]["RespostaObjeto4Dto"];
        };
        RespostaObjeto40Dto: {
            candidaturaId: string;
            principal: false | true;
            status: "RASCUNHO" | "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "REJEITADA" | "DESISTIU";
        };
        RespostaObjeto41Dto: {
            curriculoId: string | null;
            erro: string | null;
            etapas: components["schemas"]["RespostaObjeto42Dto"];
            id: string;
            status: "PENDENTE" | "ERRO" | "ANALISANDO" | "GERANDO" | "VALIDANDO" | "CONCLUIDA";
            vagaId: string;
        };
        RespostaObjeto42Dto: {
            analiseFinal: unknown;
            analiseInicial: unknown;
            degradacao: string | null;
            reescrita: false | true;
        };
        RespostaObjeto43Dto: {
            analiseFinal: unknown;
            analiseInicial: unknown;
            breakdown: unknown;
            degradacao: string | null;
            downloadDocxUrl: string | null;
            downloadPdfUrl: string | null;
            geradoEm: string;
            id: string;
            markdown: string;
            oportunidade: components["schemas"]["RespostaObjeto44Dto"];
            rotulo: string;
            score: number | null;
            vagaId: string;
            vinculo: components["schemas"]["RespostaObjeto45Dto"];
        };
        RespostaObjeto44Dto: Record<string, never>;
        RespostaObjeto45Dto: Record<string, never>;
        RespostaObjeto46Dto: {
            expiraEm: string;
            url: string;
        };
        RespostaObjeto47Dto: {
            atividadeRecente: unknown[];
            atrasadas: unknown[];
            entrada: components["schemas"]["RespostaObjeto53Dto"][];
            fimDia: string;
            fusoHorario: string;
            geracoesConcluidas: components["schemas"]["RespostaObjeto52Dto"][];
            hoje: unknown[];
            inicioDia: string;
            proximosDias: unknown[];
            resumoAts: components["schemas"]["RespostaObjeto49Dto"];
            semProximoPasso: components["schemas"]["RespostaObjeto48Dto"][];
            serieTemporal: components["schemas"]["RespostaObjeto50Dto"];
        };
        RespostaObjeto48Dto: {
            empresa: string;
            id: string;
            titulo: string;
        };
        RespostaObjeto49Dto: {
            comScore: number;
            curriculos: number;
            media: number | null;
        };
        RespostaObjeto4Dto: {
            email: string;
            id: string;
        };
        RespostaObjeto50Dto: {
            fim: string;
            inicio: string;
            periodoDias: 7 | 30 | 90;
            pontos: components["schemas"]["RespostaObjeto51Dto"][];
        };
        RespostaObjeto51Dto: {
            acoesConcluidas: number;
            curriculosGerados: number;
            data: string;
            oportunidadesCriadas: number;
            scoreMedio: number | null;
        };
        RespostaObjeto52Dto: {
            concluidaEm: string;
            curriculoId: string;
            empresa: string;
            oportunidadeId: string;
            score: number | null;
            titulo: string;
        };
        RespostaObjeto53Dto: {
            criadoEm: string;
            empresa: string;
            id: string;
            titulo: string;
        };
        RespostaObjeto54Dto: {
            atualizadoEm: string;
            fusoHorario: string;
            usuarioId: string;
        };
        RespostaObjeto55Dto: {
            id: string;
            itens: components["schemas"]["RespostaObjeto56Dto"][];
            processados: number;
            status: "PENDENTE" | "PROCESSANDO" | "CONCLUIDO";
            tipo: string;
            total: number;
        };
        RespostaObjeto56Dto: {
            bancoVagaId: string | null;
            erro: string | null;
            id: string;
            status: "PENDENTE" | "PROCESSANDO" | "CONCLUIDO" | "ERRO";
        };
        RespostaObjeto57Dto: {
            itens: components["schemas"]["RespostaObjeto58Dto"][];
            limit: number | null;
            offset: number;
            total: number;
        };
        RespostaObjeto58Dto: {
            apresentacao: "ENTRADA";
            categoria: string | null;
            curriculoVinculado: Record<string, never> | null;
            empresa: string;
            etapa: Record<string, never> | null;
            id: string;
            keywords: unknown;
            keywordsStatus: "PENDENTE" | "VALIDAS";
            nivel: string | null;
            origem: "IMPORTACAO";
            prioridade: Record<string, never> | null;
            proximoPasso: Record<string, never> | null;
            score: Record<string, never> | null;
            tipo: "ENTRADA";
            titulo: string;
            ultimaAtividade: string;
        };
        RespostaObjeto59Dto: {
            itens: components["schemas"]["RespostaObjeto60Dto"][];
            limit: number;
            offset: number;
            total: number;
        };
        RespostaObjeto5Dto: {
            csrfToken: string;
        };
        RespostaObjeto60Dto: {
            apresentacao: "ENTRADA" | "ATIVA" | "ENCERRADA";
            arquivadaEm: string | null;
            categoria: string | null;
            curriculoVinculado: components["schemas"]["RespostaObjeto61Dto"] | null;
            empresa: string;
            etapa: "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "PREPARACAO" | "ENCERRADAS";
            id: string;
            keywords: unknown;
            keywordsErro: string | null;
            keywordsExtracao: "PENDENTE" | "ERRO" | "EXTRAINDO" | "PRONTAS";
            keywordsStatus: "PENDENTE" | "VALIDAS";
            nivel: string | null;
            origem: "MANUAL" | "IMPORTACAO";
            prioridade: "BAIXA" | "MEDIA" | "ALTA";
            proximoPasso: components["schemas"]["RespostaObjeto62Dto"] | null;
            score: number | null;
            statusCandidatura: "RASCUNHO" | "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "REJEITADA" | "DESISTIU";
            tipo: "OPORTUNIDADE";
            titulo: string;
            ultimaAtividade: string;
        };
        RespostaObjeto61Dto: {
            id: string;
            rotulo: string;
            score: number | null;
        };
        RespostaObjeto62Dto: {
            canceladaEm: string | null;
            concluidaEm: string | null;
            id: string;
            lembrarEm: string | null;
            principal: false | true;
            tipo: string;
            titulo: string;
            venceEm: string | null;
        };
        RespostaObjeto63Dto: {
            itens: components["schemas"]["RespostaObjeto60Dto"][];
            limit: Record<string, never> | null;
            offset: number;
            total: number;
        };
        RespostaObjeto64Dto: {
            arquivadaEm: string | null;
            atualizadoEm: string;
            categoria: string | null;
            criadoEm: string;
            descricao: string;
            empresa: string;
            estagio: "ENTRADA" | "ATIVA";
            fonte: string | null;
            id: string;
            keywords: unknown;
            keywordsErro: string | null;
            keywordsExtracao: "PENDENTE" | "ERRO" | "EXTRAINDO" | "PRONTAS";
            keywordsStatus: "PENDENTE" | "VALIDAS";
            nivel: string | null;
            origem: "MANUAL" | "IMPORTACAO";
            origemImportacaoId: string | null;
            prioridade: "BAIXA" | "MEDIA" | "ALTA";
            titulo: string;
            usuarioId: string;
        };
        RespostaObjeto65Dto: {
            loteId: string;
            total: number;
        };
        RespostaObjeto66Dto: {
            acaoPrincipal: components["schemas"]["RespostaObjeto1Dto"] | null;
            acoes: components["schemas"]["RespostaObjeto1Dto"][];
            candidatura: components["schemas"]["RespostaObjeto68Dto"] | null;
            curriculos: components["schemas"]["RespostaObjeto72Dto"][];
            oportunidade: components["schemas"]["RespostaObjeto67Dto"];
            timeline: components["schemas"]["RespostaObjeto73Dto"][];
        };
        RespostaObjeto67Dto: {
            apresentacao: "ENTRADA" | "ATIVA" | "ENCERRADA";
            arquivadaEm: string | null;
            atualizadoEm: string;
            categoria: string | null;
            criadoEm: string;
            curriculoVinculado: components["schemas"]["RespostaObjeto61Dto"] | null;
            descricao: string;
            empresa: string;
            etapa: "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "PREPARACAO" | "ENCERRADAS";
            fonte: string | null;
            id: string;
            keywords: unknown;
            keywordsErro: string | null;
            keywordsExtracao: "PENDENTE" | "ERRO" | "EXTRAINDO" | "PRONTAS";
            keywordsStatus: "PENDENTE" | "VALIDAS";
            nivel: string | null;
            origem: "MANUAL" | "IMPORTACAO";
            prioridade: "BAIXA" | "MEDIA" | "ALTA";
            proximoPasso: components["schemas"]["RespostaObjeto62Dto"] | null;
            score: number | null;
            statusCandidatura: "RASCUNHO" | "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "REJEITADA" | "DESISTIU";
            tipo: "OPORTUNIDADE";
            titulo: string;
            ultimaAtividade: string;
        };
        RespostaObjeto68Dto: {
            curriculoId: string | null;
            encerradaEm: string | null;
            enviadaEm: string | null;
            id: string;
            motivoEncerramento: string | null;
            notas: string;
            principal: false | true;
            status: "RASCUNHO" | "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "REJEITADA" | "DESISTIU";
            vinculo: components["schemas"]["RespostaObjeto69Dto"] | components["schemas"]["RespostaObjeto70Dto"] | components["schemas"]["RespostaObjeto71Dto"];
        };
        RespostaObjeto69Dto: {
            curriculoId: string;
            rotulo: string;
            score: number | null;
            situacao: string;
        };
        RespostaObjeto6Dto: {
            csrfToken: string;
            usuario: components["schemas"]["RespostaObjeto7Dto"];
        };
        RespostaObjeto70Dto: {
            curriculoId: string;
            rotulo?: Record<string, never>;
            score?: Record<string, never>;
            situacao: string;
        };
        RespostaObjeto71Dto: {
            curriculoId: Record<string, never> | null;
            rotulo?: Record<string, never>;
            score?: Record<string, never>;
            situacao: string;
        };
        RespostaObjeto72Dto: {
            geradoEm: string;
            id: string;
            rotulo: string;
            score: number | null;
        };
        RespostaObjeto73Dto: {
            candidaturaId: string | null;
            curriculoId: string | null;
            dados: unknown;
            descricao: string;
            id: string;
            ocorridoEm: string;
            origem: "SISTEMA" | "USUARIO";
            registradoEm: string;
            tipo: string;
            usuarioId: string;
            vagaId: string;
        };
        RespostaObjeto74Dto: {
            itens: components["schemas"]["RespostaObjeto73Dto"][];
            proximoCursor: string | null;
        };
        RespostaObjeto75Dto: {
            candidatura: components["schemas"]["RespostaObjeto8Dto"];
            evento: components["schemas"]["RespostaObjeto73Dto"] | null;
            oportunidade: components["schemas"]["RespostaObjeto76Dto"];
        };
        RespostaObjeto76Dto: {
            arquivadaEm: string | null;
            atualizadoEm: string;
            categoria: string | null;
            criadoEm: string;
            descricao: string;
            empresa: string;
            estagio: "ENTRADA" | "ATIVA";
            fonte: string | null;
            id: string;
            keywords: unknown;
            keywordsErro: string | null;
            keywordsExtracao: "PENDENTE" | "ERRO" | "EXTRAINDO" | "PRONTAS";
            keywordsStatus: "PENDENTE" | "VALIDAS";
            nivel: string | null;
            origem: "MANUAL" | "IMPORTACAO";
            origemImportacaoId: string | null;
            prioridade: "BAIXA" | "MEDIA" | "ALTA";
            titulo: string;
            usuarioId: string;
        };
        RespostaObjeto77Dto: {
            curriculoId: string | null;
            jobId: string;
            status: "PENDENTE" | "ERRO" | "ANALISANDO" | "GERANDO" | "VALIDANDO" | "CONCLUIDA";
        };
        RespostaObjeto78Dto: {
            curriculoId?: Record<string, never>;
            jobId: string;
            status?: Record<string, never>;
        };
        RespostaObjeto79Dto: {
            breakdown: components["schemas"]["RespostaObjeto80Dto"];
            degradacao?: string;
            keywordsCriticasAusentes: string[];
            keywordsEncontradas: string[];
            pontosEliminatorios: string[];
            score: number;
            scoreVersao?: number;
            veredicto: string;
        };
        RespostaObjeto7Dto: {
            email: string;
            id: string;
        };
        RespostaObjeto80Dto: {
            densidade: number;
            faltando: string[];
            keywordMatch: number;
            secoes: number;
        };
        RespostaObjeto81Dto: {
            analiseFinal: unknown;
            analiseInicial: unknown;
            breakdown: unknown;
            degradacao: string | null;
            geradoEm: string;
            id: string;
            rotulo: string;
            score: number | null;
        };
        RespostaObjeto82Dto: {
            atualizadoEm: string;
            certificacoes: components["schemas"]["RespostaObjeto86Dto"][];
            emails: components["schemas"]["RespostaObjeto87Dto"][];
            endereco: components["schemas"]["RespostaObjeto90Dto"] | null;
            experiencias: components["schemas"]["RespostaObjeto83Dto"][];
            formacao: components["schemas"]["RespostaObjeto85Dto"][];
            id: string;
            idiomas: string[];
            links: components["schemas"]["RespostaObjeto89Dto"][];
            nome: string;
            outrosContatos: components["schemas"]["RespostaObjeto91Dto"][];
            resumo: string;
            skills: string[];
            telefones: components["schemas"]["RespostaObjeto88Dto"][];
            usuarioId: string;
        };
        RespostaObjeto83Dto: {
            atual: false | true;
            cargo: string;
            dataFimAno: number | null;
            dataFimMes: number | null;
            dataInicioAno: number | null;
            dataInicioMes: number | null;
            descricao: string;
            empresa: string;
            id: string;
            local: components["schemas"]["RespostaObjeto84Dto"] | null;
            localLegado?: string;
            periodoLegado?: string;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
        };
        RespostaObjeto84Dto: {
            cidade: string;
            estado: string;
            pais: string;
        };
        RespostaObjeto85Dto: {
            curso: string;
            fimAno: number | null;
            fimMes: number | null;
            grau: string;
            id: string;
            inicioAno: number | null;
            inicioMes: number | null;
            instituicao: string;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
            status: "" | "concluido" | "em_andamento" | "trancado";
        };
        RespostaObjeto86Dto: {
            descricao: string;
            id: string;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
            titulo: string;
        };
        RespostaObjeto87Dto: {
            id: string;
            principal: false | true;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
            valor: string;
        };
        RespostaObjeto88Dto: {
            ddi: string;
            id: string;
            numero: string;
            principal: false | true;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
        };
        RespostaObjeto89Dto: {
            id: string;
            tipo: "linkedin" | "github" | "facebook" | "instagram" | "site";
            url: string;
        };
        RespostaObjeto8Dto: {
            atualizadoEm: string;
            criadoEm: string;
            curriculoId: string | null;
            encerradaEm: string | null;
            enviadaEm: string | null;
            id: string;
            motivoEncerramento: string | null;
            notas: string;
            principal: false | true;
            status: "RASCUNHO" | "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "REJEITADA" | "DESISTIU";
            vagaId: string;
        };
        RespostaObjeto90Dto: {
            bairro?: string;
            cidade: string;
            complemento?: string;
            estado: string;
            legado?: string;
            logradouro?: string;
            pais: string;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
        };
        RespostaObjeto91Dto: {
            id: string;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
            rotulo: string;
            valor: string;
        };
        RespostaObjeto92Dto: {
            apresentacao: "ENTRADA" | "ATIVA" | "ENCERRADA";
            arquivadaEm: string | null;
            categoria: string | null;
            curriculo: components["schemas"]["RespostaObjeto93Dto"] | null;
            empresa: string;
            etapa: "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "PREPARACAO" | "ENCERRADAS";
            id: string;
            keywords: unknown;
            nivel: string | null;
            prioridade: "BAIXA" | "MEDIA" | "ALTA";
            proximoPasso: components["schemas"]["RespostaObjeto1Dto"];
            score: number | null;
            statusCandidatura: "RASCUNHO" | "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "REJEITADA" | "DESISTIU";
            titulo: string;
            ultimaAtividade: string;
        };
        RespostaObjeto93Dto: {
            id: string;
            rotulo: string;
            score: number | null;
        };
        RespostaObjeto94Dto: {
            edges: components["schemas"]["RespostaObjeto96Dto"][];
            facets: components["schemas"]["RespostaObjeto97Dto"];
            nodes: components["schemas"]["RespostaObjeto95Dto"][];
            schemaVersion: string;
        };
        RespostaObjeto95Dto: {
            id: string;
            rotulo: string;
            tipo: string;
        };
        RespostaObjeto96Dto: {
            destino: string;
            id: string;
            origem: string;
            tipo: string;
        };
        RespostaObjeto97Dto: {
            categorias: string[];
            empresas: string[];
            niveis: string[];
            skills: string[];
        };
        RespostaObjeto99Dto: {
            dependencias: components["schemas"]["RespostaObjeto100Dto"][];
            servico: "api";
            status: "pronto" | "indisponivel";
        };
        RespostaObjeto9Dto: {
            atualizadoEm: string;
            curriculo: components["schemas"]["RespostaObjeto10Dto"] | null;
            curriculoId: string | null;
            empresa: string;
            id: string;
            notas: string;
            principal: false | true;
            proximoPasso: components["schemas"]["RespostaObjeto11Dto"] | null;
            status: "RASCUNHO" | "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "REJEITADA" | "DESISTIU";
            tituloVaga: string;
            vagaId: string;
        };
        RespostasFormularioDto: {
            campos: string[];
            oportunidadeId: string;
        };
        TelefonePerfilDto: {
            ddi: string;
            id: string;
            numero: string;
            principal: boolean;
            revisao?: ("formato_antigo" | "periodo_texto" | "local_texto" | "tecnologias_na_descricao" | "ddi_ausente" | "localizacao_texto" | "contato_sem_tipo" | "email_invalido")[];
        };
        TransicaoDto: {
            destino: "PREPARACAO" | "INSCRITA" | "EM_PROCESSO" | "ENTREVISTA" | "OFERTA" | "REJEITADA" | "DESISTIU" | "ARQUIVADA" | "REABRIR";
            motivo?: string;
        };
        TrocaSenhaDto: {
            novaSenha: string;
            senhaAtual: string;
        };
        UploadContextoDto: {
            arquivos?: string[];
            historico?: (boolean | ("true" | "false" | "")) | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    SaudeController_health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponseDto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponseDto"];
                };
            };
        };
    };
    SaudeController_ready: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto99Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    AcoesController_atualizar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AtualizarAcaoDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto1Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AcoesController_cancelar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto1Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AcoesController_concluir: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto1Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto3Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_refresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto5Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CadastroDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto2Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_trocarSenha: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TrocaSenhaDto"];
            };
        };
        responses: {
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_sessao: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto6Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CandidaturasController_listar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto9Dto"][];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CandidaturasController_criar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CriarCandidaturaDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto8Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CandidaturasController_atualizar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AtualizarCandidaturaDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto8Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContaController_buscar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto12Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContaController_consentir: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContaController_revogar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContaController_agendarExclusao: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgendarExclusaoDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto17Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContaController_cancelarExclusao: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContaController_exportar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto14Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContaController_statusExportacao: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto15Dto"] | components["schemas"]["RespostaObjeto16Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    ContextoController_reindexar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto18Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContextoController_status: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto20Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ContextoController_upload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["UploadContextoDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto19Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CopilotoController_chatSse: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChatDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": string;
                };
            };
        };
    };
    CopilotoController_listarConversas: {
        parameters: {
            query?: {
                oportunidadeId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto22Dto"][];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CopilotoController_buscarConversa: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto23Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CopilotoController_mensagemRecrutador: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MensagemRecrutadorDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto34Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CopilotoController_respostasFormulario: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RespostasFormularioDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto35Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CurriculosController_listar: {
        parameters: {
            query?: {
                vagaId?: string;
                scoreMinimo?: string;
                vinculado?: string;
                categoria?: string;
                nivel?: string;
                ordenarPor?: string;
                de?: string;
                ate?: string;
                limit?: string;
                offset?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto37Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CurriculosController_buscar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto43Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CurriculosController_editar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditarCurriculoDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto43Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CurriculosController_gerarArquivos: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto43Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CurriculosController_docx: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto46Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    CurriculosController_pacote: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto46Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    CurriculosController_pdf: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto46Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    CurriculosController_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jobId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto41Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HojeController_agenda: {
        parameters: {
            query?: {
                de?: string;
                ate?: string;
                periodo?: "7" | "30" | "90";
            };
            header: {
                "x-timezone": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto47Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    LotesController_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto55Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_listar: {
        parameters: {
            query?: {
                visao?: string;
                busca?: string;
                categoria?: string;
                nivel?: string;
                prioridade?: string;
                ordenarPor?: string;
                ordenarDirecao?: string;
                limit?: string;
                offset?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto57Dto"] | components["schemas"]["RespostaObjeto59Dto"] | components["schemas"]["RespostaObjeto63Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    OportunidadesController_criar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CriarOportunidadeDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto64Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_ativar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto64Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_importar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ImportarOportunidadesDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto65Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_buscar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto67Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_atualizar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AtualizarOportunidadeDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto64Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AcoesController_listar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto1Dto"][];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AcoesController_criar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CriarAcaoDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto1Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_analisarAts: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto79Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    OportunidadesController_candidaturaPrincipal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto8Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_curriculosDaOportunidade: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto81Dto"][];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_gerarCv: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto77Dto"] | components["schemas"]["RespostaObjeto78Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    OportunidadesController_timeline: {
        parameters: {
            query?: {
                cursor?: string;
                limite?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto74Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_nota: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NotaTimelineDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto73Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_transicionar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransicaoDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto75Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OportunidadesController_workspace: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto66Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PerfilController_buscar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto82Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    PerfilController_salvar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PerfilMestreDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto82Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
        };
    };
    PipelineController_listar: {
        parameters: {
            query?: {
                busca?: string;
                apresentacao?: string;
                statusCandidatura?: string;
                categoria?: string;
                nivel?: string;
                empresa?: string;
                prioridade?: string;
                comCurriculo?: string;
                scoreMinimo?: number;
                prazo?: string;
                atividadeDesde?: string;
                ordenarPor?: string;
                ordenarDirecao?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto92Dto"][];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PipelineController_grafo: {
        parameters: {
            query?: {
                busca?: string;
                apresentacao?: string;
                statusCandidatura?: string;
                categoria?: string;
                nivel?: string;
                empresa?: string;
                prioridade?: string;
                comCurriculo?: string;
                scoreMinimo?: number;
                prazo?: string;
                atividadeDesde?: string;
                ordenarPor?: string;
                ordenarDirecao?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto94Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HojeController_preferencias: {
        parameters: {
            query?: never;
            header: {
                "x-timezone": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto54Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HojeController_atualizar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchPreferenciasDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto54Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TaxonomiaController_listar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespostaObjeto101Dto"];
                };
            };
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
