# AutoJus — Ecossistema, Dívida Ativa e Rede de Prestadores

_v2 (julho/2026). Expansão do escopo definida pelo Rodrigo. Complementa os docs 01–04._

## Visão de ecossistema
AutoJus como plataforma central de informação e ação em trânsito, vendida para múltiplos públicos:
- **CPF** (motorista pessoa física)
- **PJ / empresas**
- **Frotistas**
- **Órgãos públicos** — municípios, estados e demais órgãos (B2G)
- **Prestadores de serviço** (advogados, despachantes, motoboys, protocolo presencial) — canal B2B2C e fonte de receita via credenciamento.

## Módulo de Dívida Ativa (protótipo v6)
- Consulta por **placa + Renavam + CPF** (com consentimento) nas bases de Fazenda/Procuradoria.
- Lista de **débitos inscritos em dívida ativa** (IPVA anteriores, multas inscritas, taxas/licenciamento), com status (inscrito, protestado).
- **Emissão de guias** e **pagamento/parcelamento**; também IPVA, multas e licenciamento correntes (módulo Débitos).
- Aviso de protesto/execução fiscal e regularização para liberar licenciamento.
- Integrações oficiais = roadmap mediante credenciamento (LGPD/consentimento como base).

## Rede de Prestadores Credenciados (protótipo v7)
Marketplace por localização com **4 categorias**, todas com selo "credenciado e verificado":
- **Advogados** (Direito de Trânsito, CNH suspensa/cassada) — OAB.
- **Despachantes** (transferências, frotas, protocolo).
- **Motoboy** — coleta e entrega de documentos (ex.: levar defesa assinada ao protocolo). "Solicitar coleta", preço a partir de R$ e ETA.
- **Protocolo presencial** — parceiros que protocolam nos órgãos (CET-SP, Detran, JARI, estaduais/municipais). "Contratar protocolo", prazo e preço.
- Gatilhos: recurso **indeferido**, Perfil, e quando o usuário precisar de serviço além do app.

### Modelo de receita dos prestadores (NOVO)
- Prestadores pagam uma **taxa de administração anual (válida por 12 meses)** para ficar **credenciados na base** e aparecer na vitrine por região.
- Tela "Seja um parceiro" (protótipo v7): seletor de categoria, plano "Parceiro AutoJus" (ex. ilustrativo R$ 490/ano), benefícios (perfil na vitrine, receber solicitações da região, selo, avaliações, painel de atendimentos) e **verificação de credenciais** (OAB p/ advogado, documentação p/ despachante, CNH/veículo p/ motoboy).
- Compromisso institucional: garantir ao usuário **apenas prestadores credenciados e verificados** na base de dados; cadastro completo do prestador.
- Definir depois: valores reais por categoria, política de renovação, comissão adicional por transação (opcional), regras de qualidade/descredenciamento.

### Enquadramento seguro (crítico — OAB)
- O **usuário é quem busca, escolhe e contrata** o prestador (modelo diretório/vitrine); o AutoJus conecta e garante a credencial, **sem intermediar o mérito nem prometer resultado**.
- Copy fixa: "Todos os prestadores são credenciados e verificados na nossa base. A contratação e os valores são combinados diretamente com o prestador; o AutoJus conecta e garante a credencial."
- Alinhado ao precedente OAB 2025: o módulo de advogados exige cuidado jurídico específico (revisar termos de parceria e de uso com advogado antes de operar).

## Reflexo no protótipo (v7)
App cobre: acesso (login/biometria/cadastro), panorama, momento mágico, defesa, status, débitos, dívida ativa, CNH, veículo/recall/histórico, frota/indicação, notificações, planos, **rede de prestadores (4 categorias) + credenciamento de parceiros**, termos.

## Pendências para as próximas rodadas
- Atualizar mapa de telas (sitemap) e backlog com Dívida Ativa, Rede de Prestadores e Credenciamento.
- Detalhar B2G (órgãos públicos) no PRD.
- Definir tabela de preços do credenciamento por categoria e regras de qualidade.
- Revisão jurídica dos termos de parceria e da atuação da rede.
