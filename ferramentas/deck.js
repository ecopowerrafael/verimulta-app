/**
 * VERIMULTA — motor de composição dos documentos operacionais em PDF.
 *
 * Os manuais eram slides 16:9 gerados fora do repositório, o que fez o texto
 * deles envelhecer em silêncio enquanto o código mudava (webhook no endereço
 * errado, grade de planos divergente). A partir daqui o documento é CÓDIGO:
 * versionado, regenerável e conferível contra o sistema.
 *
 * Marcação aceita no corpo: **negrito** e `código`.
 */
const PDFDocument = require('pdfkit');

// ---------- marca ----------
const COR = {
  noite: '#071E42', placa: '#0B3C7E', placa2: '#0E4C9E',
  sinal: '#FFC933', papel: '#F7F8F5', branco: '#FFFFFF',
  ink: '#12171D', cinza: '#5B6570', linha: '#E3E6E0',
  ok: '#0E8A5F', alerta: '#D6453A', claro: '#B9C9E0'
};
const LARGURA = 960, ALTURA = 540, MARGEM = 56;

/**
 * As fontes base do PDF (Helvetica/Courier) usam a codificação WinAnsi, que não
 * tem seta, ✓, algarismos circulados nem emoji. Emitir um desses caracteres não
 * dá erro: o PDF sai com um glifo errado E a medição de largura quebra, o que
 * faz os trechos em negrito se sobreporem ao texto anterior. Por isso tudo o
 * que vai para a página passa por `sanear()`.
 *
 * Embutir uma fonte Unicode resolveria, mas as únicas disponíveis nesta máquina
 * são licenciadas pela Microsoft — não cabe embutir num documento da empresa.
 */
const SUBSTITUICOES = [
  [/[→⇒➔➜]/g, '»'], [/[←⇐]/g, '«'], [/[✓✔☑]/g, '·'], [/[✗✘]/g, 'x'],
  [/≥/g, '>='], [/≤/g, '<='], [/≠/g, '!='], [/∏/g, 'produto'], [/∑/g, 'soma'],
  [/①/g, '(1)'], [/②/g, '(2)'], [/③/g, '(3)'], [/④/g, '(4)'],
  [/⑤/g, '(5)'], [/⑥/g, '(6)'], [/⑦/g, '(7)'], [/⑧/g, '(8)'],
  [/[⚠️⚡🔵🚨🎉🥂💳💰📌🔑🗄️📱⚖️🛡️📋📁🇧🇷✍️🗂️🔐🆓🏛️🤖🔔🍎📚🔁✅📆📄🧾🔍📸🖥️🟦]/gu, ''],
  [/️/g, '']
];
/** Codepoints extras que a WinAnsi cobre acima de U+00FF. */
const EXTRAS = new Set([0x152,0x153,0x160,0x161,0x178,0x17D,0x17E,0x192,0x2C6,0x2DC,
  0x2013,0x2014,0x2018,0x2019,0x201A,0x201C,0x201D,0x201E,0x2020,0x2021,0x2022,
  0x2026,0x2030,0x2039,0x203A,0x20AC,0x2122]);

const perdidos = new Set();
const avisosMarcacao = new Set();
function sanear(valor) {
  let t = String(valor ?? '');
  for (const [rx, sub] of SUBSTITUICOES) t = t.replace(rx, sub);
  return [...t].map(ch => {
    const cp = ch.codePointAt(0);
    if (cp < 0x100 || EXTRAS.has(cp)) return ch;
    perdidos.add(ch);
    return '';
  }).join('');
}
/** Caracteres descartados na geração — a ferramenta avisa em vez de sumir calada. */
function caracteresPerdidos() { return [...perdidos]; }
/** Trechos com negrito e código aninhados — sairiam com as crases à mostra. */
function avisosDeMarcacao() { return [...avisosMarcacao]; }
const CONTEUDO = LARGURA - MARGEM * 2;
const RODAPE_PADRAO = 'PRIMECORP BROKERS — CONSULTORIA E INTERMEDIAÇÃO DE NEGÓCIOS LTDA · CNPJ 55.745.297/0001-06';

