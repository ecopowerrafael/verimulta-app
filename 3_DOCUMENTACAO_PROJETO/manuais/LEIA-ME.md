# Manuais operacionais — versão que bate com o sistema

**Gerado em 21/09/2026** a partir de `ferramentas/`. Cinco documentos, 38 páginas.
Substituem os cinco que estavam no pacote de entrega (`VERIMULTA_COMPLETO/` no
Desktop). Os originais **não foram apagados** — compare e troque quando quiser.

```bash
cd ferramentas
npm install
npm run docs       # regera os PDFs
npm run conferir   # confere os fatos dos manuais contra o código (sai 1 se divergir)
```

## Os cinco documentos

| Documento | Para quem | O que responde |
| --- | --- | --- |
| **Verimulta_Guia_de_Ativacao.pdf** (13 págs) | Rodrigo | Do zero ao primeiro pagamento: teste no PC » Render » domínio » Mercado Pago » e-mail » OCR » teste de fogo » homologação |
| **Verimulta_Handoff_Desenvolvedor.pdf** (10 págs) | a equipe de desenvolvimento | O que existe no código, a API, o modelo de dados, e os pacotes A/B/C a contratar |
| **Verimulta_Cronograma_GoLive.pdf** (3 págs) | quem acompanha o projeto | As 4 semanas até o Dia D e o checklist pronto × pendente |
| **Verimulta_Termo_do_Beta.pdf** (6 págs) | cada participante do teste | O que o app faz, o que **ainda não** faz, quais dados trata e como sair. Entregue antes de convidar |
| **Verimulta_Roteiro_do_Beta.pdf** (6 págs) | você e os participantes | As 8 tarefas do teste e o que acompanhar no Painel do Dono durante os 30 dias |

### Consolidação

`Plano_de_Ativacao`, `Manual_Instalacao` e `Do_Zero_Ao_Ar` **deixaram de
existir**: os três explicavam o mesmo caminho para leitores diferentes, e foi
essa duplicação que permitiu que divergissem entre si e do sistema. Viraram o
**Guia de Ativação**, que reúne o melhor de cada um — a arquitetura e o
Checklist de Homologação do "Do Zero ao Ar", o passo a passo do "Manual de
Instalação", o Rascunho de Chaves e o tom do "Plano de Ativação". Nada de
conteúdo se perdeu.

`npm run docs` apaga os três arquivos antigos da pasta, para ninguém seguir a
versão velha por engano.

## Por que foram reescritos

Os manuais viviam fora do repositório e envelheceram em silêncio enquanto o
código mudava. Três consequências que custariam dinheiro:

- mandavam cadastrar o webhook em um endereço que respondia **404** — o cliente
  pagaria e o plano nunca liberaria;
- vendiam **Combo 01/02/03** enquanto o checkout só conhecia `individual` e
  `casal` (o código foi alinhado à grade dos manuais);
- não mencionavam o **disco persistente** do Render — sem ele, cada deploy
  apagava todos os usuários, multas, defesas e o histórico de pagamento.

Agora o texto é código (`ferramentas/documentos.js`) e `npm run conferir`
compara cada rota, variável, plano e preço citado contra `servidor.js`,
`planos.js`, `motor_auditoria.js` e `render.yaml`. A verificação foi testada
contra a regressão original: trocando o endereço do webhook por um inexistente,
ela acusa.

## O que mudou de conteúdo

**Guia de Ativação** — webhook em `/v1/webhooks/mercadopago`, com o alerta do
404 e o aviso de que `WEBHOOK_SECRET` é a assinatura secreta que o painel do MP
mostra, não um valor inventado · conferência obrigatória do **disco
persistente** antes de seguir · `npm test` (98 asserções) como etapa do teste
local · grade real de planos (`combo1/2/3`, `empresa_start/pro`, `frota`) ·
aceite dos Termos obrigatório no cadastro (LGPD) · PDF vindo do servidor ·
Rascunho de Chaves com 14 variáveis, separando o que o Blueprint preenche do
que é você · **Checklist de Homologação reescrito** para o sistema de hoje
(teto de 85%, rate limit, CORS, consentimento gravado, disco), indicando quais
itens o `npm test` já cobre sozinho.

**Handoff do Desenvolvedor** — mapa do código com `planos.js`, `config.js`,
`seguranca.js`, `pdf.js` e a suíte de testes · referência da API com as rotas
de PDF, os dois webhooks e os direitos do titular · jurimetria v2 (famílias
correlacionadas + teto de 85%) · **Pacote A dividido entre "feito" e
"pendente"**, para a proposta do dev cobrar só o que falta.

**Cronograma Go-Live** — checklist mestre atualizado: o que está construído e
testado × o que é operação, com as pendências técnicas reais (MFA no admin,
backup, observabilidade).

## Material do beta

O **Termo do Beta** é um modelo: ele cobre o essencial (sem garantia de
resultado, quais dados são tratados, base legal do consentimento, como sair),
mas **precisa do carimbo do advogado antes de ir para os 30 participantes** —
é o mesmo item que já estava pendente no Checklist de Homologação.

## Limitação conhecida

Os PDFs usam as fontes base do formato (Helvetica e Courier), que não têm seta,
✓ nem emoji. Esses caracteres são convertidos automaticamente (`→` vira `»`) —
é o que dispensa embutir fonte de terceiro nos documentos da empresa. Se algum
caractere novo não tiver equivalente, `npm run docs` avisa em vez de sumir com
ele calado.
