import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useRef } from "react";

export interface AgentResponse {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  systemName: string;
}

interface ResponseCarouselProps {
  responses: AgentResponse[];
  onResponseClick: (response: AgentResponse) => void;
}

export const ResponseCarousel = ({ responses, onResponseClick }: ResponseCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = scrollRef.current.scrollLeft + 
        (direction === "right" ? scrollAmount : -scrollAmount);
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
      
      setTimeout(() => {
        if (scrollRef.current) {
          setCanScrollLeft(scrollRef.current.scrollLeft > 0);
          setCanScrollRight(
            scrollRef.current.scrollLeft < 
            scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
          );
        }
      }, 300);
    }
  };

  if (responses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 text-white/60 animate-glow-pulse" />
          <h2 className="text-3xl font-bold text-white mb-2">
            Central de Sistemas
          </h2>
          <p className="text-white/70 text-lg">
            Faça uma pergunta sobre qualquer sistema e o agente vai buscar as informações para você
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full glass-effect hover:bg-white/20 text-white h-12 w-12"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}

      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full glass-effect hover:bg-white/20 text-white h-12 w-12"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      <ScrollArea className="h-full">
        <div
          ref={scrollRef}
          className="flex gap-6 px-12 py-12 overflow-x-auto scrollbar-hide items-center"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {responses.map((response, idx) => (
            <Card
              key={response.id}
              className="min-w-[400px] max-w-[400px] cursor-pointer transition-all hover:scale-105 hover:-translate-y-2 animate-card-3d glass-effect border-white/20 shadow-2xl"
              style={{
                animationDelay: `${idx * 0.1}s`,
                transform: "perspective(1000px)",
              }}
              onClick={() => onResponseClick(response)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    {response.systemName}
                  </Badge>
                  <span className="text-xs text-white/60">
                    {response.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                <h3 className="font-semibold mb-3 text-xl line-clamp-2 text-white">
                  {response.title}
                </h3>
                
                <p className="text-sm text-white/80 line-clamp-4 leading-relaxed">
                  {response.content}
                </p>
                
                <div className="mt-4 text-xs text-primary font-medium flex items-center gap-2">
                  Clique para ver mais
                  <Sparkles className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
