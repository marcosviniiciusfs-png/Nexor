const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const readResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const buildLeadPayload = (leadData) => ({
  ...leadData,
  nome: leadData.nome,
  telefone: leadData.telefone,
  whatsapp: leadData.whatsapp || leadData.telefone,
  tipo: "IMOVEL",
  tipo_bem: leadData.tipo_bem,
  valor_pretendido: leadData.valor_pretendido,
  valor_pretendido_numero: leadData.valor_pretendido_numero,
  possui_entrada: leadData.possui_entrada,
  valor_entrada: leadData.valor_entrada,
  valor_entrada_numero: leadData.valor_entrada_numero,
  parcela_ideal: leadData.parcela_ideal,
  parcela_ideal_numero: leadData.parcela_ideal_numero,
  cidade: leadData.cidade,
  tempo_aquisicao: leadData.tempo_aquisicao,
  origem: leadData.origem || "simulador_grupo_uniao",
  data_entrada: leadData.data_entrada || new Date().toISOString().split("T")[0],
  event_id: leadData.event_id,
  source_url: leadData.source_url,
  user_agent: leadData.user_agent,
});

const validateLeadPayload = (leadData) => {
  const missing = [];
  if (!leadData.nome?.trim()) missing.push("nome");
  if (!leadData.telefone?.trim()) missing.push("telefone");
  if (!leadData.tipo_bem?.trim()) missing.push("tipo_bem");
  if (!leadData.valor_pretendido?.trim()) missing.push("valor_pretendido");
  if (!leadData.possui_entrada?.trim()) missing.push("possui_entrada");
  if (!leadData.parcela_ideal?.trim()) missing.push("parcela_ideal");
  if (!leadData.cidade?.trim()) missing.push("cidade");
  if (!leadData.tempo_aquisicao?.trim()) missing.push("tempo_aquisicao");

  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}`;
  }

  return null;
};

const sendLeadWebhook = async (leadData, env) => {
  if (!env.LEAD_WEBHOOK_URL) {
    return { success: false, error: "LEAD_WEBHOOK_URL is not configured" };
  }

  if (!env.LEAD_WEBHOOK_TOKEN) {
    return { success: false, error: "LEAD_WEBHOOK_TOKEN is not configured" };
  }

  const response = await fetch(env.LEAD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.LEAD_WEBHOOK_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildLeadPayload(leadData)),
  });

  const data = await readResponseBody(response);

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      data,
      error:
        data && typeof data === "object" && data.message
          ? String(data.message)
          : `Lead webhook error: ${response.status}`,
    };
  }

  return { success: true, status: response.status, data };
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const traceId = crypto.randomUUID().slice(0, 8).toUpperCase();

    try {
      let leadData;
      try {
        leadData = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON payload", traceId }, 400);
      }

      const validationError = validateLeadPayload(leadData);
      if (validationError) {
        return jsonResponse({ error: validationError, traceId }, 400);
      }

      const leadWebhook = await sendLeadWebhook(leadData, env);

      if (!leadWebhook.success) {
        return jsonResponse(
          {
            success: false,
            error: leadWebhook.error || "Lead webhook failed",
            leadWebhook,
            traceId,
          },
          502
        );
      }

      return jsonResponse({ success: true, leadWebhook, traceId });
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          traceId,
        },
        500
      );
    }
  },
};
