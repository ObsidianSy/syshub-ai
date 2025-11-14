// =====================================================
// Exemplo de como usar os services no frontend
// =====================================================

import { authService } from '@/services/auth.service';
import { systemsService } from '@/services/systems.service';
import { queriesService } from '@/services/queries.service';
import { conversationsService } from '@/services/conversations.service';
import { usersService } from '@/services/users.service';

// =====================================================
// AUTENTICAÇÃO
// =====================================================

// 1. Fazer login
async function handleLogin(email: string, password: string) {
  try {
    const { user, token } = await authService.login(email, password);
    console.log('Usuário logado:', user);
    // Token é automaticamente salvo no localStorage
    return user;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

// 2. Registrar novo usuário
async function handleRegister(email: string, password: string, fullName: string) {
  try {
    const { user, token } = await authService.register(email, password, fullName);
    console.log('Usuário criado:', user);
    return user;
  } catch (error) {
    console.error('Erro no registro:', error);
    throw error;
  }
}

// 3. Verificar se está logado (ao carregar app)
async function checkAuth() {
  try {
    const { user } = await authService.verifyToken();
    return user;
  } catch (error) {
    authService.logout(); // Remove token inválido
    return null;
  }
}

// 4. Logout
function handleLogout() {
  authService.logout();
  window.location.href = '/login';
}

// =====================================================
// SISTEMAS
// =====================================================

// 1. Listar todos os sistemas
async function loadSystems() {
  try {
    const { systems, total } = await systemsService.getAll();
    console.log(`${total} sistemas encontrados:`, systems);
    return systems;
  } catch (error) {
    console.error('Erro ao carregar sistemas:', error);
    return [];
  }
}

// 2. Buscar sistemas por categoria
async function loadSystemsByCategory(category: string) {
  try {
    const { systems } = await systemsService.getAll({ category });
    return systems;
  } catch (error) {
    console.error('Erro ao buscar sistemas:', error);
    return [];
  }
}

// 3. Buscar sistemas online
async function loadOnlineSystems() {
  try {
    const { systems } = await systemsService.getAll({ status: 'online' });
    return systems;
  } catch (error) {
    console.error('Erro ao buscar sistemas:', error);
    return [];
  }
}

// 4. Buscar sistema por slug
async function getSystemBySlug(slug: string) {
  try {
    const system = await systemsService.getBySlug(slug);
    return system;
  } catch (error) {
    console.error('Sistema não encontrado:', error);
    return null;
  }
}

// =====================================================
// QUERIES (Perguntas ao agente)
// =====================================================

// 1. Criar nova query
async function createQuery(question: string, systemId?: string) {
  try {
    const query = await queriesService.create({
      question,
      systemId,
    });
    console.log('Query criada:', query);
    return query;
  } catch (error) {
    console.error('Erro ao criar query:', error);
    throw error;
  }
}

// 2. Listar queries do usuário
async function loadUserQueries() {
  try {
    const { queries, total } = await queriesService.getAll({ limit: 50 });
    console.log(`${total} queries encontradas`);
    return queries;
  } catch (error) {
    console.error('Erro ao carregar queries:', error);
    return [];
  }
}

// 3. Listar apenas favoritos
async function loadFavoriteQueries() {
  try {
    const { queries } = await queriesService.getAll({ favorite: true });
    return queries;
  } catch (error) {
    console.error('Erro ao carregar favoritos:', error);
    return [];
  }
}

// 4. Marcar/desmarcar como favorito
async function toggleFavorite(queryId: string) {
  try {
    const query = await queriesService.toggleFavorite(queryId);
    console.log('Favorito atualizado:', query.is_favorite);
    return query;
  } catch (error) {
    console.error('Erro ao favoritar:', error);
    throw error;
  }
}

// 5. Atualizar query com resposta (quando agente responde)
async function updateQueryResponse(
  queryId: string,
  response: string,
  systemUsed?: string
) {
  try {
    const query = await queriesService.update(queryId, {
      response,
      status: 'completed',
      executionTimeMs: Date.now(), // calcular tempo real
    });
    return query;
  } catch (error) {
    console.error('Erro ao atualizar query:', error);
    throw error;
  }
}

// =====================================================
// CONVERSAS
// =====================================================

// 1. Criar nova conversa
async function createConversation(title?: string) {
  try {
    const conversation = await conversationsService.create(title);
    console.log('Conversa criada:', conversation);
    return conversation;
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    throw error;
  }
}

// 2. Listar conversas
async function loadConversations() {
  try {
    const { conversations } = await conversationsService.getAll({ limit: 20 });
    return conversations;
  } catch (error) {
    console.error('Erro ao carregar conversas:', error);
    return [];
  }
}

// 3. Carregar conversa com mensagens
async function loadConversationWithMessages(conversationId: string) {
  try {
    const { conversation, messages } = await conversationsService.getById(
      conversationId
    );
    return { conversation, messages };
  } catch (error) {
    console.error('Erro ao carregar conversa:', error);
    return null;
  }
}

// 4. Adicionar mensagem do usuário
async function sendMessage(conversationId: string, content: string) {
  try {
    const message = await conversationsService.addMessage(conversationId, {
      role: 'user',
      content,
    });
    return message;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

// 5. Adicionar resposta do agente
async function addAgentResponse(
  conversationId: string,
  content: string,
  systemId?: string
) {
  try {
    const message = await conversationsService.addMessage(conversationId, {
      role: 'assistant',
      content,
      systemId,
    });
    return message;
  } catch (error) {
    console.error('Erro ao adicionar resposta:', error);
    throw error;
  }
}

// =====================================================
// USUÁRIO
// =====================================================

// 1. Carregar perfil do usuário
async function loadUserProfile() {
  try {
    const profile = await usersService.getProfile();
    console.log('Perfil:', profile);
    return profile;
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    return null;
  }
}

// 2. Carregar estatísticas
async function loadUserStats() {
  try {
    const stats = await usersService.getStats();
    console.log('Estatísticas:', stats);
    return stats;
  } catch (error) {
    console.error('Erro ao carregar stats:', error);
    return null;
  }
}

// 3. Carregar atividade recente
async function loadUserActivity() {
  try {
    const activity = await usersService.getActivity(10);
    return activity;
  } catch (error) {
    console.error('Erro ao carregar atividade:', error);
    return [];
  }
}

// 4. Atualizar perfil
async function updateProfile(fullName: string, avatarUrl?: string) {
  try {
    const profile = await usersService.updateProfile({ fullName, avatarUrl });
    console.log('Perfil atualizado:', profile);
    return profile;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}

// =====================================================
// EXEMPLO DE FLUXO COMPLETO
// =====================================================

async function exampleCompleteFlow() {
  // 1. Login
  const user = await handleLogin('admin@test.com', '123456');

  // 2. Carregar sistemas
  const systems = await loadSystems();

  // 3. Criar query
  const query = await createQuery(
    'Qual o estoque de produtos?',
    systems[0]?.id
  );

  // 4. Simular resposta do agente (normalmente viria do N8N)
  await updateQueryResponse(
    query.id,
    'O sistema possui 1.234 produtos em estoque total.',
    systems[0]?.name
  );

  // 5. Carregar estatísticas
  const stats = await loadUserStats();
  console.log('Suas estatísticas:', stats);
}

// =====================================================
// INTEGRAÇÃO COM REACT QUERY (Exemplo)
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Hook para listar sistemas
export function useSystems() {
  return useQuery({
    queryKey: ['systems'],
    queryFn: () => systemsService.getAll(),
  });
}

// Hook para listar queries
export function useQueries() {
  return useQuery({
    queryKey: ['queries'],
    queryFn: () => queriesService.getAll({ limit: 50 }),
  });
}

// Hook para criar query
export function useCreateQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { question: string; systemId?: string }) =>
      queriesService.create(data),
    onSuccess: () => {
      // Invalida cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ['queries'] });
    },
  });
}

// Hook para favoritar
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queryId: string) => queriesService.toggleFavorite(queryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queries'] });
    },
  });
}

