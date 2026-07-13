import { Phone, MapPin, Clock, Instagram } from "lucide-react";
import nexorLogo from "@/assets/nexor-logo.png";
import { company } from "@/config/company";

const Footer = () => {
  return (
    <footer id="contato" className="bg-[hsl(var(--header-footer))] border-t-4 border-brand-blue text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex flex-col items-center md:items-start gap-2 mb-4">
              <div className="flex h-28 w-44 items-center justify-center md:justify-start">
                <img
                  src={nexorLogo}
                  alt={company.name}
                  className="h-28 w-auto max-w-full object-contain"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <a
                href={company.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white hover:text-brand-blue transition-colors"
                aria-label={`Instagram da ${company.name}`}
              >
                <Instagram className="w-8 h-8" />
                <span className="font-medium">{company.instagramLabel}</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Fale Conosco</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">WhatsApp</p>
                  <a
                    href={`https://wa.me/${company.phoneDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/90 hover:text-brand-blue transition-colors"
                  >
                    {company.phoneDisplay}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Localização</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white/90">
                    {company.location}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Horário de Atendimento</p>
                  <p className="text-white/90">
                    Segunda à Sexta: 8h às 18h<br />
                    Sábado: 8h às 12h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-blue/30 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/90 text-sm">
              © 2026 {company.name}. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 text-sm">
              <button className="text-white/90 hover:text-white transition-colors">
                Política de Privacidade
              </button>
              <button className="text-white/90 hover:text-white transition-colors">
                Termos de Uso
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
