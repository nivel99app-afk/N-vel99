import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Lock, ArrowRight, Zap, Activity, Target, DollarSign, Brain, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store';
import { useEffect, useState } from 'react';

export default function Result() {
  const { atributos, user } = useAppStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!atributos) {
      navigate('/');
    }
  }, [atributos, navigate]);

  if (!atributos) return null;

  const score_geral = (atributos.energia + atributos.corpo + atributos.foco + atributos.financeiro + atributos.disciplina) / 5;
  const nivel = Math.round(score_geral * 20);

  let titulo = '';
  if (nivel <= 20) titulo = 'Sobrevivente';
  else if (nivel <= 40) titulo = 'Iniciante';
  else if (nivel <= 60) titulo = 'Evoluindo';
  else if (nivel <= 75) titulo = 'Consistente';
  else if (nivel <= 90) titulo = 'Alta Performance';
  else titulo = 'Lendário';

  let frase = '';
  if (nivel < 40) frase = 'Seu nível atual está abaixo do seu potencial.';
  else if (nivel <= 70) frase = 'Você está no caminho, mas ainda pode evoluir muito.';
  else frase = 'Você já está acima da média, mas ainda não é 99.';

  const attrsArray = [
    { name: 'Energia', value: atributos.energia, icon: Zap },
    { name: 'Corpo', value: atributos.corpo, icon: Activity },
    { name: 'Foco', value: atributos.foco, icon: Target },
    { name: 'Financeiro', value: atributos.financeiro, icon: DollarSign },
    { name: 'Disciplina', value: atributos.disciplina, icon: Brain },
  ];

  const lowestAttr = attrsArray.reduce((prev, curr) => prev.value < curr.value ? prev : curr);

  const getSuggestion = (attrName: string) => {
    switch (attrName) {
      case 'Energia': return 'Priorize 7-8 horas de sono e hidratação logo ao acordar para estabilizar seus níveis de energia.';
      case 'Corpo': return 'Comece com 15 minutos de exercícios diários e reduza o consumo de açúcares processados.';
      case 'Foco': return 'Pratique a técnica Pomodoro (25min focado, 5min descanso) e deixe o celular em outro cômodo.';
      case 'Financeiro': return 'Registre todos os seus gastos por 7 dias e defina um limite semanal para despesas não essenciais.';
      case 'Disciplina': return 'Crie uma rotina matinal simples e inegociável. A disciplina é construída com pequenas vitórias.';
      default: return 'Concentre-se em melhorar um pequeno hábito por dia.';
    }
  };

  const handleShare = () => {
    const text = `Descobri meu nível no NIVEL99. Estou no nível ${nivel} - ${titulo}. E você? ${window.location.origin}`;
    if (navigator.share) {
      navigator.share({
        title: 'Meu Nível 99',
        text,
        url: window.location.origin,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-3xl mx-auto py-6 bg-zinc-50 dark:bg-black transition-colors duration-300 relative">
      <header className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/quiz')}
          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-900 dark:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white dark:text-black px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2 z-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Link copiado para a área de transferência!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full text-center space-y-8 flex-1 flex flex-col justify-center"
      >
        <div className="space-y-2">
          <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">Seu Resultado</h2>
          <div className="text-7xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-400 dark:from-white dark:to-zinc-500">
            {nivel}
          </div>
          <div className="text-2xl font-medium text-green-500">{titulo}</div>
        </div>

        <p className="text-xl text-zinc-600 dark:text-zinc-300 max-w-lg mx-auto italic">
          "{frase}"
        </p>

        <div className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 text-left shadow-sm">
          <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-4">Seus Atributos</h3>
          
          <div className="space-y-4">
            {attrsArray.map((attr) => (
              <div key={attr.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <attr.icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    {attr.name}
                  </span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">{Math.round(attr.value * 20)}/100</span>
                </div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(attr.value / 5) * 100}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full rounded-full ${attr.name === lowestAttr.name ? 'bg-red-500' : 'bg-green-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-6 space-y-4">
            <p className="text-zinc-600 dark:text-zinc-400">
              <span className="text-red-500 font-medium">Diagnóstico:</span> Seu maior limitador hoje é <strong className="text-zinc-900 dark:text-white uppercase">{lowestAttr.name}</strong>.
            </p>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong className="block mb-1">Sugestão de Melhoria:</strong>
                {getSuggestion(lowestAttr.name)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 w-full max-w-md mx-auto">
          <button 
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors font-medium"
          >
            <Share2 className="w-5 h-5" />
            {copied ? 'Copiado!' : 'Compartilhar'}
          </button>

          {user?.premium ? (
            <Link 
              to="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-green-500 text-white dark:text-black hover:bg-green-600 dark:hover:bg-green-400 transition-colors font-medium shadow-[0_0_30px_rgba(34,197,94,0.2)]"
            >
              Ir para Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link 
              to="/login"
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-green-500 text-white dark:text-black hover:bg-green-600 dark:hover:bg-green-400 transition-colors font-medium shadow-[0_0_30px_rgba(34,197,94,0.2)]"
            >
              <Lock className="w-5 h-5" />
              Desbloquear Plano
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
