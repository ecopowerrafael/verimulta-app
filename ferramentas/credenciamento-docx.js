/**
 * VERIMULTA — gera o guia de credenciamento SENATRAN/Serpro em Word (.docx).
 *
 *   npm run credenciamento
 *
 * Por que em Word e não em PDF: este documento vai circular entre o contador,
 * o advogado e a certificadora, e cada um vai querer anotar. PDF trava; .docx
 * deixa comentar e riscar.
 *
 * As fontes de cada afirmação estão no próprio documento. O processo mudou em
 * fevereiro de 2025 (Portaria SENATRAN nº 139/2025) — quem seguir orientação
 * anterior a isso vai preencher o formulário errado.
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ExternalHyperlink
} = require('docx');

const AZUL = '0B3C7E';
const NOITE = '071E42';
const CINZA = '5B6570';
const AMARELO = 'FFC933';
const VERMELHO = 'C0392B';

// ----------------------------------------------------------- utilitários
const p = (texto, opcoes = {}) => new Paragraph({
  spacing: { after: opcoes.after ?? 140, line: 300 },
  alignment: opcoes.alignment,
  children: [new TextRun({ text: texto, size: opcoes.size ?? 22, color: opcoes.color, bold: opcoes.bold, italics: opcoes.italics })]
});

/** Parágrafo com trechos em negrito: rico(['normal ', ['forte', true], ' resto']) */
const rico = (partes, opcoes = {}) => new Paragraph({
  spacing: { after: opcoes.after ?? 140, line: 300 },
  children: partes.filter(x => typeof x === 'string' || Array.isArray(x)).map(item => Array.isArray(item)
    ? new TextRun({ text: item[0], bold: item[1] === true, size: opcoes.size ?? 22,
                    color: item[2] || opcoes.color, font: item[1] === 'mono' ? 'Consolas' : undefined })
    : new TextRun({ text: item, size: opcoes.size ?? 22, color: opcoes.color }))
});

const h1 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 180 },
  children: [new TextRun({ text: t, bold: true, size: 32, color: AZUL })]
});
const h2 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 140 },
  children: [new TextRun({ text: t, bold: true, size: 26, color: NOITE })]
});

const passo = (n, titulo, corpo) => [
  new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text: `Passo ${n}  `, bold: true, size: 24, color: AZUL }),
      new TextRun({ text: titulo, bold: true, size: 24 })
    ]
  }),
  ...corpo.map(linha => {
    if (typeof linha === 'string') return p(linha, { after: 90 });
    // ['texto', true] é UMA parte; [['a',false],['b',true]] é lista de partes.
    // Sem esta distinção, o `true` virava um parágrafo solto no documento.
    const partes = linha.every(x => Array.isArray(x)) ? linha : [linha];
    return rico(partes, { after: 90 });
  })
];

const link = (texto, url) => new ExternalHyperlink({
  link: url,
  children: [new TextRun({ text: texto, style: 'Hyperlink', size: 22, color: AZUL, underline: {} })]
});

const celula = (conteudo, { fundo, negrito, largura } = {}) => new TableCell({
  width: largura ? { size: largura, type: WidthType.PERCENTAGE } : undefined,
  shading: fundo ? { type: ShadingType.CLEAR, fill: fundo } : undefined,
  margins: { top: 90, bottom: 90, left: 120, right: 120 },
  children: [new Paragraph({
    spacing: { after: 0, line: 280 },
    children: [new TextRun({ text: conteudo, size: 20, bold: negrito, color: fundo === NOITE ? 'FFFFFF' : undefined })]
  })]
});

const tabela = (cabecalho, linhas, larguras) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'D8DCE2' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D8DCE2' },
    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E8EBEF' },
    insideVertical: { style: BorderStyle.NONE }
  },
  rows: [
    new TableRow({
      tableHeader: true,
      children: cabecalho.map((c, i) => celula(c, { fundo: NOITE, negrito: true, largura: larguras[i] }))
    }),
    ...linhas.map((linha, n) => new TableRow({
      children: linha.map((c, i) => celula(c, { fundo: n % 2 ? 'F7F8FA' : undefined, largura: larguras[i] }))
    }))
  ]
});

