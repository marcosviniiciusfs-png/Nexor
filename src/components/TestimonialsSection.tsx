import { type CSSProperties, useRef, useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

type ClientMedia = {
  src: string;
  type: "image" | "video";
  label: string;
};

const clientMedia: ClientMedia[] = [
  {
    src: "/clientes-contemplados/cliente-nexor-01.jpeg",
    type: "image",
    label: "Cliente contemplado Nexor 1",
  },
  {
    src: "/clientes-contemplados/cliente-nexor-02.jpeg",
    type: "image",
    label: "Cliente contemplado Nexor 2",
  },
  {
    src: "/clientes-contemplados/cliente-nexor-03.jpeg",
    type: "image",
    label: "Cliente contemplado Nexor 3",
  },
  {
    src: "/clientes-contemplados/cliente-nexor-04.jpeg",
    type: "image",
    label: "Cliente contemplado Nexor 4",
  },
  {
    src: "/clientes-contemplados/cliente-nexor-05.mp4",
    type: "video",
    label: "Vídeo de cliente contemplado Nexor",
  },
];

const mediaFrameStyle = {
  aspectRatio: "4 / 5",
} satisfies CSSProperties;

const TestimonialsSection = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const autoplayPlugin = useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    })
  );

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Clientes Contemplados
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pessoas que já deram o próximo passo com planejamento e crédito sob medida.
          </p>
        </div>

        <div className="max-w-6xl mx-auto relative">
          {/* Navigation Buttons - Desktop */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-10 rounded-full border-brand-blue/30 bg-background/80 backdrop-blur-sm hover:bg-brand-blue hover:text-white hidden md:flex"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-10 rounded-full border-brand-blue/30 bg-background/80 backdrop-blur-sm hover:bg-brand-blue hover:text-white hidden md:flex"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[autoplayPlugin.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {clientMedia.map((media, index) => (
                <CarouselItem
                  key={index}
                  className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <div className="overflow-hidden rounded-xl shadow-lg bg-black" style={mediaFrameStyle}>
                    {media.type === "image" ? (
                      <img
                        src={media.src}
                        alt={media.label}
                        loading="lazy"
                        className="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <video
                        src={media.src}
                        aria-label={media.label}
                        className="h-full w-full object-contain bg-black"
                        controls
                        playsInline
                        preload="metadata"
                        onPlay={() => autoplayPlugin.current.stop()}
                        onPause={() => autoplayPlugin.current.reset()}
                      />
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 mt-6">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? "w-8 bg-brand-blue"
                    : "w-2 bg-border hover:bg-muted-foreground"
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="flex justify-center items-center gap-4 mt-4 md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              className="rounded-full border-brand-blue/30 hover:bg-brand-blue hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              className="rounded-full border-brand-blue/30 hover:bg-brand-blue hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