class Deck {
  constructor({ arquivo, rodape = RODAPE_PADRAO }) {
    this.doc = new PDFDocument({ size: [LARGURA, ALTURA], margin: 0, autoFirstPage: false });
    this.arquivo = arquivo;
    this.rodape = rodape;
    this.pagina = 0;
    this.total = 0;
    this.pedacos = [];
    this.transbordos = [];
    this._slide = '(capa)';
    this._explicito = false;
    this.doc.on('data', d => this.pedacos.push(d));
    // Uma página que o pdfkit cria sozinho significa conteúdo transbordando:
    // o slide fica cortado e o rodapé/numeração saem errados. Registra para a
    // geração acusar em vez de entregar um PDF furado.
    this.doc.on('pageAdded', () => {
      if (!this._explicito) this.transbordos.push(this._slide);
    });
  }

  // ---------- texto com marcação inline ----------
  /** Divide "texto **forte** e `codigo`" em segmentos tipados. */
  _segmentos(texto) {
    const partes = [];
    // Código vem PRIMEIRO na alternância: assim `*` é consumido como código em
    // vez de confundir o delimitador de negrito. O negrito é preguiçoso para
    // aceitar qualquer caractere no meio, inclusive crase.
    const rx = /(`[^`]+`|\*\*[\s\S]+?\*\*)/g;
    let pos = 0, m;
    while ((m = rx.exec(texto)) !== null) {
      if (m.index > pos) partes.push({ tipo: 'normal', txt: texto.slice(pos, m.index) });
      const bruto = m[0];
      if (bruto.startsWith('**')) {
        // Marcação aninhada (**`x`**) não é suportada: sairia com as crases
        // visíveis no PDF. Acusa na geração em vez de entregar o defeito.
        if (bruto.includes('`')) avisosMarcacao.add(bruto.trim());
        partes.push({ tipo: 'forte', txt: bruto.slice(2, -2) });
      }
      else partes.push({ tipo: 'codigo', txt: bruto.slice(1, -1) });
      pos = m.index + bruto.length;
    }
    if (pos < texto.length) partes.push({ tipo: 'normal', txt: texto.slice(pos) });
    return partes.length ? partes : [{ tipo: 'normal', txt: texto }];
  }

  _fonte(tipo, base) {
    if (tipo === 'codigo') return 'Courier-Bold';
    if (tipo !== 'forte') return base;
    const negrito = {
      'Helvetica': 'Helvetica-Bold',
      'Helvetica-Oblique': 'Helvetica-BoldOblique',
      'Helvetica-Bold': 'Helvetica-Bold',
      'Courier': 'Courier-Bold'
    };
    return negrito[base] || base;   // sem variante em negrito, mantém a base
  }

  /** Escreve texto com marcação. Devolve o Y final. */
  rico(texto, x, y, opcoes = {}) {
    const { largura = CONTEUDO, tamanho = 10.5, cor = COR.ink, corForte = COR.ink,
            corCodigo = COR.placa, lineGap = 3, base = 'Helvetica', align = 'left' } = opcoes;
    const segs = this._segmentos(sanear(texto));
    const d = this.doc;
    d.fontSize(tamanho);
    segs.forEach((s, i) => {
      const ultimo = i === segs.length - 1;
      d.font(this._fonte(s.tipo, base))
       .fillColor(s.tipo === 'codigo' ? corCodigo : s.tipo === 'forte' ? corForte : cor)
       .fontSize(s.tipo === 'codigo' ? tamanho - 0.8 : tamanho);
      const op = { width: largura, lineGap, align, continued: !ultimo };
      if (i === 0) d.text(s.txt, x, y, op); else d.text(s.txt, op);
    });
    return d.y;
  }

  /**
   * Altura que um texto com marcação ocupará, sem desenhar.
   * Mede SEGMENTO A SEGMENTO com a fonte de cada um: medir uma célula inteira
   * em Courier só porque ela começa com `código` inflava a linha da tabela.
   * O divisor 0,95 é a folga para a quebra por palavra, que nunca preenche a
   * linha inteira — melhor sobrar um pouco do que cortar texto.
   */
  altura(texto, largura, tamanho = 10.5, lineGap = 3, base = 'Helvetica') {
    const d = this.doc;
    const segs = this._segmentos(sanear(texto));
    let soma = 0, maiorPalavra = 0;
    for (const s of segs) {
      const fonte = this._fonte(s.tipo, base);
      const corpo = s.tipo === 'codigo' ? tamanho - 0.8 : tamanho;
      d.font(fonte).fontSize(corpo);
      soma += d.widthOfString(s.txt);
      for (const palavra of s.txt.split(/\s+/))
        maiorPalavra = Math.max(maiorPalavra, d.widthOfString(palavra));
    }
    // Uma palavra maior que a coluna força quebra: conta como linha cheia.
    const util = Math.max(largura * 0.95, maiorPalavra);
    const linhas = Math.max(1, Math.ceil(soma / util));
    return linhas * (tamanho + lineGap + 1.6);
  }

  // ---------- páginas ----------
  _rodape(claro = false) {
    const d = this.doc, y = ALTURA - 32;
    d.font('Courier').fontSize(7.5).fillColor(claro ? 'rgba(185,201,224,0.75)' : COR.cinza)
     .text(this.rodape, MARGEM, y, { width: CONTEUDO - 60, lineBreak: false, ellipsis: true })
     .text(String(this.pagina).padStart(2, '0') + (this.total ? '/' + String(this.total).padStart(2, '0') : ''),
           MARGEM, y, { width: CONTEUDO, align: 'right', lineBreak: false });
  }

  /** Slide de abertura ou de fecho: fundo noite, título grande. */
  capa({ eyebrow, titulo, subtitulo, fecho = false }) {
    const d = this.doc;
    this.pagina++;
    this._slide = Array.isArray(titulo) ? titulo.join(' ') : titulo;
    this._explicito = true; d.addPage(); this._explicito = false;
    const g = d.linearGradient(0, 0, LARGURA, ALTURA);
    g.stop(0, COR.noite).stop(1, COR.placa);
    d.rect(0, 0, LARGURA, ALTURA).fill(g);
    d.rect(0, 0, LARGURA, 5).fill(COR.sinal);

    let y = fecho ? 150 : 165;
    d.font('Courier-Bold').fontSize(9.5).fillColor(COR.sinal)
     .text(sanear(eyebrow).toUpperCase(), MARGEM, y, { characterSpacing: 2.4, width: CONTEUDO, lineBreak: false });
    y += 26;

    const linhas = Array.isArray(titulo) ? titulo : [titulo];
    d.font('Helvetica-Bold').fontSize(fecho ? 34 : 40);
    for (const linha of linhas) {
      const destaque = linha.startsWith('~');
      d.fillColor(destaque ? COR.sinal : COR.branco)
       .text(sanear(destaque ? linha.slice(1) : linha), MARGEM, y, { width: CONTEUDO - 40, lineBreak: false });
      y += (fecho ? 42 : 48);
    }
    if (subtitulo) {
      y += 12;
      this.rico(subtitulo, MARGEM, y, {
        largura: CONTEUDO - 120, tamanho: 12.5, cor: COR.claro, corForte: COR.branco,
        corCodigo: COR.sinal, lineGap: 4
      });
    }
    this._rodape(true);
    return this;
  }

  /** Slide de conteúdo: fundo papel, barra lateral, eyebrow e título. */
  folha({ eyebrow, titulo }) {
    const d = this.doc;
    this.pagina++;
    this._slide = titulo;
    this._explicito = true; d.addPage(); this._explicito = false;
    d.rect(0, 0, LARGURA, ALTURA).fill(COR.papel);
    d.rect(0, 0, 9, ALTURA).fill(COR.placa);
    d.rect(0, 0, 9, 96).fill(COR.sinal);

    d.font('Courier-Bold').fontSize(9).fillColor(COR.placa)
     .text(sanear(eyebrow).toUpperCase(), MARGEM, 46, { characterSpacing: 2, width: CONTEUDO, lineBreak: false });
    d.font('Helvetica-Bold').fontSize(27).fillColor(COR.ink)
     .text(sanear(titulo), MARGEM, 66, { width: CONTEUDO, lineBreak: false });
    this._rodape();
    this.y = 124;
    return this;
  }

  /** Nota de rodapé do slide (a linha cinza sob o conteúdo). */
  nota(texto) {
    this.rico(texto, MARGEM, ALTURA - 58, {
      largura: CONTEUDO, tamanho: 8.5, cor: COR.cinza, corForte: COR.ink,
      corCodigo: COR.placa, lineGap: 1.5, base: 'Helvetica-Oblique'
    });
    return this;
  }

  // ---------- componentes ----------
  /** Cartões brancos em grade. items: [{titulo, corpo, destaque?}] */
  cartoes(items, colunas = 2, opcoes = {}) {
    const d = this.doc;
    const { y = this.y, vao = 16, tamanhoCorpo = 10 } = opcoes;
    const largura = (CONTEUDO - vao * (colunas - 1)) / colunas;
    const interno = largura - 36;

    const alturas = items.map(it =>
      this.altura(it.titulo, interno, 13, 2, 'Helvetica-Bold') +
      this.altura(it.corpo, interno, tamanhoCorpo, 3) + 44);

    let linhaY = y;
    for (let i = 0; i < items.length; i += colunas) {
      const fila = items.slice(i, i + colunas);
      const alturaFila = Math.max(...alturas.slice(i, i + colunas));
      fila.forEach((it, k) => {
        const x = MARGEM + k * (largura + vao);
        const escuro = !!it.destaque;
        d.roundedRect(x, linhaY, largura, alturaFila, 13)
         .fillAndStroke(escuro ? COR.placa : COR.branco, escuro ? COR.placa : COR.linha);
        if (it.faixa) d.roundedRect(x, linhaY, largura, 4, 2).fill(it.faixa);
        let cy = linhaY + 18;
        d.font('Helvetica-Bold').fontSize(13).fillColor(escuro ? COR.branco : COR.ink)
         .text(sanear(it.titulo), x + 18, cy, { width: interno });
        cy = d.y + 7;
        this.rico(it.corpo, x + 18, cy, {
          largura: interno, tamanho: tamanhoCorpo,
          cor: escuro ? COR.claro : COR.cinza,
          corForte: escuro ? COR.branco : COR.ink,
          corCodigo: escuro ? COR.sinal : COR.placa
        });
      });
      linhaY += alturaFila + vao;
    }
    this.y = linhaY;
    return this;
  }

  /** Passos numerados: barra amarela à esquerda + cartão branco. */
  passos(items, opcoes = {}) {
    const d = this.doc;
    const { y = this.y, vao = 10, tamanhoCorpo = 10 } = opcoes;
    let py = y;
    items.forEach(it => {
      const interno = CONTEUDO - 40;
      const h = this.altura(it.titulo, interno, 12, 2, 'Helvetica-Bold') +
                this.altura(it.corpo, interno, tamanhoCorpo, 3) + 30;
      d.roundedRect(MARGEM, py, CONTEUDO, h, 11).fillAndStroke(COR.branco, COR.linha);
      d.roundedRect(MARGEM, py, 5, h, 2).fill(it.cor || COR.sinal);
      d.font('Helvetica-Bold').fontSize(12).fillColor(COR.ink)
       .text(sanear(it.titulo), MARGEM + 20, py + 12, { width: interno });
      this.rico(it.corpo, MARGEM + 20, d.y + 5, {
        largura: interno, tamanho: tamanhoCorpo, cor: COR.cinza, corForte: COR.ink
      });
      py += h + vao;
    });
    this.y = py;
    return this;
  }

  /** Tabela com cabeçalho navy. */
  tabela({ colunas, larguras, linhas, y = this.y, tamanho = 9.5, zebra = true, respiro = 16 }) {
    const d = this.doc;
    const total = larguras.reduce((a, b) => a + b, 0);
    const escala = CONTEUDO / total;
    const w = larguras.map(v => v * escala);
    const xs = w.reduce((acc, v, i) => { acc.push(i ? acc[i - 1] + w[i - 1] : MARGEM); return acc; }, []);

    // cabeçalho
    const hCab = 27;
    d.rect(MARGEM, y, CONTEUDO, hCab).fill(COR.noite);
    colunas.forEach((c, i) => {
      d.font('Helvetica-Bold').fontSize(8.5).fillColor(COR.branco)
       .text(sanear(c).toUpperCase(), xs[i] + 10, y + 9, { width: w[i] - 20, lineBreak: false, ellipsis: true });
    });

    let ly = y + hCab;
    linhas.forEach((linha, idx) => {
      const alturas = linha.map((cel, i) => this.altura(cel, w[i] - 20, tamanho, 2.5));
      const h = Math.max(...alturas) + respiro;
      if (zebra && idx % 2 === 1) d.rect(MARGEM, ly, CONTEUDO, h).fill('#FFFFFF');
      else d.rect(MARGEM, ly, CONTEUDO, h).fill(COR.papel);
      d.moveTo(MARGEM, ly + h).lineTo(MARGEM + CONTEUDO, ly + h).lineWidth(0.6).stroke(COR.linha);
      linha.forEach((cel, i) => {
        this.rico(cel, xs[i] + 10, ly + respiro / 2, {
          largura: w[i] - 20, tamanho, cor: i === 0 ? COR.ink : COR.cinza,
          corForte: COR.ink, lineGap: 2.5
        });
      });
      ly += h;
    });
    this.y = ly;
    return this;
  }

  /** Duas colunas de itens com marcador (feito / pendente). */
  listas({ esquerda, direita, y = this.y }) {
    const d = this.doc;
    const largura = (CONTEUDO - 28) / 2;
    const desenhar = (bloco, x) => {
      let ly = y;
      d.font('Courier-Bold').fontSize(9).fillColor(bloco.cor)
       .text(sanear(bloco.titulo).toUpperCase(), x, ly, { characterSpacing: 1.4, width: largura, lineBreak: false });
      ly += 22;
      bloco.itens.forEach(item => {
        const h = this.altura(item, largura - 26, 9.8, 2.5) + 11;
        d.roundedRect(x, ly + 1, 13, 13, 4)
         .fillAndStroke(bloco.marcado ? bloco.cor : COR.branco, bloco.cor);
        this.rico(item, x + 22, ly, { largura: largura - 26, tamanho: 9.8, cor: COR.cinza, corForte: COR.ink });
        ly += h;
        d.moveTo(x, ly - 4).lineTo(x + largura, ly - 4).lineWidth(0.5).dash(2, { space: 2 }).stroke(COR.linha);
        d.undash();
      });
      return ly;
    };
    const a = desenhar(esquerda, MARGEM);
    const b = desenhar(direita, MARGEM + largura + 28);
    this.y = Math.max(a, b);
    return this;
  }

  /** Faixa de destaque (aviso forte). */
  faixa(texto, { y = this.y, cor = COR.sinal, fundo = '#FFF7E0' } = {}) {
    const d = this.doc;
    const interno = CONTEUDO - 40;
    const h = this.altura(texto, interno, 10.5, 3) + 26;
    d.roundedRect(MARGEM, y, CONTEUDO, h, 11).fillAndStroke(fundo, cor);
    d.roundedRect(MARGEM, y, 5, h, 2).fill(cor);
    this.rico(texto, MARGEM + 20, y + 13, { largura: interno, tamanho: 10.5, cor: '#5A4A10', corForte: COR.ink });
    this.y = y + h + 12;
    return this;
  }

  /** Fecha o documento e grava o arquivo. */
  gravar() {
    const fs = require('fs');
    const path = require('path');
    return new Promise((resolve, reject) => {
      this.doc.on('end', () => {
        const buffer = Buffer.concat(this.pedacos);
        fs.mkdirSync(path.dirname(this.arquivo), { recursive: true });
        fs.writeFileSync(this.arquivo, buffer);
        resolve({ arquivo: this.arquivo, paginas: this.pagina, bytes: buffer.length, transbordos: this.transbordos });
      });
      this.doc.on('error', reject);
      this.doc.end();
    });
  }
}

module.exports = { Deck, COR, LARGURA, ALTURA, MARGEM, CONTEUDO, sanear, caracteresPerdidos, avisosDeMarcacao };