/** Caixa de destaque (aviso). */
const caixa = (titulo, texto, cor = AMARELO, fundo = 'FFF8E6') => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 6, color: cor },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: cor },
    left: { style: BorderStyle.SINGLE, size: 18, color: cor },
    right: { style: BorderStyle.SINGLE, size: 6, color: cor }
  },
  rows: [new TableRow({
    children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: fundo },
      margins: { top: 160, bottom: 160, left: 200, right: 200 },
      children: [
        new Paragraph({ spacing: { after: 70 }, children: [new TextRun({ text: titulo, bold: true, size: 22 })] }),
        new Paragraph({ spacing: { after: 0, line: 300 }, children: [new TextRun({ text: texto, size: 21 })] })
      ]
    })]
  })]
});

const espaco = (n = 1) => Array.from({ length: n }, () => p('', { after: 0 }));

// ----------------------------------------------------------- documento
function montar() {
  const hoje = new Date().toLocaleDateString('pt-BR');

  const corpo = [
    // ---------------------------------------------------------- capa
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: 'VERIMULTA · PRIMECORP BROKERS LTDA', bold: true, size: 20, color: AZUL })]
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Credenciamento para consultar as bases oficiais de trânsito', bold: true, size: 40, color: NOITE })]
    }),
    p('Passo a passo para obter acesso ao RENAVAM, RENACH e RENAINF usando o certificado digital e-CNPJ da empresa.', { size: 24, color: CINZA }),
    rico([
      ['Documento gerado em ', false], [hoje, true],
      [' · Processo conforme a ', false], ['Portaria SENATRAN nº 139, de 20 de fevereiro de 2025', true],
      [' (DOU de 24/02/2025).', false]
    ], { size: 20, color: CINZA }),

    caixa('Leia isto primeiro',
      'O processo mudou em fevereiro de 2025. Orientação, tutorial ou consultoria baseada no modelo antigo vai te fazer preencher o formulário errado e perder semanas. '
      + 'Hoje são TRÊS peças obrigatórias, nesta ordem: (1) autorização da SENATRAN pela plataforma Credencia, que gera o TAAD; '
      + '(2) contrato com o Serpro; (3) contrato com uma Gerenciadora de Consentimento e Ciência (GCC) credenciada. Sem as três, não há acesso.'),

    ...espaco(1),

    // ---------------------------------------------------------- por que
    h1('Por que isso é necessário'),
    p('O Verimulta hoje audita a multa a partir do documento que o próprio motorista envia: ele fotografa a notificação, o aplicativo lê os campos, roda as 14 verificações e monta a Defesa Prévia. Isso funciona e não depende de ninguém.'),
    p('O que ainda não funciona é o aplicativo consultar sozinho a situação do veículo, a pontuação da CNH e as infrações registradas. Essas informações vivem em três bases federais — RENAVAM (veículos), RENACH (condutores) e RENAINF (infrações) — e o acesso a elas não se compra: ele é autorizado.'),
    rico([
      ['O bloqueio, portanto, não é técnico. ', true],
      ['O sistema já está preparado para receber a consulta: existe uma camada de fontes externas onde basta preencher o endereço, a chave e o mapa de campos do fornecedor autorizado para a consulta passar a funcionar, sem alterar uma linha de código. O que falta é o papel.', false]
    ]),

    // ---------------------------------------------------------- o que você já tem
    h1('O que você já tem e o que falta'),
    tabela(
      ['Item', 'Situação', 'Observação'],
      [
        ['CNPJ ativo', 'Você tem', 'PRIMECORP BROKERS — CNPJ 55.745.297/0001-06'],
        ['Certificado digital e-CNPJ', 'Você tem', 'Necessário em dois formatos — ver o quadro adiante'],
        ['Sistema preparado para receber os dados', 'Pronto', 'Camada de fontes externas já implementada e testada'],
        ['Autorização da SENATRAN (TAAD)', 'Falta', 'Solicitação pela plataforma Credencia'],
        ['Contrato com o Serpro', 'Falta', 'Serviço "Consulta Online Senatran"'],
        ['Contrato com uma GCC credenciada', 'Falta', 'Gerenciadora de Consentimento e Ciência'],
        ['Avaliação de maturidade em segurança', 'Falta', 'Exigida na análise da SENATRAN']
      ],
      [26, 18, 56]
    ),

    caixa('O certificado que você já tem serve — em dois formatos',
      'A plataforma Credencia pede o e-CNPJ em .pfx (com chave privada) para você ENTRAR e assinar a solicitação. '
      + 'Depois, na etapa de habilitação, ela pede o mesmo certificado em .cer ou .crt (só a chave pública) para autorizar as chamadas de API. '
      + 'Se você só tem o .pfx, a certificadora ou o próprio Windows exporta o .cer a partir dele — não é preciso emitir outro certificado nem pagar de novo.',
      AZUL, 'EDF2FA'),

    // ---------------------------------------------------------- as três peças
    h1('As três peças, e em que ordem'),
    p('Muita gente tenta contratar o Serpro primeiro e trava. A ordem correta começa pela autorização:'),
    tabela(
      ['Ordem', 'Peça', 'Com quem', 'O que é'],
      [
        ['1º', 'TAAD — Termo de Autorização de Acesso a Dados', 'SENATRAN, pela plataforma Credencia', 'A autorização propriamente dita. Sem ela, nenhum contrato adianta.'],
        ['2º', 'Contrato de serviço', 'Serpro', 'Serviço "Consulta Online Senatran" — as três APIs: veículo, condutor e infração.'],
        ['3º', 'Contrato de gestão de consentimento', 'Uma GCC credenciada pela SENATRAN', 'A GCC registra o consentimento do titular (o motorista) para cada consulta. Exigência da LGPD incorporada ao processo.']
      ],
      [8, 30, 26, 36]
    ),

    // ---------------------------------------------------------- passo a passo
    h1('Passo a passo na plataforma Credencia'),
    rico([
      ['Endereço: ', false]
    ]),
    new Paragraph({ spacing: { after: 200 }, children: [link('https://credencia.serpro.gov.br/', 'https://credencia.serpro.gov.br/')] }),

    ...passo(1, 'Prepare o certificado antes de sentar para preencher', [
      'Tenha em mãos o arquivo .pfx do e-CNPJ e a senha dele. Se o certificado estiver em cartão ou token, instale o driver e teste antes.',
      'Exporte também a versão pública (.cer) — você vai precisar dela no Passo 6. No Windows: Gerenciar certificados de usuário » Pessoal » Certificados » botão direito no e-CNPJ » Todas as tarefas » Exportar » "Não exportar a chave privada" » formato X.509 codificado na base 64 (.CER).',
      ['Confira a validade. Certificado vencendo em menos de 90 dias atrapalha: a análise da SENATRAN leva semanas e o certificado precisa estar válido no fim do processo.', true]
    ]),

    ...passo(2, 'Faça o curso rápido antes de preencher', [
      ['O Serpro mantém um curso gratuito em ', false]
    ]),
    new Paragraph({ spacing: { after: 90 }, children: [link('https://cidadaodigital.serpro.gov.br/', 'https://cidadaodigital.serpro.gov.br/')] }),
    p('Procure a trilha "PGCC — Consulta Online Senatran". São poucas horas e evitam retrabalho: o formulário do Credencia pede descrição de casos de uso e finalidade, e resposta genérica volta como pendência.', { after: 90 }),

    ...passo(3, 'Entre no Credencia e abra a solicitação', []),
    new Paragraph({ spacing: { after: 90 }, children: [
      new TextRun({ text: 'Acesse ', size: 22 }),
      link('credencia.serpro.gov.br', 'https://credencia.serpro.gov.br/'),
      new TextRun({ text: ' e identifique-se com o certificado e-CNPJ (.pfx).', size: 22 })
    ] }),
    rico([['No menu: ', false], ['SOLICITAÇÃO » Nova solicitação', true], ['.', false]], { after: 90 }),
    rico([
      ['Na lista de serviços, escolha o serviço de ', false],
      ['acesso a dados / Consulta Online Senatran', true],
      ['. ', false],
      ['Atenção: NÃO escolha "GCC — Gerenciadora de Consentimento e Ciência"', true, VERMELHO],
      [' — esse item é para empresas que querem SER uma gerenciadora, o que não é o seu caso. Você vai CONTRATAR uma GCC, não virar uma. Escolher errado aqui custa semanas.', false]
    ], { after: 90 }),
    p('Clique em CRIAR SOLICITAÇÃO. O formulário fica salvo como RASCUNHO e pode ser editado quantas vezes precisar.', { after: 90 }),

    ...passo(4, 'Preencha a finalidade com precisão', [
      'É o campo que mais reprova. Descreva o caso de uso concreto, a hipótese legal e a minimização de dados. Sugestão de conteúdo, para o seu advogado revisar e ajustar:',
      ['"Plataforma de autoatendimento que permite ao próprio titular consultar a situação do veículo de sua propriedade e a pontuação de sua habilitação, mediante consentimento expresso registrado na GCC, com a finalidade de verificar a regularidade de autuações e instruir defesa administrativa. Não há tratamento de dados de terceiros, não há formação de base própria e não há compartilhamento com terceiros. Retenção limitada ao período da prestação do serviço."', false, CINZA]
    ]),
    caixa('O que reprova uma solicitação',
      'Finalidade genérica ("consultas em geral"), pedir mais dados do que o caso de uso justifica, e ausência de vínculo entre a consulta e o consentimento do titular. '
      + 'Peça pouco e específico: ampliar depois é mais fácil que ser reprovado agora.'),

    ...passo(5, 'Resolva as pendências e submeta', [
      [['Abra a aba ', false], ['PENDÊNCIAS', true], [' e resolva tudo que estiver marcado em vermelho.', false]]
    ]),
    rico([['Depois clique em ', false], ['SUBMETER SOLICITAÇÃO', true], [' e confirme. O status muda para ', false], ['AGUARDANDO AUTORIZAÇÃO', true], ['.', false]], { after: 90 }),
    p('A análise é feita pela SENATRAN e não depende de você. Acompanhe em SOLICITAÇÃO » CONSULTAR; o aviso também chega por e-mail no contato cadastrado.', { after: 90 }),

    ...passo(6, 'Depois de AUTORIZADA, habilite o certificado', [
      [['No menu: ', false], ['HABILITAÇÃO » CERTIFICADOS', true], ['.', false]]
    ]),
    p('Selecione o serviço autorizado e anexe o arquivo .cer ou .crt que você exportou no Passo 1. É esse certificado que vai autenticar as chamadas de API — tem de ser exatamente o mesmo que o sistema usará.', { after: 90 }),

    ...passo(7, 'Contrate o Serpro e a GCC', [
      [['Com o TAAD emitido, contrate o serviço ', false], ['Consulta Online Senatran', true],
       [' junto ao Serpro e feche contrato com uma ', false], ['GCC credenciada', true],
       ['. A lista de gerenciadoras credenciadas é publicada pela SENATRAN — peça a lista atualizada no atendimento do Serpro antes de negociar.', false]]
    ]),
    p('Nesta etapa você recebe as credenciais de produção: endereço das APIs, forma de autenticação e a documentação técnica do contrato.', { after: 90 }),

    ...passo(8, 'Ligue no Verimulta — sem programador', [
      'O sistema já está preparado. Abra o arquivo sistema\\.env (o mesmo que o atalho 2-CONFIGURAR criou) e preencha o bloco que já está lá, comentado, com o que a documentação do Serpro informar:'
    ]),
    new Paragraph({
      spacing: { after: 160 },
      shading: { type: ShadingType.CLEAR, fill: 'F2F4F7' },
      children: [new TextRun({
        text: 'FONTE_HTTP_URL=https://<endereco-do-servico>/veiculo/{placa}\n'
          + 'FONTE_HTTP_CABECALHOS={"Authorization":"Bearer <sua-chave>"}\n'
          + 'FONTE_HTTP_RAIZ=<caminho ate o objeto na resposta>\n'
          + 'FONTE_HTTP_MAPA={"modelo":"<campo deles>","ano":"<campo deles>"}\n'
          + 'FONTE_HTTP_FORNECE=veiculo,multas\n'
          + 'FONTE_HTTP_ROTULO=Consulta Online Senatran\n'
          + 'FONTE_HTTP_OFICIAL=true',
        font: 'Consolas', size: 19
      })]
    }),
    rico([
      ['Reinicie o servidor e abra ', false], ['/v1/fontes', 'mono'],
      [' no navegador: a fonte deve aparecer como LIGADA e marcada como oficial. A partir daí as telas do aplicativo passam a mostrar dado consultado, com a origem declarada.', false]
    ]),

    // ---------------------------------------------------------- documentos
    h1('Documentação para reunir antes de começar'),
    tabela(
      ['Documento', 'Onde conseguir'],
      [
        ['Cartão CNPJ atualizado', 'receita.fazenda.gov.br — emissão imediata e gratuita'],
        ['Contrato social e última alteração', 'Arquivo da empresa / JUCESP'],
        ['Certificado digital e-CNPJ (.pfx e .cer)', 'Você já tem — exporte o .cer conforme o Passo 1'],
        ['Documento do responsável legal', 'RG/CNH da sócia-administradora'],
        ['Certidões de regularidade fiscal', 'Receita Federal, FGTS e Trabalhista — todas online e gratuitas'],
        ['Descrição dos casos de uso e finalidade', 'Texto do Passo 4, revisado pelo advogado'],
        ['Evidências de segurança da informação', 'Política de segurança, controle de acesso, criptografia e plano de resposta a incidente']
      ],
      [40, 60]
    ),

    caixa('A avaliação de segurança costuma ser o gargalo',
      'A SENATRAN avalia maturidade em segurança da informação. O Verimulta já atende parte disso — segredos fora do código, senhas com hash, trilha de auditoria de pagamentos, consentimento gravado com data, IP e versão do termo, rate limit e CORS restrito. '
      + 'O que ainda falta e vai ser cobrado: MFA no painel administrativo, backup com restauração testada e plano formal de resposta a incidente. Esses três já estão listados como pendências na auditoria do código.',
      VERMELHO, 'FDECEA'),

    // ---------------------------------------------------------- prazos e custos
    h1('Prazos, custos e o que fazer enquanto isso'),
    tabela(
      ['Item', 'Expectativa realista'],
      [
        ['Preparar documentação e preencher o Credencia', '1 a 2 semanas de trabalho seu'],
        ['Análise da SENATRAN', 'Semanas. Não há prazo público garantido; depende de fila e de pendências'],
        ['Contratação Serpro + GCC', 'Após a autorização; negociação comercial'],
        ['Custo por consulta', 'Cobrado por consulta realizada, conforme a tabela vigente do Serpro. Peça a tabela atualizada na proposta — não trabalhe com número de terceiros'],
        ['Custo da GCC', 'Contrato à parte, negociado com a gerenciadora escolhida']
      ],
      [42, 58]
    ),
    rico([
      ['Enquanto o processo corre, o beta não precisa parar. ', true],
      ['O aplicativo funciona por documento enviado pelo usuário, que é justamente o fluxo que precisa ser validado com os 30 participantes: leitura da notificação, as 14 verificações, o Índice de Consistência e a Defesa Prévia. Quando a autorização sair, a consulta entra por configuração e o beta já terá amadurecido o resto.', false]
    ]),

    // ---------------------------------------------------------- red lines
    h1('Duas linhas que não se cruzam'),
    caixa('Não contrate revendedor que "raspa" portal público',
      'Existem empresas vendendo "API de consulta de placa" barata e imediata. Boa parte descreve o próprio produto como automação sobre os portais públicos — ou seja, robô preenchendo formulário de site do governo. '
      + 'É o mesmo risco que o credenciamento existe para evitar, agora com um intermediário no meio e o seu CNPJ na ponta. Contratar isso enquanto se pleiteia autorização na SENATRAN é, além de arriscado, péssima sinalização.',
      VERMELHO, 'FDECEA'),
    caixa('Não prometa o que a autorização ainda não permite',
      'Até o TAAD sair, o aplicativo não pode dizer que consulta o Detran — nem no site, nem no material de divulgação, nem para os participantes do beta. '
      + 'O sistema já está construído para declarar "ainda não conectado" em cada tela onde faria diferença. Manter essa honestidade é o que sustenta o discurso do produto.'),

    // ---------------------------------------------------------- contatos
    h1('Contatos oficiais'),
    tabela(
      ['Canal', 'Para quê', 'Endereço'],
      [
        ['Plataforma Credencia', 'Abrir e acompanhar a solicitação', 'credencia.serpro.gov.br'],
        ['Central de Ajuda Serpro', 'Dúvidas sobre o Consulta Online Senatran', 'centraldeajuda.serpro.gov.br'],
        ['Atendimento Serpro', 'Suporte técnico e contratação', 'atendimento.serpro.gov.br/consultaonline — 0800 728 2323'],
        ['Curso gratuito (EAD)', 'Trilha PGCC — Consulta Online Senatran', 'cidadaodigital.serpro.gov.br'],
        ['Portal de Serviços SENATRAN', 'Normas e avisos', 'portalservicos.senatran.serpro.gov.br']
      ],
      [26, 36, 38]
    ),

    // ---------------------------------------------------------- checklist
    h1('Checklist para imprimir'),
    tabela(
      ['', 'Etapa'],
      [
        ['[  ]', 'Certificado e-CNPJ testado e exportado também em .cer'],
        ['[  ]', 'Curso EAD do Serpro concluído (trilha PGCC)'],
        ['[  ]', 'Documentação da empresa reunida e certidões emitidas'],
        ['[  ]', 'Texto de finalidade e casos de uso revisado pelo advogado'],
        ['[  ]', 'Solicitação criada no Credencia (serviço de acesso a dados — NÃO o de GCC)'],
        ['[  ]', 'Pendências resolvidas e solicitação submetida'],
        ['[  ]', 'TAAD emitido pela SENATRAN'],
        ['[  ]', 'Certificado .cer habilitado no Credencia'],
        ['[  ]', 'Contrato assinado com o Serpro'],
        ['[  ]', 'Contrato assinado com uma GCC credenciada'],
        ['[  ]', 'Bloco FONTE_HTTP_* preenchido no sistema\\.env'],
        ['[  ]', '/v1/fontes mostrando a fonte oficial como LIGADA'],
        ['[  ]', 'MFA no painel, backup testado e plano de incidente (pendências de segurança)']
      ],
      [8, 92]
    ),

    ...espaco(1),
    p('PRIMECORP BROKERS — CONSULTORIA E INTERMEDIAÇÃO DE NEGÓCIOS LTDA · CNPJ 55.745.297/0001-06', { size: 18, color: CINZA, after: 40 }),
    p('Documento de apoio operacional. Não substitui orientação jurídica: os textos de finalidade e os contratos devem ser revisados pelo advogado da empresa antes do envio.', { size: 18, color: CINZA, italics: true })
  ];

  return new Document({
    creator: 'Verimulta · PrimeCorp Brokers',
    title: 'Credenciamento SENATRAN/Serpro — passo a passo',
    description: 'Guia operacional para obter acesso às bases RENAVAM, RENACH e RENAINF com o certificado e-CNPJ.',
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
      characterStyles: [{ id: 'Hyperlink', name: 'Hyperlink', run: { color: AZUL, underline: {} } }]
    },
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      children: corpo
    }]
  });
}

async function gerar(destinos) {
  const buffer = await Packer.toBuffer(montar());
  const escritos = [];
  for (const destino of destinos) {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, buffer);
    escritos.push(destino);
  }
  return { escritos, bytes: buffer.length };
}

if (require.main === module) {
  const RAIZ = path.join(__dirname, '..');
  const NOME = 'Verimulta_Credenciamento_SENATRAN_Serpro.docx';
  const destinos = [
    path.join(RAIZ, '3_DOCUMENTACAO_PROJETO', 'manuais', NOME),
    path.join(process.env.USERPROFILE || require('os').homedir(), 'Desktop', 'VERIMULTA', 'manuais', NOME)
  ];
  gerar(destinos)
    .then(r => {
      console.log(`\n${NOME} · ${(r.bytes / 1024).toFixed(0)} KB\n`);
      r.escritos.forEach(d => console.log('  ' + d));
      console.log('');
    })
    .catch(e => { console.error('FALHA:', e.message); process.exit(1); });
}

module.exports = { gerar, montar };
