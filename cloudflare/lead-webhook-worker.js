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

const isPostMethodMismatch = (response, data) => {
  if (response.status !== 404) return false;

  const message =
    typeof data === "string"
      ? data
      : data && typeof data === "object" && data.message
        ? String(data.message)
        : "";

  return /not registered for post requests/i.test(message);
};

const appendQueryParams = (url, payload) => {
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }
};

const compactObject = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== ""));

const normalizeForHash = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizePhoneForMeta = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
};

const sha256Hex = async (value) => {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const hashText = async (value) => {
  const normalized = normalizeForHash(value);
  return normalized ? sha256Hex(normalized) : undefined;
};

const splitName = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
};

const parseNumericValue = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const numbers = String(value || "").replace(/\D/g, "");
  return numbers ? Number(numbers) / 100 : undefined;
};

const buildLeadPayload = (leadData) => ({
  ...leadData,
  nome: leadData.nome,
  telefone: leadData.telefone,
  whatsapp: leadData.whatsapp || leadData.telefone,
  tipo: "IMOVEL",
  tipo_bem: leadData.tipo_bem,
  interesse_condicoes_limitadas: leadData.interesse_condicoes_limitadas,
  valor_pretendido: leadData.valor_pretendido,
  valor_pretendido_numero: leadData.valor_pretendido_numero,
  possui_entrada: leadData.possui_entrada,
  valor_entrada: leadData.valor_entrada,
  valor_entrada_numero: leadData.valor_entrada_numero,
  parcela_ideal: leadData.parcela_ideal,
  parcela_ideal_numero: leadData.parcela_ideal_numero,
  cidade: leadData.cidade,
  tempo_aquisicao: leadData.tempo_aquisicao,
  origem: leadData.origem || "simulador_nexor_financeira",
  empresa: leadData.empresa || "Nexor Financeira",
  telefone_empresa: leadData.telefone_empresa || "5511921577591",
  whatsapp_destino: leadData.whatsapp_destino || "5511921577591",
  data_entrada: leadData.data_entrada || new Date().toISOString().split("T")[0],
  event_id: leadData.event_id,
  source_url: leadData.source_url,
  user_agent: leadData.user_agent,
});

const buildLeadDestinations = (env) => {
  const destinations = [];
  const hurtzCrmUrl = env.HURTZ_CRM_WEBHOOK_URL || env.HURTZ_LEAD_WEBHOOK_URL;
  const hurtzCrmSecret = env.HURTZ_CRM_WEBHOOK_SECRET || env.HURTZ_WEBHOOK_SECRET;

  if (env.LEAD_WEBHOOK_URL) {
    destinations.push({
      name: "simulead",
      url: env.LEAD_WEBHOOK_URL,
      token: env.LEAD_WEBHOOK_TOKEN,
      requiresToken: true,
    });
  }

  if (hurtzCrmUrl) {
    destinations.push({
      name: "hurtz_crm",
      url: hurtzCrmUrl,
      headers: {
        "X-Hurtz-Webhook-Secret": hurtzCrmSecret,
      },
      requiredSecrets: [
        {
          name: "HURTZ_CRM_WEBHOOK_SECRET",
          value: hurtzCrmSecret,
        },
      ],
    });
  }

  return destinations;
};

const trimSlashes = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

const sanitizePathSegment = (value) => {
  const normalized = normalizeForHash(value).replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return normalized || "lead";
};

const getLeadStorageConfig = (env) => {
  return {
    directory: trimSlashes(env.GITHUB_LEADS_DIRECTORY || "leads-cadastrados"),
  };
};

const buildLeadStoragePath = (leadPayload, config, storedAt, traceId) => {
  const date = storedAt.slice(0, 10);
  const timestamp = storedAt.replace(/[:.]/g, "-");
  const leadId = sanitizePathSegment(leadPayload.event_id || traceId || crypto.randomUUID());

  return `${config.directory}/${date}/${timestamp}-${leadId}.json`;
};

const queueLeadForGitHubExport = async (leadPayload, env, traceId) => {
  if (!env.LEADS_KV) {
    return { success: false, error: "LEADS_KV binding is not configured" };
  }

  const config = getLeadStorageConfig(env);
  const storedAt = new Date().toISOString();
  const path = buildLeadStoragePath(leadPayload, config, storedAt, traceId);
  const key = `pending/${path}`;
  const record = {
    schema_version: 1,
    stored_at: storedAt,
    trace_id: traceId,
    source: "simulador_nexor_financeira",
    path,
    lead: leadPayload,
  };

  try {
    await env.LEADS_KV.put(key, JSON.stringify(record), {
      metadata: {
        path,
        stored_at: storedAt,
        trace_id: traceId,
      },
    });

    return {
      success: true,
      queued: true,
      path,
      key,
    };
  } catch (error) {
    return {
      success: false,
      path,
      error: error instanceof Error ? error.message : "Unknown lead queue error",
    };
  }
};

