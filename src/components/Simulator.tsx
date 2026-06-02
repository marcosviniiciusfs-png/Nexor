import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import InputMask from "react-input-mask";
import { sendToWebhook } from "@/services/webhook";
import {
  createLeadEventId,
  sendConfiguredLeadWebhook,
  trackLeadConversion,
} from "@/services/tracking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SimulatorData {
  propertyType: string;
  acquisitionTime: string;
  creditAmount: string;
  hasDownPayment: string;
  downPaymentAmount: string;
  monthlyPayment: string;
  city: string;
  fullName: string;
  whatsapp: string;
}

const Simulator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<SimulatorData>({
    propertyType: "",
    acquisitionTime: "",
    creditAmount: "",
    hasDownPayment: "",
    downPaymentAmount: "",
    monthlyPayment: "",
    city: "",
    fullName: "",
    whatsapp: ""
  });

  const totalSteps = 8;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = Number(numbers) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(amount);
  };

  const handleCurrencyChange = (field: keyof SimulatorData, value: string) => {
    const formatted = formatCurrency(value);
    setFormData({ ...formData, [field]: formatted });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.propertyType !== "";
      case 1: return formData.acquisitionTime !== "";
      case 2: return formData.creditAmount !== "";
      case 3: 
        if (formData.hasDownPayment === "Sim") {
          return formData.downPaymentAmount !== "";
        }
        return formData.hasDownPayment !== "";
      case 4: return formData.monthlyPayment !== "";
      case 5: return formData.city.trim() !== "";
      case 6: return formData.fullName.trim() !== "";
      case 7: return formData.whatsapp.replace(/\D/g, "").length === 11;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 3 && formData.hasDownPayment === "Não") {
      setFormData({ ...formData, downPaymentAmount: "" });
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const webhookUrl = "https://hook.us1.make.com/m60b3l3wcknirc4fc7ezy3553yso5jih";

    const today = new Date().toISOString().split('T')[0];
    const downPaymentValue = formData.hasDownPayment === "Sim" ? formData.downPaymentAmount : "Não tem";
    const leadEventId = createLeadEventId();

    const webhookData = {
      "Data de Entrada": today,
      "Nome Completo": formData.fullName.trim(),
      "WhatsApp": formData.whatsapp,
      "Tipo de Bem": formData.propertyType,
      "Valor Pretendido (R$)": formData.creditAmount,
      "Valor de Entrada (R$)": downPaymentValue,
      "Parcela Ideal (R$)": formData.monthlyPayment,
      "Cidade": formData.city.trim()
    };

    const kommoData = {
      fullName: formData.fullName.trim(),
      whatsapp: formData.whatsapp,
      propertyType: formData.propertyType,
      creditAmount: formData.creditAmount,
      downPaymentAmount: downPaymentValue,
      monthlyPayment: formData.monthlyPayment,
      city: formData.city.trim(),
    };

    const externalWebhookData = {
      fullName: formData.fullName.trim(),
      whatsapp: formData.whatsapp,
      creditAmount: formData.creditAmount,
      downPaymentAmount: downPaymentValue,
      monthlyPayment: formData.monthlyPayment,
      city: formData.city.trim(),
      acquisitionTime: formData.acquisitionTime,
      propertyType: formData.propertyType,
    };

    try {
      console.log("Enviando dados para webhooks e Kommo:", webhookData);

      const [
        makeResult,
        kommoResult,
        webhookResult,
        configuredWebhookResult,
        metaConversionResult,
      ] = await Promise.allSettled([
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookData),
        }),
        supabase.functions.invoke('send-to-kommo', {
          body: kommoData,
        }),
        sendToWebhook(externalWebhookData),
        sendConfiguredLeadWebhook(externalWebhookData, leadEventId),
        trackLeadConversion(externalWebhookData, leadEventId),
      ]);

      // Process Kommo result
      let kommoSuccess = false;
      if (kommoResult.status === 'fulfilled') {
        const { data: kommoResponse, error: kommoError } = kommoResult.value;
        if (kommoError) {
          console.error("Erro ao enviar para Kommo:", kommoError);
        } else if (kommoResponse?.success) {
          kommoSuccess = true;
          console.log("Kommo OK:", kommoResponse);
          try {
            sessionStorage.setItem('kommo_proof', JSON.stringify({
              leadId: kommoResponse.leadId,
              traceId: kommoResponse.traceId,
              leadUrl: kommoResponse.leadUrl,
              verified: kommoResponse.verified,
            }));
          } catch (e) { /* ignore */ }
        }
      } else {
        console.error("Erro ao enviar para Kommo:", kommoResult.reason);
      }

      // Process external webhook result
      if (webhookResult.status === 'fulfilled') {
        if (!webhookResult.value.success) {
          console.error("Erro no webhook externo:", webhookResult.value.error);
        } else {
          console.log("Webhook externo OK");
        }
      } else {
        console.error("Erro no webhook externo:", webhookResult.reason);
      }

      if (
        configuredWebhookResult.status === "fulfilled" &&
        !configuredWebhookResult.value.skipped &&
        !configuredWebhookResult.value.success
      ) {
        console.error("Erro no webhook configurado:", configuredWebhookResult.value.error);
      } else if (configuredWebhookResult.status === "rejected") {
        console.error("Erro no webhook configurado:", configuredWebhookResult.reason);
      }

      if (
        metaConversionResult.status === "fulfilled" &&
        !metaConversionResult.value.skipped &&
        !metaConversionResult.value.success
      ) {
        console.error("Erro na Conversion API:", metaConversionResult.value.error);
      } else if (metaConversionResult.status === "rejected") {
        console.error("Erro na Conversion API:", metaConversionResult.reason);
      }

      // Check if Make was successful
      if (makeResult.status === 'fulfilled' && makeResult.value.ok) {
        if (!kommoSuccess) {
          toast({
            title: "Atenção",
            description: "Enviado para planilha, mas houve falha ao registrar no CRM. Será reprocessado.",
            variant: "destructive",
          });
        }
        setFormData({
          propertyType: "",
          acquisitionTime: "",
          creditAmount: "",
          hasDownPayment: "",
          downPaymentAmount: "",
          monthlyPayment: "",
          city: "",
          fullName: "",
          whatsapp: ""
        });
        setCurrentStep(0);
        navigate("/obrigado");
      } else {
        throw new Error("Erro ao enviar dados para Make");
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
      setIsSubmitting(false);
      toast({
        title: "Erro ao enviar simulação",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
      return;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Label htmlFor="propertyType" className="text-lg font-semibold text-primary text-center block mb-6">
              Qual tipo de bem você deseja adquirir?
            </Label>
            <Select
              value={formData.propertyType}
              onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
            >
              <SelectTrigger id="propertyType" className="text-lg p-6 max-w-md mx-auto">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="Imóvel">Imóvel</SelectItem>
                <SelectItem value="Veículo">Veículo</SelectItem>
                <SelectItem value="Moto">Moto</SelectItem>
                <SelectItem value="Caminhão">Caminhão</SelectItem>
                <SelectItem value="Maquinário">Maquinário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary text-center block mb-6">
              Em até quanto tempo você deseja adquirir o seu bem?
            </Label>
            <Select
              value={formData.acquisitionTime}
              onValueChange={(value) => setFormData({ ...formData, acquisitionTime: value })}
            >
              <SelectTrigger className="text-lg p-6 max-w-md mx-auto">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="1 a 2 meses">1 a 2 meses</SelectItem>
                <SelectItem value="3 a 4 meses">3 a 4 meses</SelectItem>
                <SelectItem value="5 a 6 meses">5 a 6 meses</SelectItem>
                <SelectItem value="Acima de 6 meses">Acima de 6 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label htmlFor="creditAmount" className="text-lg font-semibold text-primary text-center block mb-6">
              Qual o valor do crédito que deseja simular?
            </Label>
            <Input
              id="creditAmount"
              value={formData.creditAmount}
              onChange={(e) => handleCurrencyChange("creditAmount", e.target.value)}
              placeholder="R$ 0,00"
              className="text-lg p-6 text-center max-w-md mx-auto"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary text-center block mb-6">
              Tem valor de entrada?
            </Label>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <button
                onClick={() => setFormData({ ...formData, hasDownPayment: "Sim" })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.hasDownPayment === "Sim"
                    ? "border-orange bg-orange/5 text-orange"
                    : "border-border hover:border-orange/50 text-muted-foreground"
                }`}
              >
                <span className="text-base font-normal">Sim</span>
              </button>
              <button
                onClick={() => setFormData({ ...formData, hasDownPayment: "Não" })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.hasDownPayment === "Não"
                    ? "border-foreground bg-foreground/5 text-foreground"
                    : "border-border hover:border-orange/50 text-muted-foreground"
                }`}
              >
                <span className="text-base font-normal">Não</span>
              </button>
            </div>
            
            {formData.hasDownPayment === "Sim" && (
              <div className="space-y-3 mt-6">
                <Label htmlFor="downPayment" className="text-sm text-muted-foreground">
                  Qual valor de entrada disponível?
                </Label>
                <Input
                  id="downPayment"
                  value={formData.downPaymentAmount}
                  onChange={(e) => handleCurrencyChange("downPaymentAmount", e.target.value)}
                  placeholder="R$ 0,00"
                  className="text-lg p-6 text-center max-w-md mx-auto"
                />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label htmlFor="monthlyPayment" className="text-lg font-semibold text-primary text-center block mb-6">
              Qual a parcela mensal ideal pra você?
            </Label>
            <Input
              id="monthlyPayment"
              value={formData.monthlyPayment}
              onChange={(e) => handleCurrencyChange("monthlyPayment", e.target.value)}
              placeholder="R$ 0,00"
              className="text-lg p-6 text-center max-w-md mx-auto"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Label htmlFor="city" className="text-lg font-semibold text-primary text-center block mb-6">
              Qual cidade você reside?
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Digite sua cidade"
              className="text-lg p-6 text-center max-w-md mx-auto"
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Label htmlFor="fullName" className="text-lg font-semibold text-primary text-center block mb-6">
              Nome completo
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Digite seu nome completo"
              className="text-lg p-6 text-center max-w-md mx-auto"
            />
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <Label htmlFor="whatsapp" className="text-lg font-semibold text-primary text-center block mb-6">
              WhatsApp para contato
            </Label>
            <InputMask
              mask="(99) 99999-9999"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            >
              {/* @ts-ignore */}
              {(inputProps: any) => (
                <Input
                  {...inputProps}
                  id="whatsapp"
                  placeholder="(00) 00000-0000"
                  className="text-lg p-6 text-center max-w-md mx-auto"
                />
              )}
            </InputMask>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="simulador" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Simulador de Crédito
            </h2>
            <p className="text-muted-foreground">
              Preencha os dados abaixo para receber sua simulação
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progresso</span>
                <span>{currentStep + 1} de {totalSteps}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="min-h-[220px]">
              {renderStep()}
            </div>

            <div className="flex justify-between gap-4 pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>

              {currentStep < totalSteps - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 bg-orange hover:bg-orange/90"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-orange hover:bg-orange/90"
                >
                  {isSubmitting ? "Enviando..." : "Finalizar Simulação"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Simulator;
