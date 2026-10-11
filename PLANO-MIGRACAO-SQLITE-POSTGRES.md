# Plano de migração SQLite → PostgreSQL — VeriMulta

Status: plano técnico; nenhuma migração foi executada.

## Estado atual confirmado

O backend usa `better-sqlite3`, `journal_mode=WAL`, tabelas criadas por `CREATE TABLE IF NOT EXISTS` e alterações de colunas por `ALTER TABLE` idempotente durante o boot. As entidades incluem usuários, veículos, multas, diagnósticos, recursos, feedbacks, pagamentos, e-mails e varreduras. Não há migration runner versionado nem camada de repositório que abstraia o dialeto.

As foreign keys aparecem declaradas nas tabelas, mas o boot auditado não ativa explicitamente `PRAGMA foreign_keys=ON`; isso deve ser medido/corrigido em uma mudança própria antes de depender da garantia no SQLite. Há transação explícita no fluxo de anonimização LGPD, mas não existe uma transação única envolvendo todos os efeitos de cada webhook, criação de multa ou job. O registro de pagamentos não apresenta uma constraint de unicidade para evento externo. Esses são riscos confirmados no código, não problemas resolvidos pelo plano.

## Estratégia recomendada

1. Congelar o inventário de schema e dados em uma cópia restaurável; medir volume, crescimento e registros inconsistentes.
2. Criar schema PostgreSQL versionado, com constraints, índices por usuário/veículo e timestamps explícitos. Manter IDs e chaves externas compatíveis durante a transição.
3. Substituir o acesso direto por uma camada de persistência compatível com transações antes do cutover. Não fazer conversão mecânica de SQL sem revisar `datetime('now')`, `lastInsertRowid`, WAL e consultas de JSON.
4. Executar carga inicial em staging, comparar contagens, amostras, relações, totais financeiros e exportações LGPD; testar autenticação, isolamento por usuário e deduplicação.
5. Rodar um período de dual-read ou réplica controlada somente após definir consistência e idempotência. Não manter dois bancos graváveis sem estratégia de conflitos.
6. Fazer cutover com janela, backup final, modo somente leitura/pausa de escrita, validação de smoke e rollback para o snapshot SQLite se os critérios falharem.
7. Após estabilização, retirar SQLite apenas com evidência de restauração, observabilidade e plano de reversão aprovado.

## Pontos de revisão obrigatórios

- Transações para criação de multa/diagnóstico/recurso e processamento de webhook.
- Unicidade e idempotência de AIT por usuário, eventos de pagamento e alertas de e-mail.
- Idempotência de webhook por `referencia_externa`/evento e proteção contra reprocessamento fora de ordem.
- Foreign keys e política de anonimização LGPD.
- Tipos de data, timezone civil brasileiro e valores monetários sem perda de precisão.
- JSON de auditoria, payloads de pagamento e retenção de PII.
- Índices para consultas por `usuario_id`, `veiculo_id`, prazo e histórico administrativo.

## Critério de aceite

Nenhum corte será considerado concluído sem backup restaurado, comparação automatizada de dados, testes de autorização/isolamento, validação dos fluxos de pagamento e rollback ensaiado. A escolha do provedor PostgreSQL, tamanho e custo depende de volume e RPO/RTO ainda não informados.
