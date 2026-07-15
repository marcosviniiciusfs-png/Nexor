const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const MODE = "meta_conversions_with_github_archive";
const DEFAULT_GITHUB_LEADS_DIR = "leads-cadastrados";
const GITHUB_API_VERSION = "2022-11-28";

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify({ mode: MODE, ...body }), {
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

const trimSlashes = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

const slugify = (value, fallback = "lead") => {
  const slug = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
};

const bytesToBase64 = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
};

const compactObject = (object) =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

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

const getGitHubArchiveConfig = (env) => ({
  owner: env.GITHUB_LEADS_OWNER || "marcosviniiciusfs-png",
  repo: env.GITHUB_LEADS_REPO || "Nexor",
  branch: env.GITHUB_LEADS_BRANCH || "main",
  dir: trimSlashes(env.GITHUB_LEADS_DIR || DEFAULT_GITHUB_LEADS_DIR) || DEFAULT_GITHUB_LEADS_DIR,
});

const buildArchiveFilePath = (leadData, traceId, archivedAt, env) => {
  const { dir } = getGitHubArchiveConfig(env);
  const date = archivedAt.slice(0, 10);
  const timestamp = archivedAt.replace(/[:.]/g, "-");
  const leadSlug = slugify(leadData.nome || leadData.telefone);

  return `${dir}/${date}/${timestamp}-${traceId.toLowerCase()}-${leadSlug}.json`;
};

const buildLeadArchiveRecord = (leadData, request, traceId, archivedAt, metaCapi) => ({
  archive_version: 1,
  archived_at: archivedAt,
  trace_id: traceId,
  mode: MODE,
  destination_results: {
    meta_capi: {
      success: Boolean(metaCapi?.success),
      status: metaCapi?.status,
      data: metaCapi?.data,
    },
  },
  lead: leadData,
  request: {
    source_url: leadData.source_url,
    user_agent: leadData.user_agent || request.headers.get("User-Agent"),
    client_ip_address:
      request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim(),
  },
});

const archiveLeadToGitHub = async (leadData, request, env, { traceId, metaCapi }) => {
  if (!env.GITHUB_LEADS_TOKEN) {
    return { success: false, error: "GITHUB_LEADS_TOKEN is not configured" };
  }

  const archivedAt = new Date().toISOString();
  const config = getGitHubArchiveConfig(env);
  const path = buildArchiveFilePath(leadData, traceId, archivedAt, env);
  const record = buildLeadArchiveRecord(leadData, request, traceId, archivedAt, metaCapi);
  const url = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(
    config.repo
  )}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${env.GITHUB_LEADS_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "nexor-financeira-lead-worker",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    body: JSON.stringify({
      message: `Registra lead Nexor ${leadData.nome || traceId}`,
      content: bytesToBase64(JSON.stringify(record, null, 2)),
      branch: config.branch,
    }),
  });
  const data = await readResponseBody(response);

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      data,
      path,
      error:
        data && typeof data === "object" && data.message
          ? String(data.message)
          : `GitHub lead archive error: ${response.status}`,
    };
  }

  return {
    success: true,
    status: response.status,
    path,
    commit_sha: data?.commit?.sha,
    html_url: data?.content?.html_url,
  };
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

    if (request.method !== "POST") {
      return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    }

    const traceId = crypto.randomUUID().slice(0, 8).toUpperCase();

    try {
      let leadData;
      try {
        leadData = await request.json();
      } catch {
        return jsonResponse({ success: false, error: "Invalid JSON payload", traceId }, 400);
      }

      const validationError = validateLeadPayload(leadData);
      if (validationError) {
        return jsonResponse({ success: false, error: validationError, traceId }, 400);
      }

      const leadPayload = buildLeadPayload(leadData);
      const metaCapi = await sendMetaCapi(leadPayload, request, env);

      if (!metaCapi.success) {
        return jsonResponse(
          {
            success: false,
            error: metaCapi.error || "Meta Conversions API failed",
            metaCapi,
            traceId,
          },
          502
        );
      }

      const leadArchive = await archiveLeadToGitHub(leadPayload, request, env, { traceId, metaCapi });

      if (!leadArchive.success) {
        return jsonResponse(
          {
            success: false,
            error: leadArchive.error || "GitHub lead archive failed",
            metaCapi,
            leadArchive,
            traceId,
          },
          502
        );
      }

      return jsonResponse({ success: true, metaCapi, leadArchive, traceId });
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
