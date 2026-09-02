# AutoJus — Blueprint de Produto & Arquitetura Técnica (resumo)

_Documento fundacional v1 (julho/2026). O documento completo foi entregue como Word (.docx) — este é o resumo de referência no projeto. Nada aqui é aconselhamento jurídico._

## Visão
LegalTech de inteligência em trânsito; 1ª função é recorrer multas, produto real é vigilância inteligente + tranquilidade contínua, na palma da mão. Diferencial = tripé: jurimetria transparente + prevenção proativa + status em tempo real. Princípio: ferramenta de autoatendimento do condutor, estimativa nunca garantia, IA nunca inventa fatos.

## Módulos
- **AutoJus Defesa** (MVP): auditoria da autuação, prazos, geração de Defesa Prévia/JARI/CETRAN.
- **AutoJus Radar** (MVP, âncora): aferição (INMETRO 158/2022), homologação, estudo técnico (CONTRAN 798/2020), sinalização R-19. Teses objetivas.
- **AutoJus CNH** (MVP): situação, pontuação (40 pts/12m), histórico, alertas.
- **AutoJus Débitos** (Fase 1): IPVA/licenciamento/multas, SNE −40%, pagamento/parcelamento.
- **AutoJus Frotas/Empresas** (Fase 2): painel, pontos por motorista, indicação de condutor, priorização por IA.
- **AutoJus Advogados/IA** (Fase 3/transversal): white-label/API; OCR, NLP, jurimetria, RAG, geração de peças.

## Motor de jurimetria (núcleo)
Pipeline 5 camadas: (1) ingestão/extração OCR+NLP; (2) auditoria de conformidade por regras; (3) cálculo de probabilidade; (4) seleção de teses + geração da peça via RAG; (5) transparência + feedback loop.
Cálculo: cada autuação vira teses independentes; p_i = combinação de **força jurídica (prior)** + **taxa histórica de deferimento (evidência)** por atualização bayesiana (cold-start prevalece prior). Global: **P(êxito) = 1 − ∏(1 − p_i)**. Calibração Platt/isotônica contra desfechos reais. Exemplo: aferição vencida (0,80) + estudo ausente (0,35) → 1−0,20×0,65 = 0,87 → exibido ~74–80% como estimativa.
Começar por teses objetivas (regra checável) reduz dependência de base de decisões (inexistente publicamente) e o risco regulatório.

## Arquitetura (5 camadas)
Apresentação (RN iOS/Android, Next.js web, white-label/API) → API Gateway/serviços de domínio → Camada de IA (OCR, NLP jurídico, Motor de Jurimetria, RAG legal, geração de peças) → Dados (PostgreSQL, Object Storage, Vector DB, base de teses/decisões) → Integrações externas (SENATRAN/Datavalid, Detrans, INMETRO/IPEM, SNE, pagamentos), com Segurança/LGPD, observabilidade e infra elástica transversais.
Stack: React Native + Next.js; API GraphQL/REST em Node/Go; Postgres+ObjectStorage+VectorDB; IA OCR+LLM+RAG+serviço de jurimetria; containers/filas/auto-scaling.
Dados oficiais NÃO são consulta livre → base = consentimento do titular; integrações (Datavalid/SERPRO, Detrans) = roadmap mediante credenciamento.

## Modelo de negócio
Freemium: Grátis (consulta+alertas) → Defesa PF ~R$29,90/mês → Frotas R$9–15/veículo → Advogados sob medida. Success fee opcional em casos de alto valor. Cancelamento em 1 toque, sem prometer resultado.

## Roadmap
- Fase 0 (0–3m): MVP — placa, foto→OCR→auditoria, Radar, Defesa Prévia, CNH, Grátis/Defesa, iOS+Android.
- Fase 1 (3–6m): JARI/CETRAN, status timeline, jurimetria v1, pagamentos, SNE, Débitos.
- Fase 2 (6–12m): Frotas + web, indicação de condutor, integrações oficiais, jurimetria v2.
- Fase 3 (12m+): Advogados white-label/API, expansão multi-órgão, IA conversacional.
Foco MVP: Radar + Defesa Prévia + jurimetria por regras (mais defensável e barato de validar).

## Riscos principais
OAB (atividade privativa) → autoatendimento + estimativa nunca garantia; PL exigindo advogado → monitorar; escassez de base de decisões → teses objetivas; alucinação IA → RAG + gabaritos + revisão; LGPD → privacidade por design + DPO.

## KPIs
Ativação (<60s ao diagnóstico; sucesso OCR), conversão free→pago, MRR/ARPU/LTV/CAC, churn, calibração (êxito real vs estimado), NPS.
