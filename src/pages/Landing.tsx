import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity, Target, Zap, DollarSign, Brain } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center space-y-8 z-10"
      >
        <div className="inline-flex items-center justify-center space-x-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 mb-4">
          <Zap className="w-4 h-4 text-green-500" />
          <span className="text-xs font-mono uppercase tracking-widest text-green-500">Nivel99</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1] text-zinc-900 dark:text-white">
          Você realmente está no nível que <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">poderia estar?</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
          Responda 15 perguntas e descubra seu nível real. Avalie sua Energia, Corpo, Foco, Financeiro e Disciplina.
        </p>
        
        <div className="pt-8">
          <Link 
            to="/quiz" 
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white dark:text-black bg-green-500 rounded-full hover:bg-green-600 dark:hover:bg-green-400 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
          >
            Descobrir Meu Nível
          </Link>
        </div>
        
        <div className="grid grid-cols-5 gap-4 pt-16 max-w-md mx-auto opacity-50 text-zinc-900 dark:text-white">
          <div className="flex flex-col items-center gap-2"><Zap className="w-6 h-6" /><span className="text-[10px] uppercase tracking-wider">Energia</span></div>
          <div className="flex flex-col items-center gap-2"><Activity className="w-6 h-6" /><span className="text-[10px] uppercase tracking-wider">Corpo</span></div>
          <div className="flex flex-col items-center gap-2"><Target className="w-6 h-6" /><span className="text-[10px] uppercase tracking-wider">Foco</span></div>
          <div className="flex flex-col items-center gap-2"><DollarSign className="w-6 h-6" /><span className="text-[10px] uppercase tracking-wider">Finanças</span></div>
          <div className="flex flex-col items-center gap-2"><Brain className="w-6 h-6" /><span className="text-[10px] uppercase tracking-wider">Disciplina</span></div>
        </div>
      </motion.div>
    </div>
  );
}
