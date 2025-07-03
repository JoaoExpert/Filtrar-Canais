exports.handler = async (event, context) => {
  // URLs dos seus webhooks
  const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/k2vb52pvrs3gi5p7fg8z9ew0m029zpbd';
  const N8N_WEBHOOK_URL = 'https://n8n.joaog.tech/webhook-test/df247691-ea33-4486-a8b6-175a43f289f1';
  
  // Nome do canal que você quer receber
  const CANAL_PERMITIDO = 'WhatsApp Unimed Provisório (NÃO UTILIZAR)';
  
  console.log('🔥 Webhook recebido:', new Date().toISOString());
  
  try {
    // Verificar se é uma requisição POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido. Use POST.' })
      };
    }
    
    // Parse dos dados recebidos do Suri
    const data = JSON.parse(event.body);
    
    // Extrair informações do canal (agora sabemos onde está!)
    const canalId = data.payload?.channel?.Id;
    const canalNome = data.payload?.channel?.Name || 'Não informado';
    const usuarioNome = data.payload?.user?.Name || 'Não informado';
    const mensagem = data.payload?.Message?.text || 'Não informado';
    
    // Log das informações principais
    console.log('📋 Dados recebidos:', {
      canal: canalNome,
      canalId: canalId,
      usuario: usuarioNome,
      mensagem: mensagem,
      tipo: data.type || 'Não informado'
    });
    
    // Verificar se é do canal específico (comparando pelo NOME)
    if (canalNome === CANAL_PERMITIDO) {
      
      console.log('✅ Canal permitido! Enviando para Make e N8n...');
      console.log(`📤 Canal: ${canalNome}`);
      console.log(`🆔 ID: ${canalId}`);
      console.log(`👤 Usuário: ${usuarioNome}`);
      console.log(`💬 Mensagem: ${mensagem}`);
      
      // Enviar para ambos os webhooks simultaneamente
      const [makeResponse, n8nResponse] = await Promise.all([
        fetch(MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        }),
        fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        })
      ]);
      
      // Verificar o resultado de ambos
      const makeSuccess = makeResponse.ok;
      const n8nSuccess = n8nResponse.ok;
      
      console.log(`📊 Resultados do envio:`);
      console.log(`✅ Make: ${makeSuccess ? 'Sucesso' : 'Falhou'} (${makeResponse.status})`);
      console.log(`✅ N8n: ${n8nSuccess ? 'Sucesso' : 'Falhou'} (${n8nResponse.status})`);
      
      if (makeSuccess && n8nSuccess) {
        console.log('🎉 Enviado com sucesso para AMBOS os webhooks!');
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            success: true,
            message: 'Webhook processado e enviado para Make e N8n',
            canal: canalNome,
            canalId: canalId,
            usuario: usuarioNome,
            resultados: {
              make: 'Sucesso',
              n8n: 'Sucesso'
            }
          })
        };
      } else if (makeSuccess || n8nSuccess) {
        console.log('⚠️ Enviado parcialmente - alguns webhooks falharam');
        return {
          statusCode: 207, // Multi-Status
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            success: true,
            message: 'Webhook enviado parcialmente',
            canal: canalNome,
            resultados: {
              make: makeSuccess ? 'Sucesso' : 'Falhou',
              n8n: n8nSuccess ? 'Sucesso' : 'Falhou'
            }
          })
        };
      } else {
        console.error('❌ Falha ao enviar para ambos os webhooks');
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Erro ao enviar para ambos os webhooks',
            resultados: {
              make: `Falhou (${makeResponse.status})`,
              n8n: `Falhou (${n8nResponse.status})`
            }
          })
        };
      }
      
    } else {
      // Mensagem de outro canal - ignorar
      console.log('❌ Canal não permitido. Ignorando mensagem.');
      console.log(`📍 Canal recebido: ${canalNome}`);
      console.log(`📍 Canal permitido: ${CANAL_PERMITIDO}`);
      console.log(`👤 Usuário: ${usuarioNome}`);
      console.log(`💬 Mensagem: ${mensagem}`);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          success: true,
          message: 'Mensagem ignorada - canal não é o permitido',
          canalRecebido: canalNome,
          canalIdRecebido: canalId,
          canalPermitido: CANAL_PERMITIDO
        })
      };
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message
      })
    };
  }
};
