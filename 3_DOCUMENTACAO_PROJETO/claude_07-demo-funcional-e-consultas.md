# AutoJus — Demo funcional + Consultas Oficiais (v9)

_Julho/2026. Sessão autônoma: campos funcionais e links oficiais._

## O que passou a funcionar (demo hospedável)
- **Cadastro real:** inputs de nome, CPF, e-mail, telefone, senha + **upload de foto** (FileReader → avatar). Os dados fluem em memória (objeto `APP`) para a saudação da Home (`homeGreet`), o Perfil (`profName`) e o avatar (`profAvatar`, iniciais ou foto).
- **Placa:** input no onboarding (`ob_placa`) → aparece no cadastro do veículo (`ob3placa`).
- **Login** e **Dívida ativa:** inputs reais (placa/Renavam/CPF).
- **Aba Consultas Oficiais** (`consultas`): 3 abas (Receita Federal / CNH & Trânsito / Veículo & IPVA) com **links reais** (target=_blank):
  - Receita CPF: servicos.receita.fazenda.gov.br/servicos/cpf/consultasituacao/consultapublica.asp
  - gov.br CPF: gov.br/pt-br/servicos/consultar-cadastro-de-pessoas-fisicas
  - CNPJ: solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp
  - SENATRAN: portalservicos.senatran.serpro.gov.br
  - CNH gov.br: gov.br/pt-br/servicos/consultar-online-dados-de-sua-habilitacao-de-transito
  - CDT: gov.br/pt-br/servicos/obter-carteira-digital-de-transito
  - Detran-SP: detran.sp.gov.br
  - IPVA/Sefaz-SP: portal.fazenda.sp.gov.br/servicos/ipva
  - Entradas: botão na Home (abaixo dos atalhos) e linha no Perfil.

## Entrega
- `index.html` (arquivo único, ~130 KB) hospedável (Netlify Drop, Vercel, GitHub Pages, cPanel).
- `README_HOSPEDAGEM.md` atualizado com a seção de campos funcionais.
- 27 telas testadas no navegador, **zero erros de JS**.

## Limite honesto (demo x produção) — reforçado
Os campos preenchem e os dados fluem **no navegador**; os links de consulta **abrem o site oficial**. O que ainda depende de desenvolvimento (backend + credenciamento): consulta automática por placa/CPF dentro do app, OCR real, pagamento processando dinheiro, biometria real. MVP orçado a partir de ~R$ 109k (ver planilha de custos).

## Próximo (sugestão)
- Projeção de receita (assinaturas + credenciamento de prestadores).
- Handoff de design / iniciar desenvolvimento do MVP (integrações oficiais mediante credenciamento SENATRAN/Datavalid).
