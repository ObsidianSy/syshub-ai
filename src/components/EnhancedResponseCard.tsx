import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Zap, 
  FileJson, 
  History, 
  Copy, 
  Check, 
  Download,
  Share2,
  Star,
  Code2,
  Info
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface ResponseMetadata {
  [key: string]: string | number | boolean | null;
}

export interface ResponseRawData {
  query?: string;
  system?: string;
  executionTime?: number;
  [key: string]: unknown;
}

export interface AgentResponse {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  systemName: string;
  responseTime?: number;
  confidence?: number;
  metadata?: ResponseMetadata;
  rawData?: ResponseRawData;
  previousVersions?: Array<{
    timestamp: Date;
    content: string;
  }>;
}

interface EnhancedResponseCardProps {
  response: AgentResponse;
  onClose: () => void;
  isActive: boolean;
}

export const EnhancedResponseCard = ({ response, onClose, isActive }: EnhancedResponseCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiado!", description: "Conteúdo copiado para área de transferência" });
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resposta-${response.id}.json`;
    a.click();
    toast({ title: "Download iniciado", description: "Arquivo JSON baixado com sucesso" });
  };

  const handleShare = () => {
    const shareData = {
      title: response.title,
      text: response.content,
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      handleCopy(`${response.title}\n\n${response.content}`);
      toast({ title: "Preparado para compartilhar", description: "Conteúdo copiado. Cole onde desejar!" });
    }
  };

  return (
    <Card className={`
      relative w-[850px] overflow-hidden
      bg-gradient-to-br from-black/70 via-black/50 to-black/70
      backdrop-blur-2xl border-2 border-white/20
      shadow-[0_0_100px_rgba(59,130,246,0.4)]
      transition-all duration-500
      ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
    `}>
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
      <div className="absolute inset-0 rounded-lg opacity-50">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 animate-border-flow" />
      </div>

      <CardContent className="relative p-6">
        {/* Header with Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <Badge className="bg-gradient-to-r from-primary/30 to-blue-600/30 text-primary border-primary/40 px-3 py-1 text-sm font-semibold">
              <Zap className="h-3.5 w-3.5 mr-1.5 inline" />
              {response.systemName}
            </Badge>
            {response.confidence && (
              <Badge variant="outline" className="bg-white/5 border-white/20 text-white/80">
                {Math.round(response.confidence * 100)}% confiança
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFavorite(!isFavorite)}
              className="h-9 w-9 hover:bg-white/10 rounded-lg"
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-white/60'}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(response.content)}
              className="h-9 w-9 hover:bg-white/10 rounded-lg"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-white/60" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-9 w-9 hover:bg-white/10 rounded-lg"
            >
              <Download className="h-4 w-4 text-white/60" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-9 w-9 hover:bg-white/10 rounded-lg"
            >
              <Share2 className="h-4 w-4 text-white/60" />
            </Button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-2xl text-white leading-tight mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text">
          {response.title}
        </h3>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10 mb-4">
            <TabsTrigger value="summary" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Info className="h-4 w-4 mr-2" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Code2 className="h-4 w-4 mr-2" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="json" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <FileJson className="h-4 w-4 mr-2" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <History className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-0">
            <div className="max-h-[340px] overflow-y-auto pr-2 scrollbar-thin">
              <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
                {response.content}
              </p>
            </div>

            {/* Metadata */}
            {response.metadata && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {response.responseTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-white/50">Tempo:</span>
                      <span className="text-white font-medium">{response.responseTime}ms</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-white/50">Gerado em:</span>
                    <span className="text-white font-medium">{response.timestamp.toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-0">
            <div className="max-h-[340px] overflow-y-auto pr-2 scrollbar-thin space-y-3">
              {response.metadata && Object.entries(response.metadata).map(([key, value]) => (
                <div key={key} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="text-xs text-white/50 mb-1 font-medium uppercase tracking-wide">{key}</div>
                  <div className="text-sm text-white/90">{String(value)}</div>
                </div>
              ))}
              {(!response.metadata || Object.keys(response.metadata).length === 0) && (
                <div className="text-center py-12 text-white/40">
                  <Code2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum detalhe técnico disponível</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* JSON Tab */}
          <TabsContent value="json" className="mt-0">
            <div className="max-h-[340px] overflow-y-auto pr-2 scrollbar-thin">
              <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-xs text-white/80 font-mono overflow-x-auto">
                {JSON.stringify(response.rawData || response, null, 2)}
              </pre>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            <div className="max-h-[340px] overflow-y-auto pr-2 scrollbar-thin space-y-3">
              {response.previousVersions && response.previousVersions.length > 0 ? (
                response.previousVersions.map((version, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/50">Versão {response.previousVersions!.length - idx}</span>
                      <span className="text-xs text-white/40">{version.timestamp.toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-white/70 line-clamp-3">{version.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-white/40">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma versão anterior</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
