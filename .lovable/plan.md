

# Forcar Lead no Funil Correto (Anti-Automacao Kommo)

## Problema
O lead esta sendo criado no funil "TRAFEGO PAGO" corretamente, mas uma **automacao interna do Kommo** move o lead automaticamente para o "Funil de Vendas" na etapa "Ligacao" logo apos a criacao. Isso acontece em milessegundos, antes mesmo da nossa verificacao.

## Solucao
Adicionar um **PATCH forcado** apos a criacao do lead, com um pequeno delay para deixar a automacao do Kommo rodar primeiro, e entao sobrescrever o pipeline/status de volta para o correto.

## O que sera alterado

### Edge Function (`supabase/functions/send-to-kommo/index.ts`)

Apos criar o lead e adicionar a nota, vamos:

1. **Aguardar 2 segundos** -- tempo suficiente para qualquer automacao do Kommo mover o lead
2. **Forcar PATCH** -- chamar `PATCH /api/v4/leads/{leadId}` com:
   - `pipeline_id: 12050999` (TRAFEGO PAGO)
   - `status_id: 92979627` (Etapa de leads de entrada)
   - Isso sobrescreve qualquer mudanca feita pela automacao
3. **Verificar novamente** -- fazer o GET de verificacao **depois** do PATCH para confirmar que o lead ficou onde deve
4. **Retry no PATCH** -- se o PATCH falhar, tentar novamente (usa o mesmo `fetchWithRetry` que ja existe)

### Fluxo atualizado

```text
1. POST /leads/complex  -->  Cria lead no funil correto
2. POST /leads/{id}/notes  -->  Adiciona nota com detalhes
3. Aguarda 2 segundos  -->  Deixa automacao do Kommo rodar
4. PATCH /leads/{id}  -->  Forca pipeline_id + status_id de volta
5. GET /leads/{id}  -->  Verifica se esta no lugar certo
6. Retorna resultado com verified=true/false
```

### Nenhuma alteracao no frontend
Apenas a edge function sera modificada. O frontend (`Simulator.tsx` e `ThankYou.tsx`) ja esta preparado para receber o campo `verified`.

## Secao tecnica

O trecho novo sera inserido entre a adicao da nota (linha ~184) e a verificacao existente (linha ~187):

```typescript
// --- Force lead into correct pipeline/status (override Kommo automations) ---
console.log(`[${traceId}] Aguardando 2s para automacoes do Kommo...`);
await new Promise((r) => setTimeout(r, 2000));

const patchPayload = {
  pipeline_id: PIPELINE_ID,
  status_id: STATUS_ID,
};

const patchRes = await fetchWithRetry(
  `https://${KOMMO_API_DOMAIN}/api/v4/leads/${leadId}`,
  { method: 'PATCH', headers: authHeaders, body: JSON.stringify(patchPayload) }
);
console.log(`[${traceId}] PATCH forçado: ${patchRes.status}`);
```

## Observacao importante
Se o Kommo tiver uma automacao que roda **continuamente** (nao apenas na criacao), ela pode mover o lead de novo depois do nosso PATCH. Nesse caso, a solucao definitiva seria **desativar ou ajustar a automacao dentro do Kommo**. Mas o PATCH forcado resolve o caso mais comum (automacao que roda apenas no momento da criacao).
