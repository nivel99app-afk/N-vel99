import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.js';
import { randomUUID } from 'crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/auth/register', (req, res) => {
    const { nome, email, senha, atributos, score_geral, nivel } = req.body;
    
    try {
      const userId = randomUUID();
      
      const insertUser = db.prepare(`
        INSERT INTO users (id, nome, email, senha, nivel, score_geral, premium)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `);
      
      insertUser.run(userId, nome, email, senha, nivel, score_geral);
      
      if (atributos) {
        const insertAtributos = db.prepare(`
          INSERT INTO atributos (user_id, energia, corpo, foco, financeiro, disciplina)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        insertAtributos.run(userId, atributos.energia, atributos.corpo, atributos.foco, atributos.financeiro, atributos.disciplina);
      }
      
      res.json({ success: true, user: { id: userId, nome, email, premium: false } });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Email já está em uso' });
      } else {
        res.status(500).json({ error: 'Erro ao criar conta' });
      }
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    
    try {
      const user = db.prepare('SELECT id, nome, email, premium, nivel, score_geral FROM users WHERE email = ? AND senha = ?').get(email, senha) as any;
      
      if (user) {
        const atributos = db.prepare('SELECT energia, corpo, foco, financeiro, disciplina FROM atributos WHERE user_id = ?').get(user.id);
        res.json({ success: true, user: { ...user, premium: Boolean(user.premium) }, atributos });
      } else {
        res.status(401).json({ error: 'Email ou senha inválidos' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  });

  app.post('/api/checkout', async (req, res) => {
    const { userId, simulate } = req.body;
    
    try {
      if (simulate || !process.env.MERCADOPAGO_ACCESS_TOKEN) {
        // Fallback to simulation if no token is provided or simulate is true
        db.prepare('UPDATE users SET premium = 1 WHERE id = ?').run(userId);
        return res.json({ success: true, simulated: true, message: 'Pagamento aprovado (Simulação)' });
      }

      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
      const preference = new Preference(client);
      
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

      const response = await preference.create({
        body: {
          items: [
            {
              id: 'premium_plan',
              title: 'Plano Premium NIVEL99',
              quantity: 1,
              unit_price: 9.90,
              currency_id: 'BRL',
            }
          ],
          external_reference: userId,
          back_urls: {
            success: `${appUrl}/api/checkout/success`,
            failure: `${appUrl}/dashboard`,
            pending: `${appUrl}/dashboard`,
          },
          auto_return: 'approved',
          notification_url: `${appUrl}/api/webhook/mercadopago`,
        }
      });

      res.json({ success: true, init_point: response.init_point });
    } catch (error) {
      console.error('Erro no Mercado Pago:', error);
      res.status(500).json({ error: 'Erro ao criar preferência de pagamento' });
    }
  });

  app.get('/api/checkout/success', (req, res) => {
    const { external_reference } = req.query;
    if (external_reference) {
      try {
        db.prepare('UPDATE users SET premium = 1 WHERE id = ?').run(external_reference);
      } catch (e) {
        console.error('Erro ao atualizar usuário após pagamento', e);
      }
    }
    res.redirect('/dashboard');
  });

  app.post('/api/webhook/mercadopago', async (req, res) => {
    try {
      const paymentId = req.body?.data?.id || req.query?.['data.id'];
      
      if (paymentId && process.env.MERCADOPAGO_ACCESS_TOKEN) {
        const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: paymentId });
        
        if (paymentData.status === 'approved' && paymentData.external_reference) {
          db.prepare('UPDATE users SET premium = 1 WHERE id = ?').run(paymentData.external_reference);
        }
      }
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Error');
    }
  });

  app.get('/api/user/:id', (req, res) => {
    const { id } = req.params;
    try {
      const user = db.prepare('SELECT id, nome, email, premium, nivel, score_geral FROM users WHERE id = ?').get(id) as any;
      if (user) {
        const atributos = db.prepare('SELECT energia, corpo, foco, financeiro, disciplina FROM atributos WHERE user_id = ?').get(id);
        res.json({ success: true, user: { ...user, premium: Boolean(user.premium) }, atributos });
      } else {
        res.status(404).json({ error: 'Usuário não encontrado' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  });

  app.get('/api/historico/:userId', (req, res) => {
    const { userId } = req.params;
    try {
      const historico = db.prepare('SELECT * FROM historico WHERE user_id = ? ORDER BY data ASC').all(userId);
      res.json({ success: true, historico });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
  });

  app.post('/api/historico', (req, res) => {
    const { userId, energia, corpo, foco, financeiro, disciplina, nivel } = req.body;
    try {
      const id = randomUUID();
      const data = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO historico (id, user_id, data, energia, corpo, foco, financeiro, disciplina, nivel)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, data, energia, corpo, foco, financeiro, disciplina, nivel);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao salvar histórico' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
