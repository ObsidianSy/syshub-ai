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

interface ResponseModalProps {
  response: AgentResponse | null;
  onClose: () => void;
}

export const ResponseModal = ({ response, onClose }: ResponseModalProps) => {
  if (!response) return null;

  return (
    <Dialog open={!!response} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">{response.systemName}</Badge>
            <span className="text-xs text-muted-foreground">
              {response.timestamp.toLocaleString('pt-BR')}
            </span>
          </div>
          <DialogTitle className="text-2xl">{response.title}</DialogTitle>
          <DialogDescription>Resposta completa do agente de IA</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {response.content}
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
