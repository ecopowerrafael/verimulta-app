# AutoJus — Análise de Mercado & Concorrência (Fase 1)

_Documento fundacional. Pesquisa consolidada em julho/2026. Nada aqui constitui aconselhamento jurídico._

## Resumo em 5 pontos
1. **Mercado gigante e crescente.** 123,9 mi de veículos, 90+ mi de habilitados, 234+ mi de multas só nos 10 primeiros meses de 2024 — ~40% de radar (nicho com teses técnicas de nulidade).
2. **Concorrentes de recurso viraram commodity.** Recorre.ai, Multa Justa, Multas.io, Tira Multa competem por preço/velocidade (R$ 10–20, peça "em minutos"). Ninguém entrega auditoria técnica + probabilidade de êxito transparente.
3. **Três feridas abertas:** promessa não cumprida, "dinheiro jogado fora", cobranças-surpresa. Resolvvi provou que transparência + "só paga se ganhar" gera nota 9 — e não atua em trânsito.
4. **Tripé de diferenciação impossível de copiar rápido:** jurimetria transparente + prevenção proativa + rastreamento de status, em UX estilo Nubank (foto → diagnóstico em 60s).
5. **Linha vermelha OAB** (precedente set/2025): posicionar como ferramenta de autodefesa do próprio condutor no âmbito administrativo, estimativa e nunca garantia. Assinatura freemium para os 4 perfis.

## 1. Tamanho de mercado
- Frota: 123,9 mi de veículos (SENATRAN, 2024) — maior da história.
- Condutores habilitados: 90+ mi.
- Multas: 234+ mi em 10 meses de 2024 (recorde). ~40% por excesso de velocidade (radar).
- Lacunas de dado: valor nacional arrecadado atualizado não localizado (referência: SP arrecadou R$ 1,6 bi em 2023); taxa de sucesso de recursos só em fontes jornalísticas divergentes (4% a 30%), sem estatística oficial.

## 2. Campo competitivo (matriz)
Cinco categorias: geradores de recurso (concorrência direta), assessorias jurídicas, marketplace de advogados, super apps de pagamento, apps oficiais.

| Player | Tipo | Recorre? | IA | Preço | Escala/reputação |
|---|---|---|---|---|---|
| Recorre.ai | Web/app self-service | Sim | Sim | Avulso ~R$19,99; plano ~R$99,90 | sem nota pública |
| Multa Justa | App mobile | Sim | Sim | a partir de R$10,90 | sem nota pública |
| Multas.io | App + consultores | Sim | Triagem | Sob consulta | app débitos 3,6★/1M+ |
| Tira Multa | Web + franquia | Sim | Não | Não divulgado | marca ~20 anos |
| Doutor Multas | Assessoria online | Sim | Não | Sob orçamento (opaco) | +100k clientes; RA 7,2; queixa "propaganda enganosa" |
| Multa Zero/nicho CNH | Escritório digital | Sim | Não | Sob consulta | marca fragmentada |
| Resolvvi | Marketplace advogados | Trânsito NÃO | Triagem | Só paga se ganhar (30–40%) | +30k; Google 4,9; RA 9 |
| Gringo | Super app | Só paga | — | Transação | +20 mi cadastrados |
| Zul+/Zapay | App do motorista | Só paga | — | Transação | Zul+ 4,9★/~280k |
| CDT (CNH do Brasil) | App oficial gov | Não | — | Grátis | 58 mi ativos, 4,9★, sem inteligência |

Leitura: diretos brigam por preço/velocidade, ninguém comunica auditoria+probabilidade. Doutor Multas domina marketing mas é caro/opaco. Resolvvi é o melhor benchmark de modelo e deixou trânsito de fora. Super apps (Gringo/Zul+/Zapay) só pagam, não recorrem — potenciais parceiros de distribuição. CDT educou o mercado mas é fria/transacional — AutoJus é a camada de inteligência.

## 3. Três feridas do mercado (→ respostas do AutoJus)
1. Promessa não cumprida ("paguei e continuei com o problema") → estimativa de êxito honesta ANTES do pagamento.
2. Dinheiro jogado fora (avulso, expectativa binária) → assinatura (tranquilidade contínua) + success fee opcional.
3. Opacidade de preço/status + cobranças-surpresa → preço claro, timeline visual do recurso, cancelamento em 1 toque.

## 4. Tripé de diferenciação
- **Jurimetria transparente:** probabilidade fundamentada, sempre estimativa (nunca garantia).
- **Prevenção proativa:** saúde da CNH, alertas de CNH/IPVA/licenciamento, recall, cálculo "pagar com 40% (SNE) ou recorrer?".
- **Transparência de status:** timeline em tempo real (protocolado → JARI → resultado).
- Momento mágico: foto da notificação → OCR → diagnóstico + probabilidade em <60s. IA que explica em linguagem simples.
- **AutoJus Radar** (módulo-âncora): cruzar autuação × validade de aferição (Portaria INMETRO 158/2022), homologação, estudo técnico (Res. CONTRAN 798/2020), sinalização R-19. Teses objetivas/verificáveis = mais defensáveis.
- **AutoJus Frotas** (motor de LTV): monitorar CNH por motorista, indicação de condutor automatizada, priorização por valor/risco.

## 5. Modelo de negócio (freemium, 4 perfis)
- Grátis: consulta de multas/pontos/CNH por placa + alertas (aquisição/hábito).
- Defesa PF: ~R$ 29,90/mês (faixa aceitável R$ 19,90–39,90).
- Frotas: R$ 9–15/veículo/mês (maior LTV, menor churn).
- Advogados: SaaS B2B2C / white-label.
- Híbrido: assinatura + success fee opcional em casos de alto valor.
- Regras de ouro: renovação transparente, cancelamento em 1 toque, nunca prometer resultado.

## 6. Risco regulatório (guiar o produto)
- **Precedente OAB (04/09/2025, Justiça Federal-RJ):** proibida plataforma que fazia análise de documentos + estimativa de êxito + encaminhamento a advogados + marketing de vitória (Lei 8.906/94). Combo quase idêntico ao pretendido.
- Mitigação: na defesa administrativa o condutor pode se defender sem advogado → posicionar como ferramenta de autoatendimento (usuário protocola em seu nome), estimativa e nunca garantia, cuidado no módulo Advogados. PL na Câmara quer exigir advogado em recursos — monitorar.
- LGPD: fundar no consentimento do titular; bases governamentais (SENATRAN, Datavalid/SERPRO) exigem credenciamento formal → tratar integrações como roadmap. DPO, minimização, retenção segura.

## Recomendação de posicionamento
Não ser "mais um gerador de recursos" (comoditizado). Ser **LegalTech de Inteligência em Trânsito** cuja primeira função é recorrer multas, mas cujo produto real é vigilância inteligente e tranquilidade contínua. Diferencial defensável = o tripé, em UX estilo Nubank, ancorado no Radar e monetizado por assinatura freemium com Frotas como motor de LTV, respeitando a linha vermelha OAB.

## Próximos passos possíveis
- Protótipo visual navegável das telas-chave.
- Blueprint de produto (PRD): jornada + mapa de módulos + motor de jurimetria.
- Arquitetura técnica: IA, OCR, integrações gov (roadmap), segurança/LGPD, escalabilidade.
