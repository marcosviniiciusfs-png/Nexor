export type LeadWebhookData = {
  fullName: string;
  whatsapp: string;
  creditAmount: string;
  hasDownPayment: string;
  downPaymentAmount: string;
  monthlyPayment: string;
  city: string;
  acquisitionTime: string;
  propertyType: string;
};

type LeadWebhookPayload = {
  nome: string;
  telefone: string;
  whatsapp: string;
  tipo: "IMOVEL";
  tipo_bem: string;
  valor_pretendido: string;
  possui_entrada: string;
  valor_entrada: string;
  parcela_ideal: string;
  cidade: string;
  tempo_aquisicao: string;
  origem: string;
  data_entrada: string;
  source_url: string;
  user_agent: string;
  event_id?: string;
};

type LeadWebhookResult = {
  success: boolean;
  status?: number;
  data?: unknown;
  error?: string;
};

const FORM_WEBHOOK_PROXY_URL =
  import.meta.env.VITE_FORM_WEBHOOK_PROXY_URL || import.meta.env.VITE_META_CAPI_ENDPOINT;

const readResponseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const buildLeadWebhookPayload = (
  data: LeadWebhookData,
  eventId?: string
): LeadWebhookPayload => ({
  nome: data.fullName.trim(),
  telefone: data.whatsapp.replace(/\D/g, ""),
  whatsapp: data.whatsapp,
  tipo: "IMOVEL",
  tipo_bem: data.propertyType,
  valor_pretendido: data.creditAmount,
  possui_entrada: data.hasDownPayment,
  valor_entrada: data.downPaymentAmount,
  parcela_ideal: data.monthlyPayment,
  cidade: data.city.trim(),
  tempo_aquisicao: data.acquisitionTime,
  origem: "simulador_grupo_mb",
  data_entrada: new Date().toISOString().split("T")[0],
  source_url: window.location.href,
  user_agent: navigator.userAgent,
  event_id: eventId,
});

export const sendLeadWebhook = async (
  data: LeadWebhookData,
  eventId?: string
): Promise<LeadWebhookResult> => {
  if (!FORM_WEBHOOK_PROXY_URL) {
    return {
      success: false,
      error: "Webhook de leads nao configurado.",
    };
  }

  const payload = buildLeadWebhookPayload(data, eventId);

  try {
    const response = await fetch(FORM_WEBHOOK_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    const responseBody = await readResponseBody(response);

    if (!response.ok) {
      const error =
        typeof responseBody === "string"
          ? responseBody
          : responseBody && typeof responseBody === "object" && "message" in responseBody
            ? String(responseBody.message)
            : `Erro HTTP ${response.status}`;

      return {
        success: false,
        status: response.status,
        data: responseBody,
        error,
      };
    }

    return {
      success: true,
      status: response.status,
      data: responseBody,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro desconhecido ao enviar lead.",
    };
  }
};
