type LeadTrackingData = {
  fullName: string;
  whatsapp: string;
  creditAmount: string;
  downPaymentAmount: string;
  monthlyPayment: string;
  city: string;
  acquisitionTime: string;
  propertyType: string;
};

type TrackingResult = {
  success: boolean;
  skipped?: boolean;
  error?: string;
};

type FbqFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: FbqFunction;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

const LEAD_WEBHOOK_URL = import.meta.env.VITE_LEAD_WEBHOOK_URL;
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
const META_CAPI_ENDPOINT = import.meta.env.VITE_META_CAPI_ENDPOINT;

export const createLeadEventId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const buildLeadPayload = (data: LeadTrackingData, eventId: string) => ({
  event_id: eventId,
  event_name: "Lead",
  event_time: Math.floor(Date.now() / 1000),
  action_source: "website",
  source_url: window.location.href,
  user_agent: navigator.userAgent,
  nome: data.fullName.trim(),
  telefone: data.whatsapp,
  tipo_bem: data.propertyType,
  valor_pretendido: data.creditAmount,
  valor_entrada: data.downPaymentAmount,
  parcela_ideal: data.monthlyPayment,
  cidade: data.city.trim(),
  tempo_aquisicao: data.acquisitionTime,
});

const postJson = async (
  url: string | undefined,
  payload: Record<string, unknown>
): Promise<TrackingResult> => {
  if (!url) return { success: true, skipped: true };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: text || `Erro HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
};

export const initializeMetaPixel = () => {
  if (!META_PIXEL_ID || window.fbq) return;

  window.fbq = function (...args: unknown[]) {
    window.fbq?.callMethod
      ? window.fbq.callMethod(...args)
      : window.fbq?.queue?.push(args);
  } as FbqFunction;

  if (!window._fbq) window._fbq = window.fbq;
  window.fbq.push = window.fbq.push ?? window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = "2.0";
  window.fbq.queue = [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
};

export const sendConfiguredLeadWebhook = (data: LeadTrackingData, eventId: string) =>
  postJson(LEAD_WEBHOOK_URL, buildLeadPayload(data, eventId));

export const trackLeadConversion = async (
  data: LeadTrackingData,
  eventId: string
): Promise<TrackingResult> => {
  const payload = buildLeadPayload(data, eventId);

  if (META_PIXEL_ID && window.fbq) {
    window.fbq(
      "track",
      "Lead",
      {
        content_name: "Simulador Grupo MB Empreendimentos",
        currency: "BRL",
        value: data.creditAmount,
      },
      { eventID: eventId }
    );
  }

  return postJson(META_CAPI_ENDPOINT, payload);
};
