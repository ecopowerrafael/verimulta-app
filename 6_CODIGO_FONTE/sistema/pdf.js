/**
 * VERIMULTA — Geração de PDF timbrado no servidor.
 * O app já imprimia pelo navegador (window.print), que depende de pop-up
 * liberado e varia de aparelho para aparelho. Aqui o documento sai igual
 * sempre, e a rota GET /v1/recursos/:id/pdf — documentada no Handoff — passa
 * a existir de fato.
 *
 * Titular do documento: PRIMECORP BROKERS — CONSULTORIA E INTERMEDIAÇÃO DE
 * NEGÓCIOS LTDA · CNPJ 55.745.297/0001-06.
 */
const PDFDocument = require('pdfkit');

const TITULAR = 'PRIMECORP BROKERS — CONSULTORIA E INTERMEDIAÇÃO DE NEGÓCIOS LTDA';
const CNPJ = 'CNPJ 55.745.297/0001-06';
const AZUL = '#0B3C7E';
const CINZA = '#5B6570';

/**
 * Cabeçalho e rodapé do papel timbrado, repetidos em cada página.
 * `lineBreak: false` e largura explícita são obrigatórios: sem isso o texto do
 * timbre pode transbordar, disparar um novo 'pageAdded' de dentro do próprio
 * handler de 'pageAdded' e estourar a pilha num documento de 2+ páginas.
 */
function timbre(doc, subtitulo) {
  const x = doc.page.margins.left;
  const largura = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.save();
  doc.rect(0, 0, doc.page.width, 6).fill(AZUL);
  doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(17)
     .text('VERIMULTA', x, 28, { width: largura, lineBreak: false });
  doc.fillColor(CINZA).font('Helvetica').fontSize(8)
     .text(subtitulo, x, 48, { width: largura, lineBreak: false, ellipsis: true });
  doc.restore();
}

function rodape(doc, pagina) {
  const x = doc.page.margins.left;
  const largura = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.page.height - 44;
  doc.save();
  doc.fillColor(CINZA).font('Helvetica').fontSize(7)
     .text(`${TITULAR} · ${CNPJ}`, x, y, { width: largura, align: 'left', lineBreak: false, ellipsis: true })
     .text(`Página ${pagina}`, x, y, { width: largura, align: 'right', lineBreak: false });
  doc.restore();
}

/**
 * Monta o PDF e devolve um Buffer.
 * @param {object} p {titulo, subtitulo, corpo, rodape_nota}
 */
function montar({ titulo, subtitulo, corpo, rodape_nota }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 64, bottom: 64, left: 56, right: 56 } });
    const pedacos = [];
    doc.on('data', d => pedacos.push(d));
    doc.on('end', () => resolve(Buffer.concat(pedacos)));
    doc.on('error', reject);

    let pagina = 1;
    let desenhando = false;
    const ornar = () => {
      if (desenhando) return;         // guarda de reentrância
      desenhando = true;
      timbre(doc, subtitulo);
      rodape(doc, pagina);
      doc.x = doc.page.margins.left;  // devolve o cursor ao corpo do texto
      doc.y = doc.page.margins.top;
      desenhando = false;
    };
    ornar();
    doc.on('pageAdded', () => { pagina += 1; ornar(); });

    doc.fillColor('#12171D').font('Helvetica-Bold').fontSize(13).text(titulo, { align: 'left' });
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(10.5).fillColor('#12171D')
       .text(corpo, { align: 'justify', lineGap: 2.5 });

    if (rodape_nota) {
      doc.moveDown(1.5);
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(CINZA)
         .text(rodape_nota, { align: 'left', lineGap: 1.5 });
    }
    doc.end();
  });
}

/** Defesa Prévia — o texto já vem pronto de banco.gerarDefesa(). */
function defesaPDF({ texto, ait }) {
  return montar({
    titulo: `Defesa Prévia — Auto de Infração ${ait || '[AIT]'}`,
    subtitulo: 'Documento organizado pela plataforma Verimulta · autoatendimento',
    corpo: texto,
    rodape_nota: 'Este documento foi organizado pela plataforma Verimulta a pedido do próprio '
      + 'requerente, que o protocola em seu nome. As probabilidades apresentadas no diagnóstico '
      + 'são estimativas calculadas a partir das verificações — nunca garantia de resultado. '
      + 'A decisão sobre a autuação é exclusiva do órgão julgador.'
  });
}

/** Extrato de Auditoria — as 14 verificações, com base legal item a item. */
function extratoPDF({ usuario, multa, verificacoes, jurimetria }) {
  const linhas = verificacoes.map(v => {
    const marca = !v.aplicavel ? '—' : v.vicio ? '[!]' : '[ok]';
    return `${marca} ${v.codigo} · ${v.base_legal}\n     ${v.detalhe}`;
  }).join('\n\n');

  const corpo =
`Requerente: ${usuario.nome}${usuario.cpf ? ` — CPF ${usuario.cpf}` : ''}
Auto de Infração: ${multa.ait || '[AIT]'}${multa.orgao ? ` · Órgão: ${multa.orgao}` : ''}
Placa: ${multa.placa || '[PLACA]'}${multa.valor ? ` · Valor: R$ ${Number(multa.valor).toFixed(2)}` : ''}
Emitido em: ${new Date().toLocaleString('pt-BR')}

RESULTADO DA AUDITORIA
Índice de Consistência: ${jurimetria.indice}
Inconsistências apontadas: ${jurimetria.teses.length} de 14 verificações
Estimativa de êxito: ${jurimetria.probabilidade}% (faixa ${jurimetria.faixa})

AS 14 VERIFICAÇÕES

${linhas}`;

  return montar({
    titulo: 'Extrato de Auditoria — 14 verificações',
    subtitulo: 'Verificação documental com base normativa citada item a item',
    corpo,
    rodape_nota: jurimetria.disclaimer + ' ' + (jurimetria.nota_correlacao || '')
  });
}

module.exports = { defesaPDF, extratoPDF, montar };
