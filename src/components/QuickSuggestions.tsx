import { Sparkles, TrendingUp, Clock, Zap, MessageSquare, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QuickSuggestion {
  id: string;
  text: string;
  category: string;
  icon: LucideIcon;
}

interface QuickSuggestionsProps {
  onSuggestionClick: (text: string) => void;
}

export const QuickSuggestions = ({ onSuggestionClick }: QuickSuggestionsProps) => {
  const suggestions: QuickSuggestion[] = [
    {
      id: '1',
      text: 'Mostre o estoque de produtos no Opus One',
      category: 'Inventário',
      icon: TrendingUp,
    },
    {
      id: '2',
      text: 'Qual o status dos sistemas agora?',
      category: 'Status',
      icon: Zap,
    },
    {
      id: '3',
      text: 'Liste as últimas 10 vendas',
      category: 'Vendas',
      icon: Clock,
    },
    {
      id: '4',
      text: 'Verifique pedidos pendentes',
      category: 'Pedidos',
      icon: MessageSquare,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-white">Sugestões Rápidas</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <Card
              key={suggestion.id}
              className="group cursor-pointer bg-white/5 hover:bg-white/10 border-white/10 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
              onClick={() => onSuggestionClick(suggestion.text)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 border border-primary/30 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/50 mb-1">{suggestion.category}</div>
                    <p className="text-sm text-white/90 font-medium line-clamp-2">{suggestion.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
