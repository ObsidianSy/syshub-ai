import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ChatInput } from "@/components/ChatInput";
import { ResponseCarousel, AgentResponse } from "@/components/ResponseCarousel";
import { ResponseModal } from "@/components/ResponseModal";
import { QueryHistory, HistoryItem, Project } from "@/components/QueryHistory";
import { StatusPanel } from "@/components/StatusPanel";
import { SystemsSidebar } from "@/components/SystemsSidebar";
import { QuickSuggestions } from "@/components/QuickSuggestions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { systemsService } from "@/services/systems.service";
import { queriesService } from "@/services/queries.service";
import { conversationsService } from "@/services/conversations.service";
import { System, SystemCategory } from "@/types";

const Index = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<AgentResponse | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectContext, setCurrentProjectContext] = useState<string>("");
  const [systems, setSystems] = useState<System[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();

  const onlineSystems = systems.filter(s => s.status === "online").length;
  const lastUpdate = new Date();

  // Carregar sistemas e histórico ao montar
  useEffect(() => {
    loadSystems();
    loadHistory();
    loadProjects();
    createConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSystems = useCallback(async () => {
    try {
      const { systems: data } = await systemsService.getAll();
      // Mapear para o tipo System do types/index.ts
      setSystems(data.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        category: s.category as SystemCategory,
        status: s.status,
        description: s.description,
        icon: s.icon,
        version: s.version,
        orderIndex: s.order_index || 0,
        isActive: true,
        createdAt: s.created_at || new Date().toISOString(),
        updatedAt: s.updated_at || new Date().toISOString()
      })));
    } catch (error) {
      console.error("Erro ao carregar sistemas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os sistemas.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadHistory = async () => {
    try {
      const { queries } = await queriesService.getAll({ limit: 50 });
      const historyItems: HistoryItem[] = queries.map(q => ({
        id: q.id,
        systemName: q.system_name || "Agente IA",
        question: q.question,
        summary: q.response?.substring(0, 100) + "..." || "Processando...",
        timestamp: new Date(q.created_at),
        isFavorite: q.is_favorite,
        projectId: undefined
      }));
      setHistory(historyItems);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  const loadProjects = () => {
    // Carregar projetos do localStorage
    const saved = localStorage.getItem('projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed.map((p: Project) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      })));
    }
  };

  const saveProjects = (updatedProjects: Project[]) => {
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  const createConversation = async () => {
    try {
      const title = `Conversa ${new Date().toLocaleString("pt-BR")}`;
      const conversation = await conversationsService.create(title);
      setConversationId(conversation.id);
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    
    try {
      // Adicionar contexto do projeto à pergunta se houver projeto ativo
      let fullMessage = message;
      if (currentProjectId && currentProjectContext) {
        fullMessage = `[CONTEXTO DO PROJETO: ${currentProjectContext}]\n\nPERGUNTA: ${message}`;
      }

      // 1. Criar query no backend
      const query = await queriesService.create({
        question: message, // Salva apenas a pergunta original
      });
      
      console.log('Query criada:', query);
      
      if (!query || !query.id) {
        throw new Error('Query criada sem ID');
      }

      // 2. Adicionar mensagem à conversa
      if (conversationId) {
        await conversationsService.addMessage(conversationId, {
          role: "user",
          content: message,
        });
      }

      // 3. Chamar agente via backend (proxy para evitar CORS)
      const payload = {
        question: fullMessage, // Envia a pergunta com contexto do projeto
      };

      // Chamar backend que faz proxy para N8N
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const agentResponse = await fetch(`${backendUrl}/api/agent/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!agentResponse.ok) {
        throw new Error(`Erro ao processar requisição: ${agentResponse.status}`);
      }

      const responseData = await agentResponse.json();
      setIsConnected(true);

      // Normalizar resposta - aceitar "answer" ou "output"
      const answer = responseData.answer || responseData.output || "Sem resposta";
      const systemUsed = responseData.system_used || responseData.system || "Agente IA";
      const systemId = responseData.system_id;

      // 4. Atualizar query com resposta
      await queriesService.update(query.id, {
        response: answer,
        status: 'completed',
      });

      // 5. Adicionar resposta do agente à conversa
      if (conversationId) {
        await conversationsService.addMessage(conversationId, {
          role: "assistant",
          content: answer,
          systemId: systemId,
        });
      }

      // 6. Atualizar UI
      const newResponse: AgentResponse = {
        id: query.id,
        title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        content: answer,
        timestamp: new Date(),
        systemName: systemUsed,
      };

      setResponses(prev => [...prev, newResponse]);

      const historyItem: HistoryItem = {
        id: query.id,
        systemName: systemUsed,
        question: message,
        summary: answer.substring(0, 100) + (answer.length > 100 ? "..." : ""),
        timestamp: new Date(),
        isFavorite: false,
        projectId: currentProjectId || undefined,
      };
      setHistory(prev => [historyItem, ...prev]);

      toast({
        title: "Resposta recebida",
        description: `Consultado: ${responseData.system_used || "Agente IA"}`,
      });

    } catch (error: unknown) {
      console.error("Erro ao processar pergunta:", error);
      setIsConnected(false);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua pergunta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryItemClick = async (item: HistoryItem) => {
    try {
      // Buscar a query completa do backend
      const query = await queriesService.getById(item.id);
      
      // Criar ou atualizar a resposta no carrossel
      const response: AgentResponse = {
        id: query.id,
        title: query.question.substring(0, 50) + (query.question.length > 50 ? "..." : ""),
        content: query.response || "Sem resposta disponível",
        timestamp: new Date(query.created_at),
        systemName: query.system_name || "Agente IA",
      };
      
      // Atualizar ou adicionar ao array de respostas
      setResponses(prev => {
        const exists = prev.find(r => r.id === query.id);
        if (exists) return prev;
        return [...prev, response];
      });
      
      setSelectedResponse(response);
      setSelectedHistoryId(item.id);
      
      toast({
        title: "Chat carregado",
        description: `Você está vendo: ${item.question.substring(0, 40)}...`,
      });
    } catch (error) {
      console.error("Erro ao carregar query:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o chat.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await queriesService.toggleFavorite(id);
      setHistory(prev =>
        prev.map(item =>
          item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
        )
      );
    } catch (error) {
      console.error("Erro ao favoritar:", error);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await queriesService.delete(id);
      
      // Remover do histórico
      setHistory(prev => prev.filter(item => item.id !== id));
      
      // Remover das respostas se existir
      setResponses(prev => prev.filter(r => r.id !== id));
      
      // Limpar seleção se for o item deletado
      if (selectedHistoryId === id) {
        setSelectedHistoryId(null);
        setSelectedResponse(null);
      }
      
      toast({
        title: "Chat excluído",
        description: "O chat foi removido do histórico.",
      });
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o chat.",
        variant: "destructive",
      });
    }
  };

  const handleCreateProject = (name: string, description: string, context: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      context,
      createdAt: new Date(),
    };
    
    const updatedProjects = [...projects, newProject];
    saveProjects(updatedProjects);
    
    toast({
      title: "Projeto criado",
      description: `Projeto "${name}" criado com sucesso!`,
    });
  };

  const handleSelectProject = (projectId: string | null) => {
    setCurrentProjectId(projectId);
    
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      setCurrentProjectContext(project?.context || "");
      
      toast({
        title: "Projeto selecionado",
        description: `Agora você está no projeto "${project?.name}"`,
      });
    } else {
      setCurrentProjectContext("");
      toast({
        title: "Projeto geral",
        description: "Você está no chat geral",
      });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjects(updatedProjects);
    
    // Se o projeto deletado está ativo, voltar para geral
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
      setCurrentProjectContext("");
    }
    
    toast({
      title: "Projeto excluído",
      description: `Projeto "${project?.name}" foi excluído.`,
    });
  };

  return (
    <div className="min-h-screen space-bg flex flex-col relative overflow-hidden">
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
      
      <Header 
        isDark={isDark} 
        onThemeToggle={() => setIsDark(!isDark)}
        isConnected={isConnected}
        onLogout={handleLogout}
        totalSystems={systems.length}
        onlineSystems={onlineSystems}
        lastUpdate={lastUpdate}
      />
      
      <QueryHistory 
        items={history}
        projects={projects}
        currentProjectId={currentProjectId}
        onItemClick={handleHistoryItemClick}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteHistory}
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
        selectedId={selectedHistoryId}
      />

      {/* Sidebar direita de sistemas */}
      <SystemsSidebar
        systems={systems.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status as 'online' | 'offline' | 'maintenance',
          responseTime: 150,
          lastQuery: new Date(),
          queriesCount: history.filter(h => h.systemName === s.name).length,
          uptime: s.status === 'online' ? 99.9 : 0,
          category: s.category || 'Sistema'
        }))}
        onSystemSelect={(systemId) => {
          const system = systems.find(s => s.id === systemId);
          if (system) {
            toast({
              title: "Sistema selecionado",
              description: `Pronto para consultar ${system.name}`,
            });
          }
        }}
      />
      
      <main className="flex-1 flex flex-col pt-[80px] pl-0 relative z-10 transition-all duration-300">
        {/* Área central para conteúdo */}
        <div className="flex-1 flex flex-col items-center px-8 max-w-7xl mx-auto w-full">
          {/* Título centralizado - só aparece quando não há respostas */}
          {responses.length === 0 && (
            <>
              <div className="text-center mb-12 mt-20">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-float">
                  <svg className="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent animate-fade-in-up">
                  Central de Sistemas
                </h1>
                <p className="text-xl text-white/70 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  Faça uma pergunta sobre qualquer sistema e o agente vai buscar as informações para você
                </p>
              </div>

              {/* Sugestões Rápidas */}
              <div className="mb-12 w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <QuickSuggestions 
                  onSuggestionClick={(text) => {
                    handleSendMessage(text);
                  }}
                />
              </div>
            </>
          )}
          
          {/* Loading ou Respostas */}
          {isLoading && responses.length === 0 && (
            <div className="flex flex-col items-center gap-4 text-white py-12">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <span className="text-xl font-medium">Consultando agente...</span>
            </div>
          )}

          {responses.length > 0 && (
            <div className="w-full max-w-6xl mt-16">
              <ResponseCarousel
                responses={responses}
                onResponseClick={setSelectedResponse}
              />
            </div>
          )}
          
          <div className="flex-1" />
          
          {/* Área do chat fixo embaixo */}
          <div className="w-full max-w-5xl pb-6 pt-6">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
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
