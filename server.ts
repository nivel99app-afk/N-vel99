import express from 'express';
import pool from './src/db.js';
import { randomUUID } from 'crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API Routes
app.post('/api/auth/register', async (req, res) => {
  const { nome, email, senha, atributos, score_geral, nivel } = req.body;
  
  try {
    const userId = randomUUID();
    
    await pool.query(`
      INSERT INTO users (id, nome, email, senha, nivel, score_geral, premium)
      VALUES ($1, $2, $3, $4, $5, $6, 0)
    `, [userId, nome, email, senha, nivel, score_geral]);
    
    if (atributos) {
      await pool.query(`
        INSERT INTO atributos (user_id, energia, corpo, foco, financeiro, disciplina)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, atributos.energia, atributos.corpo, atributos.foco, atributos.financeiro, atributos.disciplina]);
    }
    
    res.json({ success: true, user: { id: userId, nome, email, premium: false } });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation code
      res.status(400).json({ error: 'Email já está em uso' });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Erro ao criar conta' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  
  try {
    const userResult = await pool.query('SELECT id, nome, email, premium, nivel, score_geral FROM users WHERE email = $1 AND senha = $2', [email, senha]);
    const user = userResult.rows[0];
    
    if (user) {
      const atributosResult = await pool.query('SELECT energia, corpo, foco, financeiro, disciplina FROM atributos WHERE user_id = $1', [user.id]);
      const atributos = atributosResult.rows[0];
      res.json({ success: true, user: { ...user, premium: Boolean(user.premium) }, atributos });
    } else {
      res.status(401).json({ error: 'Email ou senha inválidos' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

app.post('/api/checkout', async (req, res) => {
  const { userId, simulate } = req.body;
  
  try {
    if (simulate || !process.env.MERCADOPAGO_ACCESS_TOKEN) {
      // Fallback to simulation if no token is provided or simulate is true
      await pool.query('UPDATE users SET premium = 1 WHERE id = $1', [userId]);
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

app.get('/api/checkout/success', async (req, res) => {
  const { external_reference } = req.query;
  if (external_reference) {
    try {
      await pool.query('UPDATE users SET premium = 1 WHERE id = $1', [external_reference]);
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
        await pool.query('UPDATE users SET premium = 1 WHERE id = $1', [paymentData.external_reference]);
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query('SELECT id, nome, email, premium, nivel, score_geral FROM users WHERE id = $1', [id]);
    const user = userResult.rows[0];
    
    if (user) {
      const atributosResult = await pool.query('SELECT energia, corpo, foco, financeiro, disciplina FROM atributos WHERE user_id = $1', [id]);
      const atributos = atributosResult.rows[0];
      res.json({ success: true, user: { ...user, premium: Boolean(user.premium) }, atributos });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

app.get('/api/historico/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const historicoResult = await pool.query('SELECT * FROM historico WHERE user_id = $1 ORDER BY data ASC', [userId]);
    res.json({ success: true, historico: historicoResult.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

app.post('/api/historico', async (req, res) => {
  const { userId, energia, corpo, foco, financeiro, disciplina, nivel } = req.body;
  try {
    const id = randomUUID();
    const data = new Date().toISOString().split('T')[0];
    await pool.query(`
      INSERT INTO historico (id, user_id, data, energia, corpo, foco, financeiro, disciplina, nivel)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [id, userId, data, energia, corpo, foco, financeiro, disciplina, nivel]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar histórico' });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }
}

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  setupVite().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default app;
