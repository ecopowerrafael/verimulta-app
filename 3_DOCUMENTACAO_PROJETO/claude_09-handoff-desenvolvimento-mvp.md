# AutoJus — Handoff de Desenvolvimento do MVP (v1)

_Julho/2026. Documento técnico para a equipe/fábrica iniciar o desenvolvimento. Entregue como .docx (10 págs)._

## Escopo do MVP
Cadastro/login (e-mail/CPF+senha, foto, consentimento LGPD, biometria opcional) · panorama (veículos, CNH, alertas) · momento mágico (foto→OCR→auditoria→diagnóstico+probabilidade) · Defesa Prévia + protocolo · status · planos Grátis/Defesa + billing · iOS/Android + API. Fora: JARI/CETRAN, frotas, dívida ativa, rede/credenciamento, integrações amplas, jurimetria v2.
Regra de ouro: estimativa nunca garantia; peça em nome do usuário; IA não inventa.

## Stack
React Native (iOS/Android) · API Node/NestJS ou Go (REST/JSON /v1, OpenAPI) · PostgreSQL · Object Storage · Vector DB (pgvector) · OCR (Textract/Vision) · LLM+RAG · containers/filas/auto-scaling · observabilidade (Sentry, logs, tracing). Ambientes dev/staging/prod, CI/CD, migrations por PR.

## Modelo de dados (tabelas MVP)
usuarios, veiculos, cnh, orgaos, equipamentos, multas, teses, normas(+embedding), recursos, itens_defesa, prazos, documentos, notificacoes, assinaturas, pagamentos. PKs UUID, timestamps, FKs indexadas. (Campos detalhados no .docx.)

## API central
/v1/auth/register|login · /v1/veiculos · /v1/multas/scan (multipart→diagnóstico) · /v1/multas/:id/diagnostico · /v1/recursos (+/protocolar,/status) · /v1/debitos · /v1/pagamentos · /v1/jurimetria/avaliar.

## Momento mágico (pipeline)
upload→OCR→extração NLP (órgão, enquadramento, datas, local, placa, equipamento)→auditoria de regras→jurimetria→JSON. Regras MVP: aferição vencida (INMETRO 158/2022), estudo técnico (CONTRAN 798/2020), homologação, prazo, dados obrigatórios (CTB 280), duplicidade. Aceite: OCR ≥90% campos essenciais; disclaimer sempre; confirmação manual quando incerto.

## Jurimetria v1
p_i = prior jurídico (+ histórico quando houver, bayesiano); P(êxito)=1−∏(1−p_i); saída score+faixa+teses+disclaimer; registrar desfecho para recalibrar (Platt/isotônica). Endpoint /v1/jurimetria/avaliar.

## Backlog (épicos)
E1 Onboarding&Conta · E2 Veículos&Panorama · E3 Momento mágico · E4 Jurimetria v1 · E5 Defesa Prévia&protocolo · E6 Status · E7 Planos&billing · E8 Plataforma (segurança/LGPD/observabilidade). Cada um com critérios de aceite no .docx.

## Integrações (roteiro)
SENATRAN/Datavalid (credenciamento SERPRO), Detrans (convênio por estado), INMETRO/IPEM (consulta+cache), SNE (adesão), gateway pagamento. Estratégia: lançar com upload manual + links oficiais e ativar cada integração ao obter credenciamento, sem bloquear o lançamento.

## Sprints (12 semanas)
S1 setup+auth · S2 veículos+OCR · S3 auditoria+jurimetria v1 · S4 defesa+PDF · S5 status+billing+notificações · S6 hardening+LGPD+QA+beta.

## DoD
Testes+PR revisado; estados vazio/erro; sem dados sensíveis em log; disclaimer sempre; OpenAPI+migrations atualizadas.

## Status do pacote AutoJus (completo)
01 mercado · 02 PRD+arquitetura · 03 estrutura+MVP · 04 política comercial · 05 ecossistema · 06 credenciamento/preços/hospedagem · 07 demo funcional+consultas · 08 projeção de receita · 09 handoff dev. Protótipo v9 hospedável (index.html). Deck + planilhas de custos e receita.