const dispatchLeadExportWorkflow = async (queuedLead, env) => {
  const repository = env.GITHUB_DISPATCH_REPOSITORY;
  const eventType = env.GITHUB_DISPATCH_EVENT || "lead-created";

  if (!repository) {
    return { success: true, skipped: true, reason: "GITHUB_DISPATCH_REPOSITORY is not configured" };
  }

  if (!/^[^/]+\/[^/]+$/.test(repository)) {
    return { success: false, error: "GITHUB_DISPATCH_REPOSITORY must use the owner/repo format" };
  }

  if (!env.GITHUB_DISPATCH_TOKEN) {
    return { success: true, skipped: true, reason: "GITHUB_DISPATCH_TOKEN is not configured" };
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "nexor-lead-worker",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: {
          key: queuedLead.key,
          path: queuedLead.path,
        },
      }),
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
            : `GitHub dispatch error: ${response.status}`,
      };
    }

    return { success: true, status: response.status, repository, eventType };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown GitHub dispatch error",
    };
  }
};

const getLeadExportToken = (request) => {
  const authorization = request.headers.get("Authorization") || "";
  const bearerToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearerToken) return bearerToken;

  return new URL(request.url).searchParams.get("token");
};

const isLeadExportAuthorized = (request, env) => {
  const token = getLeadExportToken(request);
  return Boolean(env.LEAD_EXPORT_TOKEN && token && token === env.LEAD_EXPORT_TOKEN);
};

const listPendingLeadExports = async (env) => {
  const list = await env.LEADS_KV.list({ prefix: "pending/", limit: 1000 });
  const items = [];

  for (const item of list.keys) {
    const record = await env.LEADS_KV.get(item.name, "json");
    if (!record) continue;

    items.push({
      key: item.name,
      path: record.path || item.name.replace(/^pending\//, ""),
      content: record,
    });
  }

  return items;
};

const handleLeadExport = async (request, env) => {
  if (!env.LEADS_KV) {
    return jsonResponse({ success: false, error: "LEADS_KV binding is not configured" }, 500);
  }

  if (!isLeadExportAuthorized(request, env)) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  if (request.method === "GET") {
    const items = await listPendingLeadExports(env);
    return jsonResponse({ success: true, items, count: items.length });
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON payload" }, 400);
    }

    const keys = Array.isArray(body.keys) ? body.keys.filter((key) => typeof key === "string" && key.startsWith("pending/")) : [];

    await Promise.all(keys.map((key) => env.LEADS_KV.delete(key)));

    return jsonResponse({ success: true, deleted: keys.length });
  }

  return jsonResponse({ success: false, error: "Method not allowed" }, 405);
};

const buildMetaCapiPayload = async (leadData, request) => {
  const { firstName, lastName } = splitName(leadData.nome);
  const phone = normalizePhoneForMeta(leadData.telefone || leadData.whatsapp);
  const hashedPhone = phone ? await sha256Hex(phone) : undefined;
  const eventSourceUrl = leadData.source_url || request.headers.get("Origin") || "https://nexor.simulead.com.br/";
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim();

  return {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: leadData.event_id,
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data: compactObject({
          ph: hashedPhone ? [hashedPhone] : undefined,
          fn: await hashText(firstName),
          ln: await hashText(lastName),
          ct: await hashText(leadData.cidade),
          country: await hashText("br"),
          fbp: leadData.fbp,
          fbc: leadData.fbc,
          client_ip_address: clientIp,
          client_user_agent: leadData.user_agent || request.headers.get("User-Agent"),
        }),
        custom_data: compactObject({
          currency: "BRL",
          value: parseNumericValue(leadData.valor_pretendido_numero ?? leadData.valor_pretendido),
          content_name: "Simulador Nexor Financeira",
          content_category: "IMOVEL",
          tipo: "IMOVEL",
          tipo_bem: leadData.tipo_bem,
          interesse_condicoes_limitadas: leadData.interesse_condicoes_limitadas,
          cidade: leadData.cidade,
          tempo_aquisicao: leadData.tempo_aquisicao,
          possui_entrada: leadData.possui_entrada,
          valor_pretendido: leadData.valor_pretendido,
          parcela_ideal: leadData.parcela_ideal,
        }),
      },
    ],
  };
};

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

