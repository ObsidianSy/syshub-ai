import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ChatInput } from "@/components/ChatInput";
import { ConversationHistory, Conversation } from "@/components/ConversationHistory";
import { DocumentationPanel } from "@/components/DocumentationPanel";
import { QuickSuggestions } from "@/components/QuickSuggestions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import { systemsService } from "@/services/systems.service";
import { authService } from "@/services/auth.service";
import { conversationsService } from "@/services/conversations.service";
import { agentService } from "@/services/agent.service";
import * as conversationDocumentsService from "@/services/conversation-documents.service";
import { System, SystemCategory } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  systemName?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [systems, setSystems] = useState<System[]>([]);
  
  // Estado para conversas
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Estado para documentos
  const [documents, setDocuments] = useState<conversationDocumentsService.ConversationDocument[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const onlineSystems = systems.filter(s => s.status === "online").length;
  const lastUpdate = new Date();

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Carregar sistemas e conversas ao montar
  useEffect(() => {
    // 0) Verificar validade do token e sincronizar usuário
    (async () => {
      try {
        const { user } = await authService.verifyToken();
        localStorage.setItem('user', JSON.stringify(user));
      } catch (err) {
        console.warn('Token inválido ou usuário inexistente. Limpando sessão.');
        authService.logout();
        navigate('/login', { replace: true });
        return;
      }
    })();

    loadSystems();
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const loadSystems = useCallback(async () => {
    try {
      const { systems: data } = await systemsService.getAll();
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

  const loadConversations = async () => {
    try {
      console.log('📥 Carregando conversas do backend...');
      const { conversations: data } = await conversationsService.getAll();
      console.log('📥 Conversas recebidas:', data.length);
      
      // Converter para formato da UI
      const convs: Conversation[] = data.map(c => {
        const lastMsg = c.last_message_at ? new Date(c.last_message_at) : new Date(c.created_at);
        return {
          id: c.id,
          title: c.title || "Nova Conversa",
          lastMessage: "Clique para ver mensagens",
          timestamp: lastMsg,
          messageCount: 0, // Será atualizado quando carregar mensagens
          isFavorite: false,
        };
      });
      
      setConversations(convs);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const conversation = await conversationsService.getById(conversationId);
      
      // Converter mensagens para formato da UI
      const msgs: Message[] = conversation.messages.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at),
        systemName: m.system_name,
      }));
      
      setMessages(msgs);
      setCurrentConversationId(conversationId);
      
      // Atualizar contador de mensagens na lista
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, messageCount: msgs.length }
          : c
      ));
      
      toast({
        title: "Conversa carregada",
        description: `${msgs.length} mensagens encontradas`,
      });
    } catch (error) {
      console.error("Erro ao carregar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a conversa.",
        variant: "destructive",
      });
    }
  };

  const handleNewConversation = async () => {
    try {
      const title = `Conversa ${new Date().toLocaleString("pt-BR")}`;
      const newConv = await conversationsService.create(title);
      
      const conversation: Conversation = {
        id: newConv.id,
        title: newConv.title,
        lastMessage: "Nova conversa iniciada",
        timestamp: new Date(newConv.created_at),
        messageCount: 0,
        isFavorite: false,
      };
      
      setConversations(prev => [conversation, ...prev]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      
      toast({
        title: "Nova conversa",
        description: "Conversa criada com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conversa.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    
    try {
      // Criar nova conversa se não houver uma ativa
      let conversationId = currentConversationId;
      
      if (!conversationId) {
        const title = `Conversa ${new Date().toLocaleString("pt-BR")}`;
        const newConv = await conversationsService.create(title);
        
        const conversation: Conversation = {
          id: newConv.id,
          title: newConv.title,
          lastMessage: message.substring(0, 100),
          timestamp: new Date(newConv.created_at),
          messageCount: 0,
          isFavorite: false,
        };
        
        setConversations(prev => [conversation, ...prev]);
        setCurrentConversationId(newConv.id);
        conversationId = newConv.id;
      }

      // 1. Adicionar mensagem do usuário à conversa
      await conversationsService.addMessage(conversationId, {
        role: "user",
        content: message,
      });

      // Atualizar UI imediatamente com a mensagem do usuário
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // 2. Chamar agente via backend (proxy para N8N)
      const responseData = await agentService.process({ question: message });
      setIsConnected(true);

      // Normalizar resposta
      const answer = responseData.answer || "Sem resposta";
      const systemUsed = responseData.system_used || "Agente IA";
      const systemId = responseData.system_id;

      // 3. Adicionar resposta do agente à conversa
      await conversationsService.addMessage(conversationId, {
        role: "assistant",
        content: answer,
        systemId: systemId,
      });

      // Atualizar UI com a resposta do assistente
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answer,
        timestamp: new Date(),
        systemName: systemUsed,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Atualizar lista de conversas (última mensagem + contador)
      setConversations(prev => prev.map(c => 
        c.id === conversationId
          ? {
              ...c,
              lastMessage: answer.substring(0, 100),
              timestamp: new Date(),
              messageCount: c.messageCount + 2, // user + assistant
            }
          : c
      ));

      toast({
        title: "Resposta recebida",
        description: `Consultado: ${systemUsed}`,
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

  const handleConversationClick = async (conversationId: string) => {
    loadConversation(conversationId);
    // Carregar documentos da conversa
    await loadDocuments(conversationId);
  };

  // Carregar documentos de uma conversa
  const loadDocuments = async (conversationId: string) => {
    try {
      const docs = await conversationDocumentsService.getConversationDocuments(conversationId);
      setDocuments(docs);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
      setDocuments([]);
    }
  };

  // Handler para upload de documento
  const handleUploadDocument = async (file: File) => {
    if (!currentConversationId) {
      toast({
        title: "Erro",
        description: "Selecione uma conversa primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      const newDoc = await conversationDocumentsService.uploadConversationDocument(
        currentConversationId,
        file
      );
      setDocuments((prev) => [newDoc, ...prev]);
      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o arquivo",
        variant: "destructive",
      });
    }
  };

  // Handler para deletar documento
  const handleDeleteDocument = async (documentId: string) => {
    if (!currentConversationId) return;

    try {
      await conversationDocumentsService.deleteConversationDocument(
        currentConversationId,
        documentId
      );
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      toast({
        title: "Sucesso",
        description: "Arquivo deletado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao deletar documento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o arquivo",
        variant: "destructive",
      });
    }
  };

  // Handler para download de documento
  const handleDownloadDocument = (document: conversationDocumentsService.ConversationDocument) => {
    if (!currentConversationId) return;
    conversationDocumentsService.downloadConversationDocument(
      currentConversationId,
      document.id,
      document.name
    );
  };

  const handleToggleFavorite = (id: string) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
    
    toast({
      title: "Favorito atualizado",
      description: "A conversa foi marcada/desmarcada como favorita.",
    });
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      console.log('🗑️ Deletando conversa:', id);
      
      // Deletar no backend
      const result = await conversationsService.delete(id);
      console.log('✅ Conversa deletada no backend:', result);
      
      // Remover da lista local
      setConversations(prev => {
        const updated = prev.filter(c => c.id !== id);
        console.log('📝 Conversas após delete:', updated.length);
        return updated;
      });
      
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      
      toast({
        title: "Conversa excluída",
        description: "A conversa foi removida com sucesso.",
      });
    } catch (error) {
      console.error("❌ Erro ao deletar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa.",
        variant: "destructive",
      });
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
        onLogout={handleLogout}
        totalSystems={systems.length}
        onlineSystems={onlineSystems}
        lastUpdate={lastUpdate}
      />
      
      {/* Histórico de conversas (esquerda) */}
      <ConversationHistory
        conversations={conversations}
        currentConversationId={currentConversationId}
        onConversationClick={handleConversationClick}
        onNewConversation={handleNewConversation}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteConversation}
      />
      
      {/* Painel de Documentação (direita) */}
      <DocumentationPanel
        conversationId={currentConversationId}
        documents={documents}
        onUpload={handleUploadDocument}
        onDelete={handleDeleteDocument}
        onDownload={handleDownloadDocument}
      />
      
      <main className="flex-1 flex flex-col pt-[80px] pl-96 pr-80 relative z-10 transition-all duration-300 h-screen">
        {/* Área de mensagens com scroll */}
        <div className="flex-1 overflow-y-auto px-8 max-w-7xl mx-auto w-full pb-4">
          
          {/* Estado vazio - sem conversa ativa */}
          {messages.length === 0 && (
            <>
              <div className="text-center mb-12 mt-20">
                <div className="inline-flex items-center justify-center mb-6">
                  <img 
                    src="/logo.png" 
                    alt="SysHub AI" 
                    className="h-32 w-32 object-contain animate-float"
                  />
                </div>
                <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent animate-fade-in-up">
                  Central de Sistemas
                </h1>
                <p className="text-xl text-white/70 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  Digite sua mensagem para começar uma conversa
                </p>
              </div>

              <div className="mb-12 w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <QuickSuggestions 
                  onSuggestionClick={(text) => {
                    handleSendMessage(text);
                  }}
                />
              </div>
            </>
          )}
          
          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center gap-4 text-white py-12">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <span className="text-xl font-medium">Consultando agente...</span>
            </div>
          )}

          {/* Mensagens da conversa */}
          {messages.length > 0 && (
            <div className="w-full max-w-4xl mt-8 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-4 p-6 rounded-2xl backdrop-blur-xl border",
                    msg.role === "user"
                      ? "bg-primary/10 border-primary/20 ml-12"
                      : "bg-white/5 border-white/10 mr-12"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-white text-sm">
                        {msg.role === "user" ? "Você" : msg.systemName || "Assistente"}
                      </span>
                      <span className="text-xs text-white/40">
                        {msg.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">W</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input de chat fixo na parte inferior */}
        <div className="border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-8">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="Digite sua mensagem..."
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// Função auxiliar para classes condicionais
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default Index;
