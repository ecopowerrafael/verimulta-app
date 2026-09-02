# CÓDIGO-FONTE VERIMULTA — INFORMAÇÕES E ACESSO

## ARQUITETURA

### Stack Tecnológico
- **Backend:** Node.js + Express.js
- **Banco de Dados:** SQLite (desenvolvimento), PostgreSQL (produção)
- **Frontend:** PWA (Progressive Web App)
- **APIs Externas:** 
  - Google Vision (OCR de multas)
  - Mercado Pago (pagamentos recorrentes)
  - SMTP (notificações por email)

### Módulos Principais
1. **Análise de Multas** — Google Vision OCR + validação CTB
2. **Identificação de Vícios** — Engine de regras (CONTRAN 900/918, INMETRO 158)
3. **Geração de Defesa Prévia** — PDF pronto para protocolar
4. **CNH Monitor** — Consulta pontuação e situação
5. **Prazos & Alertas** — Automação de deadlines administrativos

### Segurança
- LGPD Compliance (exclusão de dados dependentes)
- Encriptação de dados sensíveis
- JWT para autenticação
- HTTPS obrigatório

## ACESSO AO CÓDIGO-FONTE

> **Atualizado em 02/09/2026.** O código deixou de ser referência e passou a estar
> neste repositório: `sistema/` (backend + PWA) e `site-netlify/` (site estático).
> Origem: cópia de 29/08/2026. Ver `AUDITORIA.md` para o laudo, o que foi corrigido
> e as pendências conhecidas.

**Armazenamento Master (histórico):**
- ZIP Selado: `e346289756cc0ed27b55d018bf3a0515d676cfe4e5ac6beaed6f3f8eb2aae117`
- Esse pacote não foi localizado nas máquinas da PrimeCorp; os arquivos-fonte
  íntegros estão em `sistema/`.

**Repositório Git:**
- GitHub público — `agendaprimecorp-lgtm/verimulta`
- Branch: `main`

## PRÓXIMOS PASSOS

1. Transferência de código para repositório privado assinado
2. Documentação técnica (API specs, schemas DB)
3. Setup de CI/CD (GitHub Actions / GitLab CI)
4. Hospedagem: Render (Node.js) + Locaweb (domínio)

---
**Status:** Código pronto para hospedagem em produção
**Data:** 30 de Agosto de 2026
**Responsável:** Claude (Cláudio) — Engenharia
