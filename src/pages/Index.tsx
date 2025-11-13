import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SystemSidebar } from "@/components/SystemSidebar";
import { DocumentationTabs } from "@/components/DocumentationTabs";
import { ChatInput } from "@/components/ChatInput";
import { ResponseCarousel, AgentResponse } from "@/components/ResponseCarousel";
import { ResponseModal } from "@/components/ResponseModal";
import { System } from "@/components/SystemCard";
import { mockSystems } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [isDark, setIsDark] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<AgentResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleSendMessage = async (message: string) => {
    if (!selectedSystem) {
      toast({
        title: "Sistema não selecionado",
        description: "Por favor, selecione um sistema antes de enviar uma mensagem",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simular chamada ao webhook (substituir pela URL real do n8n)
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || "";
    
    const payload = {
      system_id: selectedSystem.id,
      system_name: selectedSystem.name,
      user_question: message,
      conversation_history: responses.map(r => ({
        role: "assistant",
        content: r.content,
      })),
      metadata: {
        source: "Central de Sistemas",
        ui_version: "v1",
      },
    };

    try {
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Falha na comunicação com o agente");

        const data = await response.json();
        
        const newResponse: AgentResponse = {
          id: Date.now().toString(),
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
          content: data.answer || "Resposta do agente",
          timestamp: new Date(),
          systemName: selectedSystem.name,
        };

        setResponses(prev => [...prev, newResponse]);
        setIsConnected(true);
      } else {
        // Mock response para demonstração
        setTimeout(() => {
          const newResponse: AgentResponse = {
            id: Date.now().toString(),
            title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
            content: `Esta é uma resposta simulada do agente sobre "${message}" no sistema ${selectedSystem.name}.\n\nPara conectar ao agente real, configure a variável de ambiente VITE_N8N_WEBHOOK_URL com a URL do seu webhook do n8n.\n\nO agente pode responder sobre fluxos, APIs, integrações e qualquer dúvida sobre os sistemas cadastrados.`,
            timestamp: new Date(),
            systemName: selectedSystem.name,
          };
          
          setResponses(prev => [...prev, newResponse]);
          setIsLoading(false);
        }, 1500);
        return;
      }
    } catch (error) {
      console.error("Erro ao comunicar com o agente:", error);
      setIsConnected(false);
      toast({
        title: "Erro de conexão",
        description: "Não consegui falar com o agente agora. Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isDark={isDark} 
        onThemeToggle={() => setIsDark(!isDark)}
        isConnected={isConnected}
      />
      
      <div className="flex pt-16 h-screen">
        <SystemSidebar
          systems={mockSystems}
          selectedSystemId={selectedSystem?.id || null}
          onSystemSelect={setSelectedSystem}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-auto">
            <DocumentationTabs system={selectedSystem} />
          </div>
          
          <div className="h-[400px] border-t">
            <div className="h-[55%] border-b">
              <ResponseCarousel
                responses={responses}
                onResponseClick={setSelectedResponse}
              />
            </div>
            
            <div className="h-[45%] relative">
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Consultando agente...</span>
                  </div>
                </div>
              )}
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </main>
      </div>

      <ResponseModal
        response={selectedResponse}
        onClose={() => setSelectedResponse(null)}
      />
    </div>
  );
};

export default Index;