const sendLeadDestination = async (destination, leadPayload) => {
  if (!destination.url) {
    return { success: false, name: destination.name, error: "Webhook URL is not configured" };
  }

  if (destination.requiresToken && !destination.token) {
    return { success: false, name: destination.name, error: "LEAD_WEBHOOK_TOKEN is not configured" };
  }

  const missingSecret = destination.requiredSecrets?.find((secret) => !secret.value);
  if (missingSecret) {
    return { success: false, name: destination.name, error: `${missingSecret.name} is not configured` };
  }

  const headers = {
    "Content-Type": "application/json",
    ...(destination.headers || {}),
  };

  if (destination.token) {
    headers.Authorization = `Bearer ${destination.token}`;
  }

  try {
    const response = await fetch(destination.url, {
      method: "POST",
      headers,
      body: JSON.stringify(leadPayload),
    });

    const data = await readResponseBody(response);

    if (isPostMethodMismatch(response, data)) {
      const getUrl = new URL(destination.url);
      appendQueryParams(getUrl, leadPayload);

      const getHeaders = {};
      if (destination.token) {
        getHeaders.Authorization = `Bearer ${destination.token}`;
      }

      const getResponse = await fetch(getUrl.toString(), {
        method: "GET",
        headers: getHeaders,
      });
      const getData = await readResponseBody(getResponse);

      if (!getResponse.ok) {
        return {
          success: false,
          name: destination.name,
          status: getResponse.status,
          data: getData,
          method: "GET",
          error:
            getData && typeof getData === "object" && getData.message
              ? String(getData.message)
              : `Lead webhook error: ${getResponse.status}`,
        };
      }

      return { success: true, name: destination.name, status: getResponse.status, data: getData, method: "GET" };
    }

    if (!response.ok) {
      return {
        success: false,
        name: destination.name,
        status: response.status,
        data,
        method: "POST",
        error:
          data && typeof data === "object" && data.message
            ? String(data.message)
            : `Lead webhook error: ${response.status}`,
      };
    }

    return { success: true, name: destination.name, status: response.status, data, method: "POST" };
  } catch (error) {
    return {
      success: false,
      name: destination.name,
      error: error instanceof Error ? error.message : "Unknown webhook error",
    };
  }
};

const sendLeadWebhooks = async (leadPayload, env) => {
  const destinations = buildLeadDestinations(env);

  if (destinations.length === 0) {
    return { success: false, error: "No lead webhooks are configured", results: [] };
  }

  const results = await Promise.all(destinations.map((destination) => sendLeadDestination(destination, leadPayload)));
  const failed = results.filter((result) => !result.success);

  if (failed.length > 0) {
    return {
      success: false,
      results,
      error: failed.map((result) => `${result.name}: ${result.error || `HTTP ${result.status}`}`).join("; "),
    };
  }

  return { success: true, results };
};

const sendMetaCapi = async (leadData, request, env) => {
  if (!env.META_PIXEL_ID) {
    return { success: false, error: "META_PIXEL_ID is not configured" };
  }

  if (!env.META_CAPI_ACCESS_TOKEN) {
    return { success: false, error: "META_CAPI_ACCESS_TOKEN is not configured" };
  }

  const version = env.META_GRAPH_API_VERSION || "v25.0";
  const url = `https://graph.facebook.com/${version}/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(
    env.META_CAPI_ACCESS_TOKEN
  )}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(await buildMetaCapiPayload(leadData, request)),
  });
  const data = await readResponseBody(response);

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      data,
      error:
        data && typeof data === "object" && data.error && data.error.message
          ? String(data.error.message)
          : `Meta CAPI error: ${response.status}`,
    };
  }

  return { success: true, status: response.status, data };
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname === "/lead-export") {
      return handleLeadExport(request, env);
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

      const leadPayload = buildLeadPayload(leadData);
      const leadWebhooks = await sendLeadWebhooks(leadPayload, env);

      if (!leadWebhooks.success) {
        return jsonResponse(
          {
            success: false,
            error: leadWebhooks.error || "Lead webhook failed",
            leadWebhooks,
            traceId,
          },
          502
        );
      }

      const githubStorage = await queueLeadForGitHubExport(leadPayload, env, traceId);

      if (!githubStorage.success) {
        return jsonResponse(
          {
            success: false,
            error: githubStorage.error || "GitHub lead queue failed",
            leadWebhooks,
            githubStorage,
            traceId,
          },
          502
        );
      }

      const githubDispatch = await dispatchLeadExportWorkflow(githubStorage, env);

      if (!githubDispatch.success) {
        return jsonResponse(
          {
            success: false,
            error: githubDispatch.error || "GitHub lead export dispatch failed",
            leadWebhooks,
            githubStorage,
            githubDispatch,
            traceId,
          },
          502
        );
      }

      const metaCapi = await sendMetaCapi(leadPayload, request, env);

      return jsonResponse({ success: true, leadWebhooks, githubStorage, githubDispatch, metaCapi, traceId });
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
