const WEBHOOK_URL =
  "https://uxttihjsxfowursjyult.supabase.co/functions/v1/form-webhook/2a35e3698bb0d3bd8965375ba596564b3ebd6dc55cc3b9a0fef7fb1724d53d8e";

const WEBHOOK_TOKEN = "whi_odJaxq5NdTefWkl2LxEILlItDIwbwquv";

interface WebhookPayload {
  nome: string;
  telefone: string;
  tipo: string;
  valor_pretendido: string;
  valor_entrada: string;
  parcela_ideal: string;
  cidade: string;
  tempo_aquisicao: string;
  tipo_bem: string;
}

export async function sendToWebhook(data: {
  fullName: string;
  whatsapp: string;
  creditAmount: string;
  downPaymentAmount: string;
  monthlyPayment: string;
  city: string;
  acquisitionTime: string;
  propertyType: string;
}): Promise<{ success: boolean; error?: string }> {
  const payload: WebhookPayload = {
    nome: data.fullName.trim(),
    telefone: data.whatsapp,
    tipo: "IMOVEL",
    valor_pretendido: data.creditAmount,
    valor_entrada: data.downPaymentAmount,
    parcela_ideal: data.monthlyPayment,
    cidade: data.city.trim(),
    tempo_aquisicao: data.acquisitionTime,
    tipo_bem: data.propertyType,
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WEBHOOK_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
}
