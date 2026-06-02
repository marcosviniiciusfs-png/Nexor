import { useState, useEffect } from "react";
import { CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";

interface KommoProof {
  leadId: number;
  traceId: string;
  leadUrl: string;
  verified: boolean;
}

const ThankYou = () => {
  const [proof, setProof] = useState<KommoProof | null>(null);
  const [searchParams] = useSearchParams();
  const isDebug = searchParams.get("debug") === "1";

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("kommo_proof");
      if (stored) {
        setProof(JSON.parse(stored));
      }
    } catch { /* ignore */ }

    // Meta Pixel
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <CheckCircle className="w-16 h-16 text-primary" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Obrigado!
          </h1>
          <p className="text-lg text-muted-foreground">
            Sua solicitação foi enviada com sucesso! Em breve entraremos em contato via WhatsApp.
          </p>
        </div>

        {isDebug && proof && (
          <div className="bg-muted rounded-lg p-4 text-left space-y-2 text-sm">
            <p className="font-semibold text-foreground">Comprovante (debug)</p>
            <p className="text-muted-foreground">Protocolo: <span className="font-mono text-foreground">{proof.traceId}</span></p>
            <p className="text-muted-foreground">Lead ID: <span className="font-mono text-foreground">{proof.leadId}</span></p>
            <p className="text-muted-foreground">Verificado: {proof.verified ? "✅ Sim" : "⚠️ Não confirmado"}</p>
            <a
              href={proof.leadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
            >
              Abrir no CRM <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <div className="pt-4">
          <Link to="/">
            <Button className="bg-primary hover:bg-primary-hover">
              Voltar para o início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
