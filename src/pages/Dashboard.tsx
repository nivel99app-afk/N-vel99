import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Target, Zap, Activity, DollarSign, Brain, CheckCircle2, Lock, Info, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const { user, atributos, logout } = useAppStore();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [simAttr, setSimAttr] = useState<string>('energia');
  const [simValue, setSimValue] = useState<number>(10);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSimTooltip, setShowSimTooltip] = useState(false);
  const [simAnimating, setSimAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSimSuccess, setShowSimSuccess] = useState(false);

  useEffect(() => {
    if (!user || !atributos) {
      navigate('/login');
      return;
    }

    // Refresh user data to check if premium status changed (e.g. after MP checkout)
    fetch(`/api/user/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user.premium !== user.premium) {
          useAppStore.getState().setUser(data.user);
        }
      })
      .catch(console.error);

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/historico/${user.id}`);
        const data = await res.json();
        
        if (data.success && data.historico.length > 0) {
          setHistoryData(data.historico.map((h: any) => ({
            ...h,
            data: new Date(h.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          })));
        } else {
          // Generate placeholder data for the last 30 days
          const placeholder = [];
          const now = new Date();
          let currentNivel = Math.max(0, user.nivel - 15);
          
          for (let i = 30; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            
            // Simulate gradual growth
            if (i % 3 === 0 && currentNivel < user.nivel) {
              currentNivel += Math.floor(Math.random() * 3);
            }
            
            placeholder.push({
              data: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              nivel: i === 0 ? user.nivel : currentNivel,
              energia: Math.max(0, atributos.energia * 20 - Math.floor(Math.random() * 20)),
              corpo: Math.max(0, atributos.corpo * 20 - Math.floor(Math.random() * 20)),
              foco: Math.max(0, atributos.foco * 20 - Math.floor(Math.random() * 20)),
              financeiro: Math.max(0, atributos.financeiro * 20 - Math.floor(Math.random() * 20)),
              disciplina: Math.max(0, atributos.disciplina * 20 - Math.floor(Math.random() * 20)),
            });
          }
          // Optimize history data by taking only the last 30 entries if it's too large
          const optimizedData = placeholder.length > 30 ? placeholder.slice(-30) : placeholder;
          setHistoryData(optimizedData);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user, atributos, navigate]);

  if (!user || !atributos) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
        <p className="text-zinc-500 dark:text-zinc-400 font-mono animate-pulse">Carregando seus dados...</p>
      </div>
    );
  }

  const attrsArray = [
    { subject: 'Energia', A: Math.round(atributos.energia * 20), fullMark: 100 },
    { subject: 'Corpo', A: Math.round(atributos.corpo * 20), fullMark: 100 },
    { subject: 'Foco', A: Math.round(atributos.foco * 20), fullMark: 100 },
    { subject: 'Finanças', A: Math.round(atributos.financeiro * 20), fullMark: 100 },
    { subject: 'Disciplina', A: Math.round(atributos.disciplina * 20), fullMark: 100 },
  ];

  const lowestAttr = attrsArray.reduce((prev, curr) => prev.A < curr.A ? prev : curr);
  const score_geral = attrsArray.reduce((acc, curr) => acc + curr.A, 0) / 5;
  const nivel = Math.round(score_geral);
  
  const simulatedAtributos = { ...atributos, [simAttr]: Math.min(5, atributos[simAttr as keyof typeof atributos] + simValue / 20) };
  const simScoreGeral = (simulatedAtributos.energia + simulatedAtributos.corpo + simulatedAtributos.foco + simulatedAtributos.financeiro + simulatedAtributos.disciplina) / 5;
  const simNivel = Math.round(simScoreGeral * 20);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProgress = () => {
    setIsRegistering(true);
    setTimeout(() => {
      setProgress(prev => Math.min(prev + 1, 30));
      setIsRegistering(false);
    }, 1000);
  };

  const handleSimValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimValue(Number(e.target.value));
    setSimAnimating(true);
    setShowSimSuccess(true);
    setTimeout(() => setSimAnimating(false), 500);
    setTimeout(() => setShowSimSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto pb-24">
      <header className="flex items-center justify-between py-6 mb-8 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-xl border border-green-500/30">
            {user.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.nome}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">Nível {nivel}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-full transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm"
          >
            <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-6">Radar de Atributos</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={attrsArray}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Nível"
                    dataKey="A"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-white dark:bg-zinc-900/50 border ${user.premium ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-zinc-200 dark:border-zinc-800'} rounded-3xl p-6 relative overflow-hidden transition-colors duration-300`}
          >
            <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-4 flex items-center justify-between">
              <span>Simulador de Evolução</span>
              {!user.premium && <Lock className="w-4 h-4 text-green-500" />}
            </h2>
            
            <div className={`${!user.premium ? 'blur-sm opacity-50 pointer-events-none' : ''} space-y-4`}>
              <div>
                <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">Atributo</label>
                <select 
                  value={simAttr} 
                  onChange={(e) => setSimAttr(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-sm focus:outline-none focus:border-green-500 text-zinc-900 dark:text-white"
                >
                  <option value="energia">Energia</option>
                  <option value="corpo">Corpo</option>
                  <option value="foco">Foco</option>
                  <option value="financeiro">Finanças</option>
                  <option value="disciplina">Disciplina</option>
                </select>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-zinc-500 dark:text-zinc-400 block">Aumentar em (pontos)</label>
                  <button 
                    onMouseEnter={() => setShowSimTooltip(true)}
                    onMouseLeave={() => setShowSimTooltip(false)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <AnimatePresence>
                  {showSimTooltip && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 top-6 w-48 p-2 bg-zinc-800 text-white text-xs rounded-lg shadow-xl z-20 pointer-events-none"
                    >
                      O valor inserido em pontos (0-100) será convertido para o score do atributo (0-5) para calcular o novo nível.
                    </motion.div>
                  )}
                </AnimatePresence>

                <input 
                  type="number" 
                  min="1" max="100" 
                  value={simValue} 
                  onChange={handleSimValueChange}
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-sm focus:outline-none focus:border-green-500 text-zinc-900 dark:text-white"
                />
              </div>
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 flex items-center">
                  Novo Nível Projetado: 
                  <motion.strong 
                    animate={simAnimating ? { scale: [1, 1.2, 1], color: ['#22c55e', '#4ade80', '#22c55e'] } : {}}
                    className="text-2xl text-green-500 ml-2 inline-block"
                  >
                    {simNivel}
                  </motion.strong>
                  <AnimatePresence>
                    {showSimSuccess && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-green-500 ml-3 font-medium bg-green-500/10 px-2 py-1 rounded-md"
                      >
                        Simulado!
                      </motion.span>
                    )}
                  </AnimatePresence>
                </p>
              </div>
            </div>

            {!user.premium && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-black/50 backdrop-blur-[2px] z-10">
                <div className="text-center">
                  <Lock className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Premium Only</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-black border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-2">Diagnóstico Personalizado</h2>
            <h3 className="text-3xl font-bold mb-6">Missão de 30 Dias</h3>
            
            <div className="space-y-6">
              <p className="text-lg text-zinc-600 dark:text-zinc-300">
                Seu maior limitador hoje é <strong className="text-green-500 uppercase">{lowestAttr.subject}</strong>. 
                Focaremos nisso pelos próximos 30 dias para destravar seu próximo nível.
              </p>

              <div className="bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-mono text-zinc-500 dark:text-zinc-400">Progresso: {progress}/30 dias</span>
                  <span className="text-sm font-mono text-green-500">{Math.round((progress / 30) * 100)}%</span>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-3 mb-6 max-h-80 overflow-y-auto pr-2">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div 
                      key={i} 
                      initial={false}
                      animate={{ 
                        backgroundColor: i < progress ? '#22c55e' : '',
                        borderColor: i === progress ? '#22c55e' : '',
                        scale: i === progress - 1 && isRegistering ? [1, 1.05, 1] : 1,
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        i < progress 
                          ? 'bg-green-500 border-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                          : i === progress
                          ? 'bg-zinc-100 dark:bg-zinc-800/50 border-green-500/50 text-zinc-900 dark:text-white'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-1">Dia</span>
                      <span className="text-lg font-black">{i + 1}</span>
                      {i < progress && <CheckCircle2 className="w-4 h-4 mt-1 opacity-80" />}
                      {i === progress && <Target className="w-4 h-4 mt-1 text-green-500" />}
                      {i > progress && <Lock className="w-3 h-3 mt-1 opacity-30" />}
                    </motion.div>
                  ))}
                </div>

                <motion.button 
                  onClick={handleProgress}
                  disabled={progress >= 30 || isRegistering}
                  animate={{
                    boxShadow: isRegistering ? '0 0 20px rgba(34,197,94,0.5)' : '0 0 0px rgba(34,197,94,0)'
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-green-500 text-white dark:text-black font-medium hover:bg-green-600 dark:hover:bg-green-400 transition-colors disabled:opacity-50 disabled:hover:bg-green-500 relative overflow-hidden h-14"
                >
                  <AnimatePresence mode="wait">
                    {isRegistering ? (
                      <motion.div key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="flex items-center gap-2 absolute">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Registrado!</span>
                      </motion.div>
                    ) : progress >= 30 ? (
                      <motion.div key="done" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="flex items-center gap-2 absolute">
                        <Target className="w-5 h-5" />
                        <span>Missão Concluída!</span>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="flex items-center gap-2 absolute">
                        <Zap className="w-5 h-5" />
                        <span>Registrar Progresso Diário</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`bg-white dark:bg-zinc-900/50 border ${user.premium ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-zinc-200 dark:border-zinc-800'} rounded-3xl p-6 relative overflow-hidden transition-colors duration-300`}
      >
        <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-6">Histórico de Atributos (30 Dias)</h2>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!user.premium ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          {[
            { key: 'energia', name: 'Energia', color: '#f59e0b' },
            { key: 'corpo', name: 'Corpo', color: '#ef4444' },
            { key: 'foco', name: 'Foco', color: '#3b82f6' },
            { key: 'financeiro', name: 'Finanças', color: '#10b981' },
            { key: 'disciplina', name: 'Disciplina', color: '#8b5cf6' },
          ].map(attr => (
            <div key={attr.key} className="bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl h-48 flex flex-col">
              <h3 className="text-xs font-bold uppercase text-zinc-500 mb-2">{attr.name}</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <XAxis dataKey="data" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={attr.key} 
                      name={attr.name} 
                      stroke={attr.color} 
                      strokeWidth={3} 
                      dot={false} 
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {!user.premium && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-black/50 backdrop-blur-[2px] z-10">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl text-center max-w-sm shadow-xl">
              <motion.div
                whileHover={{ scale: 1.1 }}
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="inline-block cursor-pointer"
                onClick={() => navigate('/login')}
              >
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 mx-auto border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                  <Lock className="w-8 h-8 text-green-500" />
                </div>
              </motion.div>
              <h3 className="text-lg font-bold mb-2">Recurso Premium</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Acompanhe sua evolução diária e visualize o histórico detalhado de todos os seus atributos.
              </p>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-green-500 text-white dark:text-black font-medium rounded-xl hover:bg-green-600 dark:hover:bg-green-400 transition-colors"
              >
                Desbloquear Agora
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
