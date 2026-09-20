/**
 * VERIMULTA — carrega o arquivo .env, quando existir.
 *
 * Em produção (Render) as chaves vêm do painel e este arquivo nem existe.
 * No computador de casa, digitar `$env:CHAVE="..."` a cada vez que liga o
 * servidor é um convite a erro — então o atalho de configuração grava um
 * `.env` ao lado do `servidor.js` e este módulo o carrega no boot.
 *
 * Regra: **nunca sobrescreve** uma variável que já veio do ambiente real.
 * Assim o .env é só um padrão local, e o Render continua mandando em produção.
 *
 * Tem de ser o PRIMEIRO require do servidor.js: o config.js lê process.env
 * já na carga.
 */
const fs = require('fs');
const path = require('path');

const ARQUIVO = process.env.ARQUIVO_ENV || path.join(__dirname, '.env');

function carregar(arquivo = ARQUIVO) {
  if (!fs.existsSync(arquivo)) return { carregadas: 0, arquivo: null };
  let carregadas = 0;
  for (const linha of fs.readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const texto = linha.trim();
    if (!texto || texto.startsWith('#')) continue;
    const corte = texto.indexOf('=');
    if (corte < 1) continue;
    const chave = texto.slice(0, corte).trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(chave)) continue;
    if (process.env[chave] !== undefined) continue;   // ambiente real tem prioridade
    let valor = texto.slice(corte + 1).trim();
    // aspas são opcionais; servem para preservar espaços no valor
    if ((valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))) valor = valor.slice(1, -1);
    process.env[chave] = valor;
    carregadas++;
  }
  return { carregadas, arquivo };
}

const resultado = carregar();
if (resultado.carregadas) {
  console.log(`[config] ${resultado.carregadas} variável(is) carregada(s) de ${path.basename(resultado.arquivo)}`);
}

module.exports = { carregar, ARQUIVO };
