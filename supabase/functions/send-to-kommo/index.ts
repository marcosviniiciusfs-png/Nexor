import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const PIPELINE_ID = 12050999;
const STATUS_ID = 92979627;
const TAG_NAME = 'SIMULADOR MALTA';

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  backoffMs = 300
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res; // don't retry client errors
      if (attempt < retries) {
        console.warn(`Attempt ${attempt} failed (${res.status}), retrying in ${backoffMs}ms...`);
        await new Promise((r) => setTimeout(r, backoffMs));
        backoffMs *= 3;
      } else {
        return res;
      }
    } catch (err) {
      if (attempt < retries) {
        console.warn(`Attempt ${attempt} network error, retrying in ${backoffMs}ms...`, err);
        await new Promise((r) => setTimeout(r, backoffMs));
        backoffMs *= 3;
      } else {
        throw err;
      }
    }
  }
  throw new Error('fetchWithRetry: should not reach here');
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = crypto.randomUUID().slice(0, 8).toUpperCase();
  console.log(`[${traceId}] ▶ Início do processamento`);

  try {
    const KOMMO_ACCESS_TOKEN = Deno.env.get('KOMMO_ACCESS_TOKEN');
    const rawDomain = Deno.env.get('KOMMO_API_DOMAIN') || 'api-g.kommo.com';
    const KOMMO_API_DOMAIN = rawDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    if (!KOMMO_ACCESS_TOKEN) {
      return jsonResponse({ error: 'KOMMO_ACCESS_TOKEN não configurado', traceId }, 500);
    }

    let leadData: Record<string, unknown>;
    try {
      leadData = await req.json();
    } catch {
      return jsonResponse({ error: 'Payload JSON inválido', traceId }, 400);
    }

    // Skip non-lead payloads (e.g. debug actions)
    if (leadData.action) {
      return jsonResponse({ error: 'Ação de debug não suportada neste endpoint', traceId }, 400);
    }

    console.log(`[${traceId}] Dados recebidos:`, JSON.stringify(leadData));

    // --- Payload validation ---
    const { fullName, whatsapp, propertyType, creditAmount, downPaymentAmount, monthlyPayment, city } = leadData as {
      fullName?: string; whatsapp?: string; propertyType?: string;
      creditAmount?: string; downPaymentAmount?: string; monthlyPayment?: string; city?: string;
    };

    const missing: string[] = [];
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) missing.push('fullName');
    if (!whatsapp || typeof whatsapp !== 'string' || !whatsapp.trim()) missing.push('whatsapp');
    if (!propertyType || typeof propertyType !== 'string') missing.push('propertyType');
    if (!city || typeof city !== 'string' || !city.trim()) missing.push('city');

    if (missing.length > 0) {
      console.error(`[${traceId}] Campos obrigatórios faltando: ${missing.join(', ')}`);
      return jsonResponse({ error: `Campos obrigatórios faltando: ${missing.join(', ')}`, traceId }, 400);
    }

    // Clean phone number
    const cleanPhone = whatsapp!.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const noteText = [
      `Protocolo: ${traceId}`,
      `Tipo de Bem: ${propertyType}`,
      `Valor Pretendido: ${creditAmount || 'N/A'}`,
      `Valor de Entrada: ${downPaymentAmount || 'Não tem'}`,
      `Parcela Ideal: ${monthlyPayment || 'N/A'}`,
      `Cidade: ${city}`,
    ].join('\n');

    const authHeaders = {
      'Authorization': `Bearer ${KOMMO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // --- Create lead ---
    const kommoPayload = [
      {
        name: `${propertyType} - ${fullName!.trim()} [${traceId}]`,
        pipeline_id: PIPELINE_ID,
        status_id: STATUS_ID,
        tags: [{ name: TAG_NAME }],
        _embedded: {
          contacts: [
            {
              first_name: fullName!.trim(),
              custom_fields_values: [
                {
                  field_code: 'PHONE',
                  values: [{ value: phoneWithCountry, enum_code: 'WORK' }],
                },
              ],
            },
          ],
        },
      },
    ];

    console.log(`[${traceId}] Enviando para Kommo...`);

    const kommoResponse = await fetchWithRetry(
      `https://${KOMMO_API_DOMAIN}/api/v4/leads/complex`,
      { method: 'POST', headers: authHeaders, body: JSON.stringify(kommoPayload) }
    );

    const responseText = await kommoResponse.text();
    console.log(`[${traceId}] Resposta Kommo criação: ${kommoResponse.status} ${responseText}`);

    if (!kommoResponse.ok) {
      return jsonResponse({
        error: `Kommo API error: ${kommoResponse.status}`,
        details: responseText,
        traceId,
      }, 500);
    }

    let kommoResult: any;
    try { kommoResult = JSON.parse(responseText); } catch { kommoResult = null; }

    const leadId = kommoResult?.[0]?.id;
    if (!leadId) {
      return jsonResponse({
        error: 'Lead criado mas ID não retornado pelo Kommo',
        raw: responseText,
        traceId,
      }, 500);
    }

    console.log(`[${traceId}] Lead criado: ${leadId}`);

    // --- Add note (non-blocking) ---
    let noteAdded = false;
    try {
      const notePayload = [{ note_type: 'common', params: { text: noteText } }];
      const noteRes = await fetchWithRetry(
        `https://${KOMMO_API_DOMAIN}/api/v4/leads/${leadId}/notes`,
        { method: 'POST', headers: authHeaders, body: JSON.stringify(notePayload) }
      );
      noteAdded = noteRes.ok;
      console.log(`[${traceId}] Nota: ${noteRes.status}`);
    } catch (err) {
      console.error(`[${traceId}] Erro ao adicionar nota:`, err);
    }

    // --- Force lead into correct pipeline/status (override Kommo automations) ---
    console.log(`[${traceId}] Aguardando 2s para automações do Kommo...`);
    await new Promise((r) => setTimeout(r, 2000));

    const patchPayload = { pipeline_id: PIPELINE_ID, status_id: STATUS_ID };
    try {
      const patchRes = await fetchWithRetry(
        `https://${KOMMO_API_DOMAIN}/api/v4/leads/${leadId}`,
        { method: 'PATCH', headers: authHeaders, body: JSON.stringify(patchPayload) }
      );
      console.log(`[${traceId}] PATCH forçado: ${patchRes.status}`);
    } catch (err) {
      console.error(`[${traceId}] Erro no PATCH forçado:`, err);
    }

    // --- Verify lead in correct pipeline/status ---
    let verified = false;
    try {
      const verifyRes = await fetchWithRetry(
        `https://${KOMMO_API_DOMAIN}/api/v4/leads/${leadId}`,
        { method: 'GET', headers: authHeaders }
      );
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        const vPipeline = verifyData.pipeline_id;
        const vStatus = verifyData.status_id;
        console.log(`[${traceId}] Verificação: pipeline=${vPipeline} status=${vStatus}`);

        if (vPipeline === PIPELINE_ID && vStatus === STATUS_ID) {
          verified = true;
        } else {
          console.warn(`[${traceId}] Lead está em pipeline/status incorretos: ${vPipeline}/${vStatus}`);
        }
      }
    } catch (err) {
      console.error(`[${traceId}] Erro na verificação:`, err);
    }

    const leadUrl = `https://${KOMMO_API_DOMAIN}/leads/detail/${leadId}`;

    console.log(`[${traceId}] ✅ Concluído | leadId=${leadId} | verified=${verified} | leadUrl=${leadUrl}`);

    return jsonResponse({
      success: true,
      leadId,
      traceId,
      pipelineId: PIPELINE_ID,
      statusId: STATUS_ID,
      tag: TAG_NAME,
      leadUrl,
      verified,
      noteAdded,
    }, 200);

  } catch (error) {
    console.error(`[${traceId}] ❌ Erro:`, error);
    return jsonResponse({ error: error.message, traceId }, 500);
  }
});
