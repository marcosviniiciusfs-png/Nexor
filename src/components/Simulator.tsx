import { type InputHTMLAttributes, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import InputMask from "react-input-mask";
import { sendLeadWebhook } from "@/services/leadWebhook";
import { createLeadEventId } from "@/services/tracking";
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

  const validateFormData = () => {
    if (!formData.propertyType) return "Selecione o tipo de bem.";
    if (!formData.acquisitionTime) return "Selecione o tempo de aquisicao.";
    if (!formData.creditAmount) return "Informe o valor pretendido.";
    if (!formData.hasDownPayment) return "Informe se possui valor de entrada.";
    if (formData.hasDownPayment === "Sim" && !formData.downPaymentAmount) {
      return "Informe o valor de entrada.";
    }
    if (!formData.monthlyPayment) return "Informe a parcela ideal.";
    if (!formData.city.trim()) return "Informe a cidade.";
    if (!formData.fullName.trim()) return "Informe o nome completo.";
    if (formData.whatsapp.replace(/\D/g, "").length !== 11) {
      return "Informe um WhatsApp valido.";
    }

    return null;
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

    const validationError = validateFormData();
    if (validationError) {
      setIsSubmitting(false);
      toast({
        title: "Dados incompletos",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const downPaymentValue = formData.hasDownPayment === "Sim" ? formData.downPaymentAmount : "Não tem";
    const leadEventId = createLeadEventId();

    const leadData = {
      fullName: formData.fullName.trim(),
      whatsapp: formData.whatsapp,
      creditAmount: formData.creditAmount,
      hasDownPayment: formData.hasDownPayment,
      downPaymentAmount: downPaymentValue,
      monthlyPayment: formData.monthlyPayment,
      city: formData.city.trim(),
      acquisitionTime: formData.acquisitionTime,
      propertyType: formData.propertyType,
    };

    try {
      console.log("Enviando lead para webhook:", leadData);

      const leadWebhookResult = await sendLeadWebhook(leadData, leadEventId);

      if (!leadWebhookResult.success) {
        throw new Error(leadWebhookResult.error || "Erro ao enviar lead.");
      }

      toast({
        title: "Simulação enviada",
        description: "Recebemos seus dados e entraremos em contato em breve.",
      });

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
    } catch (error) {
      console.error("Erro ao enviar:", error);
      setIsSubmitting(false);
      toast({
        title: "Erro ao enviar simulação",
        description: error instanceof Error ? error.message : "Por favor, tente novamente.",
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
              {(inputProps: InputHTMLAttributes<HTMLInputElement>) => (
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
