import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import grupoUniaoLogo from "@/assets/grupo-mb-logo.png";


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--header-footer))] shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-12 w-28 overflow-visible flex items-center">
            <img
              src={grupoUniaoLogo}
              alt="Grupo União"
              className="h-12 w-auto max-w-none origin-left scale-[2.25]"
            />
          </div>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => scrollToSection("simulador")}
            className="text-white hover:text-white/80 transition-colors"
          >
            Simulador
          </button>
          <button
            onClick={() => scrollToSection("beneficios")}
            className="text-white hover:text-white/80 transition-colors"
          >
            Beneficios
          </button>
          <button
            onClick={() => scrollToSection("contato")}
            className="text-white hover:text-white/80 transition-colors"
          >
            Contato
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white hover:bg-white/10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[hsl(var(--header-footer))]">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <button
              onClick={() => scrollToSection("simulador")}
              className="text-white hover:text-white/80 transition-colors text-left py-2"
            >
              Simulador
            </button>
            <button
              onClick={() => scrollToSection("beneficios")}
              className="text-white hover:text-white/80 transition-colors text-left py-2"
            >
              Beneficios
            </button>
            <button
              onClick={() => scrollToSection("contato")}
              className="text-white hover:text-white/80 transition-colors text-left py-2"
            >
              Contato
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
