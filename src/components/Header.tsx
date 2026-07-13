import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import nexorLogo from "@/assets/nexor-logo.png";
import { company } from "@/config/company";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--header-footer))] border-b border-brand-blue/40 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-14 w-36 items-center">
            <img
              src={nexorLogo}
              alt={company.name}
              className="h-14 w-auto max-w-full object-contain"
            />
          </div>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => scrollToSection("simulador")}
            className="text-white hover:text-brand-blue transition-colors"
          >
            Simulador
          </button>
          <button
            onClick={() => scrollToSection("beneficios")}
            className="text-white hover:text-brand-blue transition-colors"
          >
            Benefícios
          </button>
          <button
            onClick={() => scrollToSection("contato")}
            className="text-white hover:text-brand-blue transition-colors"
          >
            Contato
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white hover:bg-brand-blue/20"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[hsl(var(--header-footer))] border-t border-brand-blue/30">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <button
              onClick={() => scrollToSection("simulador")}
              className="text-white hover:text-brand-blue transition-colors text-left py-2"
            >
              Simulador
            </button>
            <button
              onClick={() => scrollToSection("beneficios")}
              className="text-white hover:text-brand-blue transition-colors text-left py-2"
            >
              Benefícios
            </button>
            <button
              onClick={() => scrollToSection("contato")}
              className="text-white hover:text-brand-blue transition-colors text-left py-2"
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
