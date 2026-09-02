# AutoJus — Preços de Credenciamento, Pagamento e Hospedagem (v8)

_Julho/2026. Valores reais aplicados no protótipo e instruções de hospedagem._

## Preços do credenciamento de prestadores (aplicados no app)
Taxa de administração anual · cadastro válido por 12 meses · pagável em **12x mensais no cartão** (juros da maquininha) **ou à vista no PIX com 10% de desconto**.

| Categoria | 12x (mês) | Anual | PIX à vista (−10%) |
|---|---|---|---|
| Advogado | R$ 99 | R$ 1.188 | R$ 1.069 |
| Despachante | R$ 79 | R$ 948 | R$ 853 |
| Protocolo presencial | R$ 59 | R$ 708 | R$ 637 |
| Motoboy | R$ 39 | R$ 468 | R$ 421 |

Calibrados a plataformas de leads/assinaturas profissionais no Brasil (Jusbrasil Pro, ADVBOX, Cálculo Jurídico etc., 2025/2026). Ajustáveis. No app: preço muda por categoria; tela de pagamento com PIX (−10%) x 12x no cartão; confirmação "Credenciamento confirmado".

## Potencial de receita da rede (a projetar)
Receita = nº de prestadores credenciados × taxa média anual. Fontes de receita do ecossistema: assinaturas PF/Frotas/Empresas + credenciamento de prestadores + (opcional) comissão por transação. Próximo passo sugerido: planilha de projeção de receita (usuários assinantes + prestadores credenciados por categoria/região).

## Versão final hospedável
- `index.html` = app inteiro em 1 arquivo (sem dependências). Hospedável em Netlify Drop, Vercel, GitHub Pages ou cPanel.
- README_HOSPEDAGEM.md com passo a passo.
- **Demo x produção:** navegação e fluxos funcionam 100% no demo; OCR real, consultas oficiais, pagamentos reais (movimentando dinheiro) e biometria real são a fase de desenvolvimento (MVP a partir de ~R$ 109k, ver planilha de custos).

## Cobertura de telas do app (v8)
Login (facial/e-mail/CPF/senha) · cadastro (foto+biometria) · onboarding · home/panorama · notificações · veículo+histórico+recall · CNH · débitos · dívida ativa · momento mágico (foto→diagnóstico) · defesa · protocolo · status · recursos · frota · indicação de condutor · rede de prestadores (4 categorias credenciadas) · seja parceiro + pagamento do credenciamento · planos · termos/como funcionamos.
