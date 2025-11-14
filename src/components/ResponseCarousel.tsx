import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { EnhancedResponseCard, AgentResponse } from "./EnhancedResponseCard";

export type { AgentResponse } from "./EnhancedResponseCard";

interface ResponseCarouselProps {
  responses: AgentResponse[];
  onResponseClick: (response: AgentResponse) => void;
}

export const ResponseCarousel = ({ responses, onResponseClick }: ResponseCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justArrived, setJustArrived] = useState(false);

  // Detectar quando um novo card chega
  useEffect(() => {
    if (responses.length > 0) {
      setJustArrived(true);
      setCurrentIndex(responses.length - 1); // Sempre mostrar o mais recente
      
      const timer = setTimeout(() => {
        setJustArrived(false);
      }, 2000); // Aumentado de 1200ms para 2000ms
      
      return () => clearTimeout(timer);
    }
  }, [responses.length]);

  const goToNext = () => {
    if (currentIndex < responses.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  if (responses.length === 0) {
    return null;
  }

  const currentResponse = responses[currentIndex];
  const hasMultiple = responses.length > 1;

  return (
    <div className="relative w-full flex items-center justify-center py-8">
      {/* Botão Anterior */}
      {hasMultiple && currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-8 top-1/2 -translate-y-1/2 z-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl hover:from-white/20 hover:to-white/10 text-white h-14 w-14 border border-white/20 hover:border-primary/50 transition-all duration-300 hover:scale-110 shadow-2xl"
          onClick={goToPrev}
          disabled={isAnimating}
        >
          <ChevronLeft className="h-7 w-7" />
        </Button>
      )}

      {/* Card Central com Efeito 3D */}
      <div 
        className={`
          perspective-2000 transition-all duration-700
          ${justArrived ? 'animate-card-arrive-3d' : isAnimating ? 'animate-card-flip' : ''}
        `}
        style={{
          perspective: '2000px',
          transformStyle: 'preserve-3d',
        }}
      >
        <EnhancedResponseCard
          response={currentResponse}
          onClose={() => onResponseClick(currentResponse)}
          isActive={!isAnimating}
        />
      </div>

      {/* Indicator */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {responses.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (!isAnimating && idx !== currentIndex) {
                  setIsAnimating(true);
                  setCurrentIndex(idx);
                  setTimeout(() => setIsAnimating(false), 600);
                }
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Botão Próximo */}
      {hasMultiple && currentIndex < responses.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-8 top-1/2 -translate-y-1/2 z-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl hover:from-white/20 hover:to-white/10 text-white h-14 w-14 border border-white/20 hover:border-primary/50 transition-all duration-300 hover:scale-110 shadow-2xl"
          onClick={goToNext}
          disabled={isAnimating}
        >
          <ChevronRight className="h-7 w-7" />
        </Button>
      )}
    </div>
  );
};
