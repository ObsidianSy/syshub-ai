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
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-card to-card/50 rounded-lg border">
        <div className="text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-glow-pulse" />
          <p className="text-muted-foreground">
            As respostas do agente aparecerão aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gradient-to-br from-card to-card/50 rounded-lg border overflow-hidden">
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-primary/20 text-primary border-primary/30">
          <Sparkles className="h-3 w-3 mr-1" />
          Respostas do Agente
        </Badge>
      </div>

      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-card/80 backdrop-blur"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-card/80 backdrop-blur"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      <ScrollArea className="h-full pt-16">
        <div
          ref={scrollRef}
          className="flex gap-4 px-6 pb-6 overflow-x-auto scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {responses.map((response, idx) => (
            <Card
              key={response.id}
              className="min-w-[350px] max-w-[350px] cursor-pointer transition-all hover:shadow-xl hover:scale-105 hover:-translate-y-1 animate-card-3d border-primary/20 bg-gradient-to-br from-card to-card/80"
              style={{
                animationDelay: `${idx * 0.1}s`,
                transform: "perspective(1000px)",
              }}
              onClick={() => onResponseClick(response)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="text-xs">
                    {response.systemName}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {response.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                <h3 className="font-semibold mb-2 text-lg line-clamp-2">
                  {response.title}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {response.content}
                </p>
                
                <div className="mt-4 text-xs text-primary font-medium">
                  Clique para ver mais →
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
