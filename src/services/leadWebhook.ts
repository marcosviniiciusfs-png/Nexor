export type LeadWebhookData = {
  fullName: string;
  whatsapp: string;
  creditAmount: string;
  limitedConditionsInterest: string;
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
  interesse_condicoes_limitadas: string;
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

const FORM_WEBHOOK_PROXY_URL = import.meta.env.VITE_FORM_WEBHOOK_PROXY_URL;

export const createLeadEventId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const parseCurrencyNumber = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  return numbers ? Number(numbers) / 100 : null;
};

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return undefined;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : undefined;
};

const validateLeadWebhookData = (data: LeadWebhookData) => {
  if (!data.propertyType) return "Selecione o tipo de bem.";
  if (!data.limitedConditionsInterest) return "Informe se tem interesse nas condições limitadas.";
  if (!data.acquisitionTime) return "Selecione o tempo de aquisicao.";
  if (!data.creditAmount) return "Informe o valor pretendido.";
  if (!data.hasDownPayment) return "Informe se possui valor de entrada.";
  if (data.hasDownPayment === "Sim" && !data.downPaymentAmount) {
    return "Informe o valor de entrada.";
  }
  if (!data.monthlyPayment) return "Informe a parcela ideal.";
  if (!data.city.trim()) return "Informe a cidade.";
  if (!data.fullName.trim()) return "Informe o nome completo.";
  if (data.whatsapp.replace(/\D/g, "").length !== 11) {
    return "Informe um WhatsApp valido.";
  }

  return null;
};

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
): LeadWebhookPayload & Record<string, string | number | null | undefined> => {
  const telefone = data.whatsapp.replace(/\D/g, "");
  const valorEntrada = data.hasDownPayment === "Sim" ? data.downPaymentAmount : "Não tem";

  return {
    nome: data.fullName.trim(),
    telefone,
    whatsapp: data.whatsapp,
    tipo: "IMOVEL",
    tipo_bem: data.propertyType,
    interesse_condicoes_limitadas: data.limitedConditionsInterest,
    valor_pretendido: data.creditAmount,
    valor_pretendido_numero: parseCurrencyNumber(data.creditAmount),
    possui_entrada: data.hasDownPayment,
    valor_entrada: valorEntrada,
    valor_entrada_numero: data.hasDownPayment === "Sim" ? parseCurrencyNumber(data.downPaymentAmount) : null,
    parcela_ideal: data.monthlyPayment,
    parcela_ideal_numero: parseCurrencyNumber(data.monthlyPayment),
    cidade: data.city.trim(),
    tempo_aquisicao: data.acquisitionTime,
    origem: "simulador_grupo_uniao",
    data_entrada: new Date().toISOString().split("T")[0],
    source_url: window.location.href,
    user_agent: navigator.userAgent,
    event_id: eventId,
    fbp: getCookieValue("_fbp"),
    fbc: getCookieValue("_fbc"),
  };
};

export const sendLeadWebhook = async (
  data: LeadWebhookData,
  eventId?: string
): Promise<LeadWebhookResult> => {
  const validationError = validateLeadWebhookData(data);
  if (validationError) {
    return { success: false, error: validationError };
  }

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
          : responseBody && typeof responseBody === "object" && "error" in responseBody
            ? String(responseBody.error)
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
