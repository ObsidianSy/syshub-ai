import { useState } from "react";
import { Star, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface HistoryItem {
  id: string;
  systemName: string;
  question: string;
  summary: string;
  timestamp: Date;
  isFavorite: boolean;
}

interface QueryHistoryProps {
  items: HistoryItem[];
  onItemClick: (item: HistoryItem) => void;
  onToggleFavorite: (id: string) => void;
}

export const QueryHistory = ({ items, onItemClick, onToggleFavorite }: QueryHistoryProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const sortedItems = [...items].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return (
    <div 
      className={cn(
        "fixed left-0 top-16 bottom-0 z-40 backdrop-blur-md bg-black/30 border-r border-white/10 transition-all duration-300",
        collapsed ? "w-16" : "w-80"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <h2 className="text-sm font-semibold text-white">Histórico</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-white hover:bg-white/10"
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform", !collapsed && "rotate-180")} />
        </Button>
      </div>

      {!collapsed && (
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-3 space-y-2">
            {sortedItems.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-sm">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Nenhuma consulta ainda
              </div>
            ) : (
              sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                  onClick={() => onItemClick(item)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-primary/20 border-primary/30 text-primary-foreground"
                    >
                      {item.systemName}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star 
                        className={cn(
                          "h-3 w-3",
                          item.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white/60"
                        )} 
                      />
                    </Button>
                  </div>
                  
                  <p className="text-sm font-medium text-white line-clamp-2 mb-1">
                    {item.question}
                  </p>
                  
                  <p className="text-xs text-white/50 line-clamp-1 mb-2">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Clock className="h-3 w-3" />
                    {item.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
