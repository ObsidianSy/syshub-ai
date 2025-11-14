import { useState } from "react";
import { MessageSquare, Star, ChevronRight, Trash2, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  isFavorite?: boolean;
}

interface ConversationHistoryProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onConversationClick: (conversationId: string) => void;
  onNewConversation: () => void;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ConversationHistory = ({ 
  conversations,
  currentConversationId,
  onConversationClick,
  onNewConversation,
  onToggleFavorite,
  onDelete
}: ConversationHistoryProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div 
      className={cn(
        "fixed left-0 top-20 bottom-0 z-40 backdrop-blur-xl bg-gradient-to-b from-black/50 via-black/40 to-black/50 border-r border-white/10 transition-all duration-300 shadow-2xl",
        collapsed ? "w-16" : "w-96"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-white">Conversas</h2>
              <p className="text-xs text-white/50">Seu histórico de chats</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white hover:bg-white/10 h-10 w-10 rounded-xl border border-white/10 hover:border-primary/30 transition-all duration-300"
          >
            <ChevronRight className={cn("h-5 w-5 transition-transform duration-300", !collapsed && "rotate-180")} />
          </Button>
        </div>

        {!collapsed && (
          <>
            {/* Botão Novo Chat */}
            <div className="p-4 border-b border-white/10">
              <Button
                onClick={onNewConversation}
                className="w-full justify-start bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90 text-white rounded-xl p-4 h-auto shadow-lg shadow-primary/30 transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Novo Chat</div>
                  <div className="text-xs opacity-80">Iniciar conversa</div>
                </div>
              </Button>
            </div>

            {/* Lista de Conversas */}
            <ScrollArea className="flex-1 px-4 py-2">
              {sortedConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-white/30" />
                  <p className="text-white/50 text-sm">Nenhuma conversa ainda</p>
                  <p className="text-white/30 text-xs mt-2">
                    Clique em "Novo Chat" para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => onConversationClick(conv.id)}
                      className={cn(
                        "group relative p-4 rounded-xl border cursor-pointer transition-all duration-300",
                        currentConversationId === conv.id
                          ? "bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40 shadow-lg shadow-primary/20"
                          : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-primary/30"
                      )}
                    >
                      {/* Ícone de Favorito */}
                      {conv.isFavorite && (
                        <Star className="absolute top-2 right-2 h-4 w-4 text-yellow-400 fill-yellow-400" />
                      )}

                      {/* Conteúdo da Conversa */}
                      <div className="flex items-start gap-3">
                        <MessageSquare className={cn(
                          "h-5 w-5 flex-shrink-0 mt-0.5",
                          currentConversationId === conv.id ? "text-primary" : "text-white/50"
                        )} />
                        
                        <div className="flex-1 min-w-0">
                          {/* Título */}
                          <div className="font-semibold text-white text-sm mb-1 truncate pr-6">
                            {conv.title || "Nova Conversa"}
                          </div>
                          
                          {/* Última Mensagem */}
                          <p className="text-xs text-white/50 line-clamp-2 mb-2">
                            {conv.lastMessage || "Sem mensagens"}
                          </p>
                          
                          {/* Footer: Tempo + Contador */}
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(conv.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{conv.messageCount} msgs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ações (hover) */}
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onToggleFavorite && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(conv.id);
                            }}
                            className="h-7 w-7 hover:bg-white/20 rounded-lg"
                          >
                            <Star className={cn(
                              "h-3.5 w-3.5",
                              conv.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-white/50"
                            )} />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(conv.id);
                            }}
                            className="h-7 w-7 hover:bg-red-500/20 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
};
