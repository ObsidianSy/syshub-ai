import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentResponse } from "./ResponseCarousel";
import { Sparkles, Clock, Zap, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ResponseModalProps {
  response: AgentResponse | null;
  onClose: () => void;
}

export const ResponseModal = ({ response, onClose }: ResponseModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!response) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(response.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={!!response} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-gradient-to-br from-gray-950 via-gray-900 to-black border-2 border-white/20 shadow-2xl backdrop-blur-2xl">
        {/* Efeito de brilho de fundo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer pointer-events-none rounded-lg" />
        
        <DialogHeader className="relative space-y-4 pb-4 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-primary/30 to-blue-600/30 text-primary border-primary/40 px-4 py-1.5 text-sm font-semibold shadow-lg">
                  <Zap className="h-3.5 w-3.5 mr-1.5 inline" />
                  {response.systemName}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <Clock className="h-3.5 w-3.5" />
                  {response.timestamp.toLocaleString('pt-BR')}
                </div>
              </div>
              
              <DialogTitle className="text-3xl font-bold text-white leading-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text">
                {response.title}
              </DialogTitle>
              
              <DialogDescription className="text-white/60 flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Resposta completa do agente inteligente
              </DialogDescription>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-white transition-all duration-300"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-400" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[55vh] pr-4 relative">
          <div className="space-y-6 py-6">
            <div className="prose prose-invert max-w-none">
              <p className="text-base text-white/90 leading-relaxed whitespace-pre-wrap">
                {response.content}
              </p>
            </div>
          </div>
        </ScrollArea>
        
        {/* Footer decorativo */}
        <div className="relative pt-4 border-t border-white/10">
          <div className="flex items-center justify-center">
            <div className="text-xs text-white/40 flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary/50 animate-pulse" />
              Powered by NexusHub AI
              <div className="h-1 w-1 rounded-full bg-primary/50 animate-pulse" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
