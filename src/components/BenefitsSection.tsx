import { MessageCircle, DollarSign, FileText } from "lucide-react";
import grupoUniaoLogo from "@/assets/grupo-uniao-logo.png";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: MessageCircle,
      title: "Receba direto no WhatsApp",
      description: "Sua simulação de crédito é enviada rapidamente para o seu WhatsApp com todas as informações necessárias."
    },
    {
      icon: DollarSign,
      title: "Parcelas que cabem no seu bolso",
      description: "Encontramos as melhores condições de financiamento com parcelas que se adequam ao seu orçamento."
    },
    {
      icon: FileText,
      title: "Simulação sem compromisso",
      description: "Faça quantas simulações quiser, totalmente grátis e sem consulta ao SPC ou Serasa."
    }
  ];
  const partnerBanks = ["Itaú", "Bradesco", "Caixa", "Santander"];

  return (
    <section id="beneficios" className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Por que escolher o Grupo União?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Oferecemos as melhores condições do mercado com total transparência e agilidade.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card rounded-xl border border-border p-8 shadow-md hover:border-brand-blue/30 hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center mb-6 mx-auto">
                <benefit.icon className="w-8 h-8 text-orange" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 text-center">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-primary mb-3">
              Bancos parceiros para financiamento
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trabalhamos com instituições reconhecidas para ampliar suas possibilidades de crédito e encontrar condições adequadas ao seu plano.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {partnerBanks.map((bank) => (
              <div
                key={bank}
                className="min-h-[150px] rounded-lg border border-brand-blue/15 bg-background p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-blue/40 hover:shadow-lg"
              >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg border border-orange/20 bg-white p-2">
                  <img
                    src={grupoUniaoLogo}
                    alt={`Logo ${bank}`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="text-center text-lg font-semibold text-foreground">
                  {bank}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
