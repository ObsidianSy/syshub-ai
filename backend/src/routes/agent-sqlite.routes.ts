import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Rota proxy para chamar o webhook N8N (evita problemas de CORS)
router.post('/process', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    console.log('🤖 Agent process chamado por:', req.user?.email);
    console.log('📦 Payload recebido:', JSON.stringify(req.body, null, 2));
    
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      console.log('⚠️ N8N_WEBHOOK_URL não configurado, retornando resposta mock');
      return res.json({
        answer: `⚠️ **Modo Desenvolvimento Backend**\n\nWebhook N8N não configurado no backend.\n\nConfigure N8N_WEBHOOK_URL no arquivo backend/.env`,
        system_used: 'Sistema Mock',
        confidence: 0.9,
      });
    }

    console.log('🤖 Chamando webhook N8N:', webhookUrl);
    console.log('📦 Payload enviado para N8N:');
    console.log(JSON.stringify(req.body, null, 2));

    // Fazer requisição para o webhook N8N
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    console.log('📊 Status da resposta do N8N:', webhookResponse.status);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('❌ Erro no webhook N8N:', webhookResponse.status);
      console.error('❌ Resposta completa do N8N:', errorText);
      
      // Tentar parsear o erro como JSON para ver mais detalhes
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Erro JSON do N8N:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Se não for JSON, já logamos o texto acima
      }
      
      throw new Error(`Webhook N8N retornou erro: ${webhookResponse.status} - ${errorText}`);
    }

    // Ler o corpo da resposta como texto primeiro
    const responseText = await webhookResponse.text();
    console.log('📄 Resposta raw do N8N:', responseText);

    // Tentar parsear como JSON
    let responseData;
    if (!responseText || responseText.trim() === '') {
      console.warn('⚠️ N8N retornou resposta vazia, usando valores padrão');
      responseData = {
        answer: 'Olá! Recebi sua mensagem mas o agente N8N não retornou uma resposta processada.',
        system_used: 'Sistema Padrão',
        confidence: 0.5,
      };
    } else {
      try {
        responseData = JSON.parse(responseText);
        console.log('✅ Resposta parseada do webhook N8N:', JSON.stringify(responseData, null, 2));
        
        // Normalizar formato da resposta
        // Se N8N retornar "output", converter para "answer"
        if (responseData.output && !responseData.answer) {
          responseData.answer = responseData.output;
          delete responseData.output;
        }
        
        // Garantir campos padrão
        if (!responseData.system_used) {
          responseData.system_used = 'Agente IA';
        }
        if (responseData.confidence === undefined) {
          responseData.confidence = 0.9;
        }
        
      } catch (parseError) {
        console.error('❌ Erro ao parsear JSON do N8N:', parseError);
        console.error('❌ Texto recebido:', responseText);
        throw new Error(`N8N retornou resposta inválida: ${responseText.substring(0, 100)}`);
      }
    }

    console.log('✅ Resposta final enviada ao frontend:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error: any) {
    console.error('❌ Erro ao processar requisição do agente:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      error: 'Erro ao processar requisição do agente',
      details: error.message,
    });
  }
});

export default router;
