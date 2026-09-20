/**
 * VERIMULTA — Segurança de borda: rate limit e CORS.
 * Sem dependência externa: o limitador é uma janela deslizante em memória,
 * suficiente para um processo único (o plano do Render roda 1 instância).
 * Ao escalar para várias instâncias, trocar o Mapa por Redis — a interface
 * dos middlewares não muda.
 */

const baldes = new Map();   // chave "rota|ip" → array de timestamps

// Varre o mapa de tempos em tempos para a memória não crescer sem limite.
const JANELA_LIMPEZA = 10 * 60 * 1000;
setInterval(() => {
  const agora = Date.now();
  for (const [chave, marcas] of baldes) {
    const vivas = marcas.filter(t => agora - t < JANELA_LIMPEZA);
    if (vivas.length) baldes.set(chave, vivas); else baldes.delete(chave);
  }
}, JANELA_LIMPEZA).unref();

/** IP real do cliente (o Render entrega via X-Forwarded-For). */
function ipDe(req) {
  const ff = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return ff || req.ip || req.socket?.remoteAddress || 'desconhecido';
}

/**
 * Middleware de limite de requisições.
 * @param {string} nome  rótulo da rota (separa os baldes)
 * @param {number} max   requisições permitidas na janela
 * @param {number} segundos  tamanho da janela
 */
function limitar(nome, max, segundos) {
  const janela = segundos * 1000;
  return (req, res, next) => {
    const chave = `${nome}|${ipDe(req)}`;
    const agora = Date.now();
    const marcas = (baldes.get(chave) || []).filter(t => agora - t < janela);
    if (marcas.length >= max) {
      const esperar = Math.ceil((janela - (agora - marcas[0])) / 1000);
      res.setHeader('Retry-After', String(esperar));
      return res.status(429).json({
        erro: 'Muitas tentativas. Aguarde antes de tentar de novo.',
        tente_em_segundos: esperar
      });
    }
    marcas.push(agora);
    baldes.set(chave, marcas);
    next();
  };
}

/**
 * CORS com allowlist. ORIGENS_PERMITIDAS é uma lista separada por vírgula.
 * Sem a variável, só responde a requisições de mesma origem (o normal quando
 * o site e a API vivem no mesmo serviço do Render) — nunca "*" em rota com
 * credencial, que era o comportamento anterior.
 */
function cors(req, res, next) {
  const lista = (process.env.ORIGENS_PERMITIDAS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const origem = req.headers.origin;
  if (origem && lista.includes(origem)) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Secret');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

/** Cabeçalhos de endurecimento (equivalente mínimo ao helmet, sem dependência). */
function cabecalhos(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(self)');
  if (process.env.NODE_ENV === 'production')
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

module.exports = { limitar, cors, cabecalhos, ipDe };
