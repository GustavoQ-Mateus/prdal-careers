export interface paths {
    "/analisar-ats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["analisar_analisar_ats_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/classify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["classify_classify_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/classify/taxonomy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["classify_taxonomy_classify_taxonomy_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/copiloto/redigir-formulario": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["copiloto_redigir_formulario_copiloto_redigir_formulario_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/copiloto/redigir-mensagem": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["copiloto_redigir_mensagem_copiloto_redigir_mensagem_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/copiloto/turn": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["copiloto_turn_copiloto_turn_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/copiloto/turn/stream": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["copiloto_turn_stream_copiloto_turn_stream_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/embeddings/consultas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["embeddings_consultas_embeddings_consultas_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/embeddings/documentos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["embeddings_documentos_embeddings_documentos_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/generate-cv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["generate_generate_cv_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/geracao/{passo}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["geracao_passo_geracao__passo__post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["health_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/keywords": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["keywords_keywords_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/keywords/lote/interpretar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["interpretar_keywords_lote_keywords_lote_interpretar_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/keywords/lote/preparar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["preparar_keywords_lote_keywords_lote_preparar_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rag/filtrar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["rag_filtrar_rag_filtrar_post"];
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
        get: operations["ready_ready_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reduzir-curriculo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reduzir_reduzir_curriculo_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/score": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["score_score_post"];
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
        AtsAnalysis: {
            breakdown: Record<string, never>;
            keywordsCriticasAusentes: string[];
            keywordsEncontradas: string[];
            pontosEliminatorios: string[];
            score: number;
            scoreVersao: number;
            veredicto: string;
        };
        BlocoNativo: {
            type: "text" | "tool_use" | "tool_result" | "thinking" | "redacted_thinking";
        } & {
            [key: string]: unknown;
        };
        CategoriaCompetencias: {
            categoria: string;
            termos: components["schemas"]["TermoFonte"][];
        };
        Certificacao: {
            descricao: string;
            titulo: string;
        };
        ChunkComVetor: {
            documentoId: string;
            fonteId: string;
            indice: number;
            texto: string;
            vetor: number[];
        };
        ClassifyRequest: {
            descricao: string;
            titulo: string;
        };
        ClassifyResponse: {
            categoria: string;
            nivel: string;
        };
        ConsultaComTrechos: {
            consulta: string;
            trechos: components["schemas"]["TrechoCandidato"][];
        };
        DependenciaResponse: {
            estado: "ok" | "indisponivel" | "desconhecido";
            nome: string;
            obrigatoria: boolean;
        };
        DocumentoParaEmbedding: {
            id: string;
            origemId: string;
            texto: string;
            tipo: "experiencia" | "resumo" | "skills" | "formacao" | "certificacao" | "idiomas" | "nota" | "candidatura";
        };
        EmailContato: {
            principal: boolean;
            valor: string;
        };
        EmbeddingConsultasRequest: {
            consultas: string[];
        };
        EmbeddingConsultasResponse: {
            dimensao: number;
            modelo: string;
            vetores: number[][];
        };
        EmbeddingDocumentosRequest: {
            documentos: components["schemas"]["DocumentoParaEmbedding"][];
        };
        EmbeddingDocumentosResponse: {
            chunks: components["schemas"]["ChunkComVetor"][];
            dimensao: number;
            modelo: string;
        };
        ErroLoteResponse: {
            erro: string;
            id: string;
        };
        "EstruturaCurriculo-Input": {
            competencias: components["schemas"]["CategoriaCompetencias"][];
            experiencias: components["schemas"]["ExperienciaEstruturada"][];
            experienciasOmitidas: string[];
            resumo: components["schemas"]["FraseFonte"][];
            titulo?: components["schemas"]["FraseFonte"] | null;
        };
        "EstruturaCurriculo-Output": {
            competencias: components["schemas"]["CategoriaCompetencias"][];
            experiencias: components["schemas"]["ExperienciaEstruturada"][];
            experienciasOmitidas: string[];
            resumo: components["schemas"]["FraseFonte"][];
            titulo?: components["schemas"]["FraseFonte"] | null;
        };
        ExperienciaEstruturada: {
            bullets: components["schemas"]["FraseFonte"][];
            experienciaId: string;
        };
        ExperienciaPerfil: {
            atual: boolean;
            cargo: string;
            dataFimAno?: number | null;
            dataFimMes?: number | null;
            dataInicioAno?: number | null;
            dataInicioMes?: number | null;
            descricao: string;
            empresa: string;
            id: string;
            local?: components["schemas"]["Local"] | null;
            localLegado: string;
            periodoLegado: string;
            realizacoes: string[];
            texto: string;
        };
        FiltroTrechosRequest: {
            consultas: components["schemas"]["ConsultaComTrechos"][];
        };
        FiltroTrechosResponse: {
            consultas: components["schemas"]["TrechosAceitos"][];
        };
        FonteContexto: {
            factual: boolean;
            id: string;
            texto: string;
            tipo: "experiencia" | "resumo" | "skills" | "formacao" | "certificacao" | "idiomas" | "nota" | "candidatura";
            titulo: string;
        };
        Formacao: {
            curso: string;
            fimAno?: number | null;
            fimMes?: number | null;
            grau: string;
            inicioAno?: number | null;
            inicioMes?: number | null;
            instituicao: string;
            status: string;
        };
        FraseFonte: {
            fontes: string[];
            texto: string;
        };
        GenerateCvRequest: {
            contexto: components["schemas"]["FonteContexto"][];
            keywords: components["schemas"]["Keyword"][];
            perfilMestre: components["schemas"]["PerfilMestre"];
            vaga: components["schemas"]["Vaga"];
        };
        GenerateCvResponse: {
            markdown: string;
            modelo?: string | null;
            uso?: components["schemas"]["UsoLlm"] | null;
        };
        GeneratePipelineResponse: {
            analiseFinal: components["schemas"]["AtsAnalysis"];
            analiseInicial: components["schemas"]["AtsAnalysis"];
            degradacao?: string | null;
            estrutura?: components["schemas"]["EstruturaCurriculo-Output"] | null;
            markdown: string;
            modelo?: string | null;
            promptVersion?: string | null;
            uso?: components["schemas"]["UsoLlm"] | null;
        };
        HTTPValidationError: {
            detail?: components["schemas"]["ValidationError"][];
        };
        HealthResponse: {
            service: "ai-service";
            status: "ok";
        };
        InterpretarLoteRequest: {
            resultados: components["schemas"]["ResultadoLote"][];
        };
        InterpretarLoteResponse: {
            itens: components["schemas"]["ItemLoteResponse"][];
        };
        ItemLoteResponse: {
            erro: string | null;
            id: string;
            keywords: components["schemas"]["Keyword"][];
            status: "VALIDAS" | "PENDENTE";
        };
        Keyword: {
            peso: number;
            termo: string;
            tipo?: ("stack" | "ferramenta" | "metodologia" | "dominio_negocio" | "certificacao") | null;
        };
        KeywordsRequest: {
            descricao: string;
        };
        KeywordsResponse: {
            degradacao?: string | null;
            keywords: components["schemas"]["Keyword"][];
            modelo?: string | null;
            status: "VALIDAS" | "PENDENTE";
            uso?: components["schemas"]["UsoLlm"] | null;
        };
        LinkContato: {
            tipo: string;
            url: string;
        };
        Local: {
            cidade: string;
            estado: string;
            pais: string;
        };
        MensagemNativa: {
            content: components["schemas"]["BlocoNativo"][];
            role: "user" | "assistant";
        };
        PedidoLoteResponse: {
            id: string;
            params: Record<string, never>;
        };
        PerfilMestre: {
            certificacoes: components["schemas"]["Certificacao"][];
            emails: components["schemas"]["EmailContato"][];
            endereco?: components["schemas"]["Local"] | null;
            experiencias: components["schemas"]["ExperienciaPerfil"][];
            formacao: components["schemas"]["Formacao"][];
            idiomas: string[];
            links: components["schemas"]["LinkContato"][];
            nome: string;
            resumo: string;
            skills: string[];
            telefones: components["schemas"]["TelefoneContato"][];
        };
        PipelineAtsContexto: {
            descricao: string;
            estado: string;
            oportunidadeId: string;
        };
        PrepararLoteRequest: {
            vagas: components["schemas"]["VagaLote"][];
        };
        PrepararLoteResponse: {
            erros: components["schemas"]["ErroLoteResponse"][];
            pedidos: components["schemas"]["PedidoLoteResponse"][];
        };
        ProntidaoResponse: {
            dependencias: components["schemas"]["DependenciaResponse"][];
            servico: "ai-service";
            status: "pronto" | "indisponivel";
        };
        RedigirFormularioRequest: {
            campos: string[];
            perfil: components["schemas"]["PerfilMestre"];
            vaga: components["schemas"]["Vaga"];
        };
        RedigirFormularioResponse: {
            modelo?: string | null;
            respostas: components["schemas"]["RespostaFormulario"][];
            texto: string;
            titulo: string;
            uso?: components["schemas"]["UsoLlm"] | null;
        };
        RedigirMensagemRequest: {
            contexto: string;
            perfil: components["schemas"]["PerfilMestre"];
            vaga: components["schemas"]["Vaga"];
        };
        RedigirMensagemResponse: {
            destino: string;
            modelo?: string | null;
            texto: string;
            titulo: string;
            uso?: components["schemas"]["UsoLlm"] | null;
        };
        ReduzirCvRequest: {
            contexto: components["schemas"]["FonteContexto"][];
            estrutura: components["schemas"]["EstruturaCurriculo-Input"];
            keywords: components["schemas"]["Keyword"][];
            nivel: number;
            perfilMestre: components["schemas"]["PerfilMestre"];
            vaga: components["schemas"]["Vaga"];
        };
        RespostaFormulario: {
            campo: string;
            texto: string;
        };
        ResultadoLote: {
            erro?: string | null;
            id: string;
            resposta?: Record<string, never> | null;
        };
        ResumoConversa: {
            ate: number;
            texto: string;
        };
        ScoreBreakdown: {
            densidade: number;
            faltando: string[];
            keywordMatch: number;
            secoes: number;
        };
        ScoreRequest: {
            markdown: string;
            vaga: components["schemas"]["Vaga"];
        };
        ScoreResponse: {
            breakdown: components["schemas"]["ScoreBreakdown"];
            score: number;
            scoreVersao: number;
        };
        TaxonomiaResponse: {
            categorias: string[];
            niveis: string[];
        };
        TelefoneContato: {
            ddi: string;
            numero: string;
            principal: boolean;
        };
        TermoFonte: {
            fonte: string;
            termo: string;
        };
        ToolNativa: {
            description: string;
            input_schema: Record<string, never>;
            name: string;
            strict?: boolean | null;
        };
        TrechoCandidato: {
            id: string;
            texto: string;
        };
        TrechosAceitos: {
            aceitos: string[];
            consulta: string;
        };
        Troca: {
            indice: number;
            mensagens: components["schemas"]["MensagemNativa"][];
        };
        TurnRequest: {
            mensagens: components["schemas"]["MensagemNativa"][];
            modo: string;
            oportunidadeId?: string | null;
            pipelineAts?: components["schemas"]["PipelineAtsContexto"] | null;
            resumo?: components["schemas"]["ResumoConversa"] | null;
            tools: components["schemas"]["ToolNativa"][];
            trocas: components["schemas"]["Troca"][];
        };
        TurnResponse: {
            conteudo: Record<string, never>[];
            modelo?: string | null;
            parada: string;
            resumo?: components["schemas"]["ResumoConversa"] | null;
            uso?: components["schemas"]["UsoLlm"] | null;
        };
        UsoLlm: {
            cacheEscrita: number;
            cacheLida: number;
            chamadas: number;
            entrada: number;
            saida: number;
        };
        Vaga: {
            descricao: string;
            empresa: string;
            keywords: components["schemas"]["Keyword"][];
            titulo: string;
        };
        VagaLote: {
            descricao: string;
            id: string;
        };
        ValidationError: {
            ctx?: Record<string, never>;
            input?: unknown;
            loc: (string | number)[];
            msg: string;
            type: string;
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
    analisar_analisar_ats_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GenerateCvRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AtsAnalysis"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    classify_classify_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ClassifyRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassifyResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    classify_taxonomy_classify_taxonomy_get: {
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
                    "application/json": components["schemas"]["TaxonomiaResponse"];
                };
            };
        };
    };
    copiloto_redigir_formulario_copiloto_redigir_formulario_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RedigirFormularioRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RedigirFormularioResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    copiloto_redigir_mensagem_copiloto_redigir_mensagem_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RedigirMensagemRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RedigirMensagemResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    copiloto_turn_copiloto_turn_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TurnRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TurnResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    copiloto_turn_stream_copiloto_turn_stream_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TurnRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/x-ndjson": string;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    embeddings_consultas_embeddings_consultas_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmbeddingConsultasRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmbeddingConsultasResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    embeddings_documentos_embeddings_documentos_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmbeddingDocumentosRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmbeddingDocumentosResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    generate_generate_cv_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GenerateCvRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GenerateCvResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    geracao_passo_geracao__passo__post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                passo: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": Record<string, never>;
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    health_health_get: {
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
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
        };
    };
    keywords_keywords_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["KeywordsRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeywordsResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    interpretar_keywords_lote_keywords_lote_interpretar_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InterpretarLoteRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InterpretarLoteResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    preparar_keywords_lote_keywords_lote_preparar_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PrepararLoteRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PrepararLoteResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    rag_filtrar_rag_filtrar_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FiltroTrechosRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FiltroTrechosResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    ready_ready_get: {
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
                    "application/json": components["schemas"]["ProntidaoResponse"];
                };
            };
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProntidaoResponse"];
                };
            };
        };
    };
    reduzir_reduzir_curriculo_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReduzirCvRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GeneratePipelineResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    score_score_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScoreRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScoreResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