// =====================================================
// EXEMPLO DE USO EM COMPONENTE REACT
// =====================================================

/*
import { useSystems, useCreateQuery } from '@/lib/api-examples';

function MyComponent() {
  const { data: systemsData, isLoading } = useSystems();
  const createQuery = useCreateQuery();

  const handleAskQuestion = async (question: string) => {
    try {
      await createQuery.mutateAsync({
        question,
        systemId: systemsData?.systems[0]?.id,
      });
      toast.success('Pergunta enviada!');
    } catch (error) {
      toast.error('Erro ao enviar pergunta');
    }
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Sistemas: {systemsData?.total}</h1>
      {systemsData?.systems.map(system => (
        <div key={system.id}>{system.name}</div>
      ))}
    </div>
  );
}
*/

// =====================================================
// EXPORT DOS EXEMPLOS
// =====================================================

export {
  // Auth
  handleLogin,
  handleRegister,
  checkAuth,
  handleLogout,

  // Systems
  loadSystems,
  loadSystemsByCategory,
  loadOnlineSystems,
  getSystemBySlug,

  // Queries
  createQuery,
  loadUserQueries,
  loadFavoriteQueries,
  toggleFavorite,
  updateQueryResponse,

  // Conversations
  createConversation,
  loadConversations,
  loadConversationWithMessages,
  sendMessage,
  addAgentResponse,

  // User
  loadUserProfile,
  loadUserStats,
  loadUserActivity,
  updateProfile,

  // Complete flow
  exampleCompleteFlow,
};
