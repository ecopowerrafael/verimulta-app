export interface OfficialConsultationGroup {
  group: string;
  items: ReadonlyArray<readonly [label: string, url: string]>;
}

export const officialConsultations: readonly OfficialConsultationGroup[] = [
  { group: 'CNH & Trânsito', items: [
    ['Portal SENATRAN', 'https://portalservicos.senatran.serpro.gov.br'],
    ['Consultar CNH (gov.br)', 'https://www.gov.br/pt-br/servicos/consultar-online-dados-de-sua-habilitacao-de-transito'],
    ['Carteira Digital de Trânsito', 'https://www.gov.br/pt-br/servicos/obter-carteira-digital-de-transito']
  ] },
  { group: 'Veículo & IPVA (SP)', items: [
    ['Detran-SP', 'https://www.detran.sp.gov.br'],
    ['IPVA — Sefaz-SP', 'https://portal.fazenda.sp.gov.br/servicos/ipva']
  ] },
  { group: 'Receita Federal', items: [
    ['Situação do CPF', 'https://servicos.receita.fazenda.gov.br/servicos/cpf/consultasituacao/consultapublica.asp'],
    ['Consulta CNPJ', 'https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp']
  ] }
];
