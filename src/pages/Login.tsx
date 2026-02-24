import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Lock, Mail, User, Key, Loader2, Zap } from 'lucide-react';
import { useAppStore } from '../store';

export default function Login() {
  const [isLogin, setIsLogin] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeError, setNomeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [senhaError, setSenhaError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { atributos, setUser, user, logout } = useAppStore();

  const validateNome = (value: string) => {
    const isValid = /^[a-zA-Z0-9\s]+$/.test(value) && value.trim().length > 0;
    setNomeError(isValid || !value ? '' : 'Nome inválido (apenas letras e números)');
    return isValid;
  };

  const validateEmail = (value: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setEmailError(isValid || !value ? '' : 'Email inválido');
    return isValid;
  };

  const validateSenha = (value: string) => {
    const isValid = value.length >= 6;
    setSenhaError(isValid || !value ? '' : 'A senha deve ter pelo menos 6 caracteres');
    return isValid;
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNome(val);
    validateNome(val);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    validateEmail(val);
  };

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSenha(val);
    validateSenha(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const isEmailValid = validateEmail(email);
    const isSenhaValid = validateSenha(senha);
    const isNomeValid = isLogin || validateNome(nome);
    
    if (!isEmailValid || !isSenhaValid || !isNomeValid) {
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const score_geral = atributos ? (atributos.energia + atributos.corpo + atributos.foco + atributos.financeiro + atributos.disciplina) / 5 : 0;
      const nivel = Math.round(score_geral * 20);

      const payload = isLogin 
        ? { email, senha }
        : { nome, email, senha, atributos, score_geral, nivel };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        if (data.atributos) {
          useAppStore.getState().setAtributos(data.atributos);
        }
        
        if (!data.user.premium) {
          handleCheckout(data.user.id);
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (userId: string, simulate: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, simulate })
      });
      
      const data = await res.json();
      if (data.success) {
        if (data.simulated) {
          setUser({ ...useAppStore.getState().user!, premium: true });
          navigate('/dashboard');
        } else if (data.init_point) {
          window.location.href = data.init_point;
        }
      } else {
        setError(data.error || 'Erro ao processar pagamento.');
      }
    } catch (err) {
      setError('Erro ao processar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  if (user && !user.premium) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-black relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,0,0.05)_0%,transparent_50%)] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 z-10 backdrop-blur-sm shadow-xl text-center"
        >
          <Lock className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-white">Desbloquear Premium</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            Olá, {user.nome}! Você já possui uma conta, mas precisa do plano Premium para acessar o Dashboard completo.
          </p>
          <button 
            onClick={() => handleCheckout(user.id, true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-green-500 text-white dark:text-black font-medium hover:bg-green-600 dark:hover:bg-green-400 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Processando...' : 'Fazer Upgrade Agora (Simular)'}
          </button>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <button onClick={logout} className="mt-6 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Sair da conta
          </button>
        </motion.div>
      </div>
    );
  }

  if (user && user.premium) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-black relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,0,0.05)_0%,transparent_50%)] pointer-events-none" />
      
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50/90 dark:bg-black/90 backdrop-blur-sm"
          >
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
            <p className="text-green-500 font-mono animate-pulse tracking-widest uppercase">Processando...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 z-10 backdrop-blur-sm shadow-xl"
      >
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 p-2 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-full transition-colors inline-block"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            {isLogin ? 'Bem-vindo de volta' : 'Desbloquear Plano'}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            {isLogin ? 'Acesse seu dashboard premium.' : 'Crie sua conta para acessar o plano personalizado por R$9,90.'}
          </p>
        </div>

        {isLogin && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/20 rounded-full text-green-500 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Evolua mais rápido</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                  Desbloqueie o histórico detalhado, simulador de atributos e missões diárias com o plano Premium.
                </p>
                <button 
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors flex items-center gap-1"
                >
                  Descubra os Benefícios Premium <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  required 
                  value={nome}
                  onChange={handleNomeChange}
                  className={`w-full bg-white dark:bg-black border ${nomeError ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-green-500'} rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-colors`}
                  placeholder="Seu nome"
                />
              </div>
              {nomeError && <p className="text-red-500 text-xs mt-1">{nomeError}</p>}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={handleEmailChange}
                className={`w-full bg-white dark:bg-black border ${emailError ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-green-500'} rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-colors`}
                placeholder="seu@email.com"
              />
            </div>
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-500">Senha</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="password" 
                required 
                value={senha}
                onChange={handleSenhaChange}
                className={`w-full bg-white dark:bg-black border ${senhaError ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:border-green-500'} rounded-xl py-3 pl-10 pr-4 focus:outline-none transition-colors`}
                placeholder="••••••••"
              />
            </div>
            {senhaError && <p className="text-red-500 text-xs mt-1">{senhaError}</p>}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button 
            type="submit" 
            disabled={loading || !!emailError || !!senhaError || (!isLogin && !!nomeError) || !email || !senha || (!isLogin && !nome)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-green-500 text-black font-medium hover:bg-green-400 transition-colors disabled:opacity-50 mt-8"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Entrar' : 'Pagar R$9,90 e Desbloquear'}
                {!isLogin && <Lock className="w-4 h-4" />}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setEmailError('');
              setSenhaError('');
              setNomeError('');
            }}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Fazer login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
