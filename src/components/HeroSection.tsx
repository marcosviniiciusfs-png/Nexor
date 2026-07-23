import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.png";
import nexorLogo from "@/assets/nexor-logo.png";

interface HeroSectionProps {
  onSimulateClick: () => void;
}

const HeroSection = ({ onSimulateClick }: HeroSectionProps) => {
  const benefits = [
    "Consórcio | Carta de Crédito",
    "Projeção de Financiamento",
    "Empréstimo CLT",
    "Antecipação de FGTS",
    "Planos para imóveis e veículos"
  ];

  return (
    <section id="inicio" className="pt-24 pb-16 bg-background border-b border-brand-blue/10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <img
              src={nexorLogo}
              alt="Nexor Financeira"
              className="h-20 w-auto object-contain"
            />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight">
              Simule seu crédito com a Nexor Financeira
            </h1>
            
            <p className="text-lg text-muted-foreground font-medium">
              Planeje a conquista do seu imóvel, veículo ou bem com atendimento próximo e condições personalizadas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <Button 
              onClick={onSimulateClick}
              size="lg"
              className="bg-brand-blue hover:bg-brand-blue-hover text-primary-foreground font-semibold text-lg px-8 py-6 rounded-lg shadow-lg shadow-brand-blue/20 hover:shadow-xl transition-all"
            >
              Simular crédito agora
            </Button>
          </div>

          <div className="relative animate-scale-in">
            <img 
              src={heroBanner} 
              alt="Imóveis e Veículos" 
              className="w-full h-auto rounded-2xl border border-brand-blue/20 shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
