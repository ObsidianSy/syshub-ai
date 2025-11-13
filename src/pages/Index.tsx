import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ChatInput } from "@/components/ChatInput";
import { ResponseCarousel, AgentResponse } from "@/components/ResponseCarousel";
import { ResponseModal } from "@/components/ResponseModal";
import { mockSystems } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [isDark, setIsDark] = useState(true);
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
    setIsLoading(true);
    
    // Simular chamada ao webhook (substituir pela URL real do n8n)
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || "";
    
    // Enviar todos os sistemas disponíveis para o agente decidir qual usar
    const payload = {
      user_question: message,
      available_systems: mockSystems.map(sys => ({
        id: sys.id,
        name: sys.name,
        slug: sys.slug,
        category: sys.category,
        status: sys.status,
        description: sys.description,
      })),
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
          systemName: data.system_used || "Agente IA",
        };

        setResponses(prev => [...prev, newResponse]);
        setIsConnected(true);
      } else {
        // Mock response para demonstração
        setTimeout(() => {
          const newResponse: AgentResponse = {
            id: Date.now().toString(),
            title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
            content: `Esta é uma resposta simulada do agente sobre "${message}".\n\nO agente identificou que você está perguntando sobre um sistema específico e buscaria as informações no banco de dados correspondente.\n\nPara conectar ao agente real, configure a variável de ambiente VITE_N8N_WEBHOOK_URL com a URL do seu webhook do n8n.\n\nO agente receberá:\n- Sua pergunta\n- Lista de todos os sistemas disponíveis\n- Histórico da conversa\n\nE retornará:\n- A resposta com os dados solicitados\n- Qual sistema foi consultado (campo "system_used")`,
            timestamp: new Date(),
            systemName: "Agente IA",
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
    <div className="min-h-screen space-bg flex flex-col relative overflow-hidden">
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
      
      <Header 
        isDark={isDark} 
        onThemeToggle={() => setIsDark(!isDark)}
        isConnected={isConnected}
      />
      
      <main className="flex-1 flex flex-col pt-16 relative z-10">
        {/* Área grande para respostas 3D */}
        <div className="flex-1 overflow-hidden">
          {isLoading && responses.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-4 text-white">
                <Loader2 className="h-12 w-12 animate-spin" />
                <span className="text-lg">Consultando agente...</span>
              </div>
            </div>
          )}
          <ResponseCarousel
            responses={responses}
            onResponseClick={setSelectedResponse}
          />
        </div>
        
        {/* Área do chat fixo embaixo */}
        <div className="pb-6">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </main>

      <ResponseModal
        response={selectedResponse}
        onClose={() => setSelectedResponse(null)}
      />
    </div>
  );
};

export default Index;
