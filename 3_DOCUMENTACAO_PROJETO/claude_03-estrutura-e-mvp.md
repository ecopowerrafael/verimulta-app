# AutoJus — Estrutura Completa do App & Plano de MVP (resumo)

_v1 (julho/2026). Documento completo entregue como Word (.docx). Faixas de custo são referência de planejamento, não cotação. Nada aqui é aconselhamento jurídico._

## Mapa de telas (5 áreas + entrada + momento mágico)
- **Entrada:** Splash, Onboarding (3 passos), Login/Cadastro por placa.
- **Início:** Home/Panorama, Central de Notificações, Detalhe/Histórico do veículo → Recall, Situação da CNH, Débitos.
- **Escanear (momento mágico):** Câmera → Analisando → Diagnóstico+probabilidade → Gerar defesa → Protocolo → Status. (<60s)
- **Recursos:** Meus recursos → Status (timeline JARI/CETRAN), Detalhe do recurso, Histórico de defesas.
- **Frota:** Painel, Pontuação por motorista, Indicação de condutor, Recursos prioritários (IA), Relatórios (Empresas).
- **Perfil:** Perfil, Planos e assinatura, Notificações, Documentos, LGPD, Falar com especialista.
- Estados transversais: vazio, carregando, erro/offline, sucesso. Todas as telas do fluxo estrela + panorama já existem no protótipo.

## Modelo de dados (entidades)
- Identidade & Conta: Usuário, Conta/Assinatura, Plano, CNH.
- Veículo & Débitos: Veículo, Débito, Pagamento, Recall.
- Autuação & Defesa: Multa/Autuação, Órgão, Equipamento(Radar), Recurso/Defesa, Prazo, Documento.
- Jurimetria (núcleo): Tese (força/prior), Item de Defesa (p_i), Decisão (histórico→calibração), Norma (RAG).
- Frota & Plataforma: Frota/Empresa, Motorista, Notificação.
- Relações: Usuário 1—N Veículo; Usuário 1—1 CNH; Conta 1—1 Assinatura N—1 Plano; Veículo 1—N Multa/Débito; Multa 0..1 Recurso; Multa N—1 Órgão / 0..1 Equipamento; Recurso 1—N Item de Defesa N—1 Tese; Tese 1—N Decisão; Frota 1—N Veículo/Motorista.

## Backlog (épicos)
E1 Onboarding&Conta (F0) · E2 Consulta&Panorama (F0) · E3 Momento mágico (F0) · E4 Jurimetria (F0 v1→F2 v2) · E5 Defesa&protocolo (F0 Prévia→F1 JARI/CETRAN) · E6 Status (F1) · E7 Prevenção&notificações (F0→F1) · E8 Pagamentos (F1) · E9 Frotas (F2) · E10 Planos&billing (F0) · E11 Plataforma (transversal).

## Plano de MVP (Fase 0, ~3 meses)
- **Escopo:** onboarding por placa + LGPD; panorama (veículos/CNH/alertas) via upload/consentimento; momento mágico completo (OCR→auditoria Radar→diagnóstico); Defesa Prévia + protocolo; planos Grátis/Defesa; iOS+Android. Foco: Radar + Defesa Prévia + jurimetria por regras (mais defensável e barato).
- **Fora do MVP:** JARI/CETRAN, pagamentos in-app, Frotas, integrações oficiais, jurimetria v2.
- **Equipe mínima (~7):** PM, designer, 2 mobile, 2 backend, 1 IA/ML, jurídico parcial, QA. ~18–21 pessoas-mês.
- **Cronograma 12 semanas:** setup/design → momento mágico (OCR+auditoria) → jurimetria v1+Defesa Prévia → onboarding/panorama/planos → integração+QA → beta.
- **Orçamento:** referência de planejamento (não cotação); varia por senioridade/região/in-house vs software house. Levantar 2–3 orçamentos reais. Alavancas: só Defesa Prévia+Radar, serviços gerenciados de OCR/LLM, upload manual antes de integrações.
- **Validação barata:** usabilidade com 5–8 motoristas; piloto de OCR com fotos reais; landing+lista de espera; calibrar jurimetria com desfechos reais.
- **Go/No-Go:** OCR ≥90% campos; diagnóstico <60s; usuário chega sozinho; jurimetria calibrada; sinal de disposição a assinar.

## Definition of Done
Tela responsiva/enquadrada com estados vazio/carregando/erro; textos revisados sem juridiquês; fluxo testado ponta a ponta; dados protegidos + consentimento + auditoria; estimativa sempre como probabilidade com disclaimer.

## Estado do protótipo
App navegável praticamente completo (v4): onboarding, home, notificações, veículo+histórico, recall, CNH, débitos, momento mágico, defesa, status, frota, indicação de condutor, planos. Correções aplicadas: aviso vira banner no topo com fechar (não cobre a nav); telas redimensionam para caber no aparelho.
