# Manuais operacionais — versão que bate com o sistema

**Gerado em 20/09/2026** a partir de `ferramentas/`. Estes cinco PDFs substituem
os que estavam no pacote de entrega (`VERIMULTA_COMPLETO/` no Desktop). Os
originais **não foram apagados** — compare e troque quando quiser.

```bash
cd ferramentas
npm install
npm run docs       # regera os 5 PDFs
npm run conferir   # confere os fatos dos manuais contra o código (sai 1 se divergir)
```

## Por que foram reescritos

Os manuais viviam fora do repositório e envelheceram em silêncio enquanto o
código mudava. Três consequências que custariam dinheiro:

- mandavam cadastrar o webhook em um endereço que respondia **404** — o cliente
  pagaria e o plano nunca liberaria;
- vendiam **Combo 01/02/03** enquanto o checkout só conhecia `individual` e
  `casal` (agora o código foi alinhado à grade dos manuais);
- não mencionavam o **disco persistente** do Render — sem ele, cada deploy
  apagava todos os usuários, multas, defesas e o histórico de pagamento.

Agora o texto dos manuais é código (`ferramentas/documentos.js`) e
`npm run conferir` compara cada rota, variável, plano e preço citado contra
`servidor.js`, `planos.js`, `motor_auditoria.js` e `render.yaml`.

## O que mudou em cada documento

| Documento | Principais correções |
|---|---|
| **Verimulta_Plano_de_Ativacao.pdf** | Webhook em `/v1/webhooks/mercadopago` · aviso de que `WEBHOOK_SECRET` é a assinatura secreta do MP, não um valor inventado · Fase 2 com conferência do **disco persistente** · Fase 1 com `npm test` (56 asserções) · Rascunho de Chaves com 14 variáveis, marcando o que o Blueprint já preenche · conferência de fumaça com o aceite obrigatório dos Termos |
| **Verimulta_Manual_Instalacao.pdf** | Etapa 2 com disco persistente e segredos gerados pelo Render · Etapa 3 com o endereço exato do webhook e o alerta do 404 · Etapa 4 com a grade real (`combo1/2/3`, `empresa_start/pro`, `frota`) · Etapa 7 com o aceite LGPD, o Índice de Consistência e o PDF vindo do servidor |
| **Verimulta_Do_Zero_Ao_Ar.pdf** | Arquitetura sem depender de um provedor específico · Conexão 1 explicitando o que o Blueprint resolve e o que você preenche · **Checklist de Homologação reescrito**: 20 itens que refletem o sistema de hoje (teto de 85%, rate limit, CORS, consentimento gravado, PDF do servidor, disco persistente) e indicando quais o `npm test` já cobre |
| **Verimulta_Handoff_Desenvolvedor.pdf** | Mapa do código com `planos.js`, `config.js`, `seguranca.js`, `pdf.js` e a suíte de testes · referência da API com as rotas de PDF, os dois webhooks e os direitos do titular · jurimetria v2 (famílias correlacionadas + teto de 85%) · **Pacote A dividido entre "feito" e "pendente"**, para a proposta do dev cobrir só o que falta |
| **Verimulta_Cronograma_GoLive.pdf** | Checklist mestre atualizado: o que está construído e testado × o que é operação, com as pendências técnicas reais (MFA no admin, backup, observabilidade) |

## Limitação conhecida

Os PDFs usam as fontes base do formato (Helvetica e Courier), que não têm seta,
✓ nem emoji. Esses caracteres são convertidos automaticamente (`→` vira `»`) —
é o que dispensa embutir fonte de terceiro nos documentos da empresa. Se algum
caractere novo não tiver equivalente, `npm run docs` avisa em vez de sumir com
ele calado.

## Observação de escopo

`Plano_de_Ativacao`, `Manual_Instalacao` e `Do_Zero_Ao_Ar` explicam **o mesmo
caminho** (GitHub » Render » domínio » Mercado Pago » e-mail » OCR) para três
leitores diferentes. Foram mantidos separados para substituir os originais um a
um, mas essa duplicação é justamente o que deixou os três divergirem antes.
Consolidar em um único guia é a recomendação para a próxima revisão.
