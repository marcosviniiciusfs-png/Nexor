import { Phone, MapPin, Clock, Instagram } from "lucide-react";
import grupoUniaoLogo from "@/assets/grupo-uniao-logo.png";
import facebookIcon from "@/assets/facebook.png";

const Footer = () => {
  return (
    <footer id="contato" className="bg-[hsl(var(--header-footer))] border-t-4 border-brand-blue text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex flex-col items-center md:items-start gap-2 mb-4">
              <div className="h-32 w-32 flex items-center justify-center md:justify-start">
                <img
                  src={grupoUniaoLogo}
                  alt="Grupo União"
                  className="h-32 w-32 object-contain"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <a
                href="https://www.facebook.com/profile.php?id=61590892280481#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-brand-blue transition-colors"
                aria-label="Facebook do Grupo União"
              >
                <img src={facebookIcon} alt="Facebook" className="w-8 h-8" />
              </a>
              <a
                href="https://www.instagram.com/grupouniao_sf/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-brand-blue transition-colors"
                aria-label="Instagram do Grupo União"
              >
                <Instagram className="w-8 h-8" />
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
                  <p className="text-white/90">(15) 9 9767-1986</p>
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
                    Rua José Maria Barbosa, n° 31<br />
                    Edifício Torre Sul, Sala 94<br />
                    Jardim Portal da Colina<br />
                    Sorocaba - SP, CEP: 18047-380
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
              © 2026 Grupo União. Todos os direitos reservados.
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
