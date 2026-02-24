import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Info } from 'lucide-react';
import { useAppStore } from '../store';

const QUESTIONS = [
  { id: 1, attr: 'energia', text: 'Como você avalia sua disposição ao acordar?', hint: 'A energia matinal é um forte indicador da qualidade do seu descanso e metabolismo.' },
  { id: 2, attr: 'energia', text: 'Com que frequência você se sente cansado durante o dia? (5 = Raramente)', hint: 'Picos e quedas de energia podem indicar problemas na alimentação ou sono.' },
  { id: 3, attr: 'energia', text: 'Como é a qualidade do seu sono?', hint: 'O sono profundo é essencial para a recuperação física e mental.' },
  { id: 4, attr: 'corpo', text: 'Com que frequência você pratica exercícios físicos?', hint: 'A consistência nos exercícios é mais importante que a intensidade esporádica.' },
  { id: 5, attr: 'corpo', text: 'Como você avalia sua alimentação diária?', hint: 'A nutrição é o combustível primário para todos os seus outros atributos.' },
  { id: 6, attr: 'corpo', text: 'Como você se sente em relação à sua saúde física atual?', hint: 'A percepção do próprio corpo afeta diretamente a autoconfiança.' },
  { id: 7, attr: 'foco', text: 'Quão fácil é para você se concentrar em uma única tarefa?', hint: 'O foco profundo (deep work) é a habilidade mais valiosa na economia atual.' },
  { id: 8, attr: 'foco', text: 'Com que frequência você se distrai com redes sociais ou celular? (5 = Raramente)', hint: 'As distrações digitais fragmentam a atenção e reduzem a produtividade.' },
  { id: 9, attr: 'foco', text: 'Como você avalia sua capacidade de terminar o que começa?', hint: 'A conclusão de tarefas libera dopamina e reforça o hábito do foco.' },
  { id: 10, attr: 'financeiro', text: 'Como você avalia seu controle sobre seus gastos mensais?', hint: 'O controle financeiro reduz o estresse e permite planejamento de longo prazo.' },
  { id: 11, attr: 'financeiro', text: 'Você possui o hábito de poupar ou investir parte do que ganha?', hint: 'Pagar a si mesmo primeiro é a regra de ouro da construção de riqueza.' },
  { id: 12, attr: 'financeiro', text: 'Quão seguro você se sente em relação ao seu futuro financeiro?', hint: 'A segurança financeira proporciona liberdade de escolha.' },
  { id: 13, attr: 'disciplina', text: 'Com que frequência você cumpre as metas que define para si mesmo?', hint: 'A disciplina é fazer o que precisa ser feito, mesmo sem vontade.' },
  { id: 14, attr: 'disciplina', text: 'Como você lida com a procrastinação no seu dia a dia? (5 = Lido muito bem)', hint: 'A procrastinação geralmente é um problema de regulação emocional, não de gestão de tempo.' },
  { id: 15, attr: 'disciplina', text: 'Quão consistente você é na manutenção de bons hábitos?', hint: 'Pequenos hábitos consistentes geram resultados exponenciais ao longo do tempo.' },
];

const STORAGE_KEY = 'nivel99_quiz_progress';

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [direction, setDirection] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const navigate = useNavigate();
  const setAtributos = useAppStore((state) => state.setAtributos);

  // Developer mode shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setAtributos({
          energia: 3.5,
          corpo: 2.8,
          foco: 4.2,
          financeiro: 3.0,
          disciplina: 2.5
        });
        navigate('/result');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, setAtributos]);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { savedAnswers, savedQuestion } = JSON.parse(saved);
        setAnswers(savedAnswers);
        setCurrentQuestion(savedQuestion);
      } catch (e) {
        console.error('Failed to load quiz progress', e);
      }
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      savedAnswers: answers,
      savedQuestion: currentQuestion
    }));
  }, [answers, currentQuestion]);

  const handleAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [QUESTIONS[currentQuestion].id]: value }));
    setDirection(1);
    setShowHint(false);
    
    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion((prev) => prev + 1), 400);
    } else {
      setTimeout(() => calculateResults(), 400);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setDirection(-1);
      setShowHint(false);
      setCurrentQuestion(prev => prev - 1);
    } else {
      navigate('/');
    }
  };

  const calculateResults = () => {
    const attrs = { energia: 0, corpo: 0, foco: 0, financeiro: 0, disciplina: 0 };
    const counts = { energia: 0, corpo: 0, foco: 0, financeiro: 0, disciplina: 0 };

    QUESTIONS.forEach((q) => {
      const val = answers[q.id] || 3;
      attrs[q.attr as keyof typeof attrs] += val;
      counts[q.attr as keyof typeof counts] += 1;
    });

    const finalAttrs = {
      energia: attrs.energia / counts.energia,
      corpo: attrs.corpo / counts.corpo,
      foco: attrs.foco / counts.foco,
      financeiro: attrs.financeiro / counts.financeiro,
      disciplina: attrs.disciplina / counts.disciplina,
    };

    setAtributos(finalAttrs);
    localStorage.removeItem(STORAGE_KEY); // Clear progress on completion
    navigate('/result');
  };

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  
  // Calculate completion percentage based on answered questions
  const answeredCount = Object.keys(answers).length;
  const completionPercentage = Math.round((answeredCount / QUESTIONS.length) * 100);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    })
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-2xl mx-auto bg-zinc-50 dark:bg-black transition-colors duration-300">
      <header className="flex items-center justify-between py-6">
        <button 
          onClick={handleBack}
          className="p-2 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-full transition-colors text-zinc-900 dark:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
            Pergunta {currentQuestion + 1} de {QUESTIONS.length}
          </div>
          
          {/* Circular Progress Indicator */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-zinc-200 dark:text-zinc-800"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                className="text-green-500"
                strokeWidth="3"
                strokeDasharray={`${completionPercentage}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${completionPercentage}, 100` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-zinc-900 dark:text-white">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </header>

      <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden mb-12">
        <motion.div 
          className="h-full bg-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <main className="flex-1 flex flex-col justify-center pb-20 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-12 w-full"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-green-500">
                  {question.attr}
                </span>
                <button 
                  onClick={() => setShowHint(!showHint)}
                  className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                  title="Dica"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-3xl md:text-4xl font-medium leading-tight text-zinc-900 dark:text-white">
                {question.text}
              </h2>
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm border border-blue-200 dark:border-blue-800/50"
                  >
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>{question.hint}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((val) => {
                const isSelected = answers[question.id] === val;
                return (
                  <motion.button
                    key={val}
                    onClick={() => handleAnswer(val)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    animate={isSelected ? {
                      scale: [1, 1.05, 1],
                      boxShadow: ["0px 0px 0px rgba(34,197,94,0)", "0px 0px 20px rgba(34,197,94,0.4)", "0px 0px 10px rgba(34,197,94,0.2)"]
                    } : {}}
                    transition={{ duration: 0.3 }}
                    className={`
                      py-4 px-6 rounded-2xl border transition-colors duration-200 flex flex-col items-center justify-center gap-2 relative overflow-hidden
                      ${isSelected 
                        ? 'bg-green-500/20 border-green-500 text-green-600 dark:text-green-400' 
                        : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }
                    `}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="selected-bg"
                        className="absolute inset-0 bg-green-500/10"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="text-2xl font-mono relative z-10">{val}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-50 relative z-10">
                      {val === 1 ? 'Péssimo' : val === 5 ? 'Excelente' : 'Regular'}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
