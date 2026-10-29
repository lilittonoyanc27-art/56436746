import React, { useState, useEffect, useRef } from 'react';
import { 
  QUESTIONS, 
  TARGET_WORD, 
  TARGET_WORD_MEANING, 
  Question 
} from './questions.ts';
import { sound } from './sound.ts';
import { fireConfetti } from './confetti.ts';
import { 
  Trophy, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Flame, 
  HelpCircle, 
  KeyRound, 
  Disc,
  Languages
} from 'lucide-react';

const ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

const WHEEL_SECTORS = [
  { label: '+100', value: 100, color: '#3b82f6', text: '#ffffff' },
  { label: '⚽ GOL +1500', value: 1500, color: '#10b981', text: '#ffffff' },
  { label: '+250', value: 250, color: '#f59e0b', text: '#ffffff' },
  { label: '🎯 TÁCTICA +800', value: 800, color: '#8b5cf6', text: '#ffffff' },
  { label: '+500', value: 500, color: '#ec4899', text: '#ffffff' },
  { label: '🎁 PREMIO +1200', value: 1200, color: '#06b6d4', text: '#ffffff' },
  { label: '+750', value: 750, color: '#eab308', text: '#000000' },
  { label: 'x2 DOBLE', value: 2000, color: '#ef4444', text: '#ffffff' },
];

export default function App() {
  // Game states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  
  // Armenian translations toggle per element (click-to-reveal)
  const [revealedArmenianQuestions, setRevealedArmenianQuestions] = useState<Record<number, boolean>>({});
  const [revealedArmenianOptions, setRevealedArmenianOptions] = useState<Record<string, boolean>>({});
  const [autoShowArmenian, setAutoShowArmenian] = useState<boolean>(false);

  // Pole Chudes word guessing state
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [letterTurnsAvailable, setLetterTurnsAvailable] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ textEs: string; textHy: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Wheel state
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [lastWheelWin, setLastWheelWin] = useState<string | null>(null);

  // Direct word guess modal
  const [showWordGuessModal, setShowWordGuessModal] = useState<boolean>(false);
  const [inputWordGuess, setInputWordGuess] = useState<string>('');

  // Victory state
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [showQuestionMap, setShowQuestionMap] = useState<boolean>(false);

  const currentQ: Question = QUESTIONS[currentQuestionIndex];
  const targetLetters = TARGET_WORD.split('');

  // Check if target word is solved
  const isWordSolved = targetLetters.every(char => guessedLetters.includes(char));

  useEffect(() => {
    if (isWordSolved && !hasWon) {
      setHasWon(true);
      sound.playVictory();
      fireConfetti(5000);
    }
  }, [isWordSolved, hasWon]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  // Toggle Armenian translation for question
  const toggleQuestionTranslation = (qId: number) => {
    setRevealedArmenianQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Toggle Armenian translation for option
  const toggleOptionTranslation = (qId: number, optKey: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const key = `${qId}-${optKey}`;
    setRevealedArmenianOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle answering a football question
  const handleSelectOption = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (selectedAnswers[currentQ.id]) return; // already answered

    const isCorrect = optionKey === currentQ.correctAnswer;
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: optionKey }));

    if (isCorrect) {
      sound.playCorrect();
      setScore(prev => prev + 500);
      setLetterTurnsAvailable(prev => prev + 1);
      setStatusMessage({
        textEs: '¡Respuesta correcta! Has ganado el turno para elegir una letra del alfabeto.',
        textHy: 'Ճիշտ պատասխան: Դուք շահեցիք այբուբենից տառ ընտրելու իրավունք:',
        type: 'success'
      });
    } else {
      sound.playWrong();
      setStatusMessage({
        textEs: `Incorrecto. La respuesta correcta era la (${currentQ.correctAnswer}). ¡Intenta con otra pregunta!`,
        textHy: `Սխալ է: Ճիշտ պատասխանն էր (${currentQ.correctAnswer})-ը: Փորձեք հաջորդ հարցը:`,
        type: 'error'
      });
    }
  };

  // Handle letter pick from alphabet
  const handlePickLetter = (letter: string) => {
    if (guessedLetters.includes(letter)) return;
    if (letterTurnsAvailable <= 0) {
      setStatusMessage({
        textEs: '¡Responde correctamente a una pregunta de fútbol para desbloquear la elección de letra!',
        textHy: 'Ճիշտ պատասխանեք ֆուտբոլային հարցին՝ տառ ընտրելու հնարավորություն ստանալու համար:',
        type: 'info'
      });
      return;
    }

    setGuessedLetters(prev => [...prev, letter]);
    setLetterTurnsAvailable(prev => Math.max(0, prev - 1));

    if (TARGET_WORD.includes(letter)) {
      sound.playLetterReveal();
      fireConfetti(2000);
      setScore(prev => prev + 1000);
      setStatusMessage({
        textEs: `¡Excelente! La letra "${letter}" está en la palabra secreta.`,
        textHy: `Հիանալի է: «${letter}» տառը գտնվում է գաղտնի բառի մեջ:`,
        type: 'success'
      });
    } else {
      sound.playWrong();
      setStatusMessage({
        textEs: `La letra "${letter}" no está en la palabra. ¡Responde a más preguntas para seguir jugando!`,
        textHy: `«${letter}» տառը չկա այս բառում: Պատասխանեք այլ հարցերի՝ նոր տառ ընտրելու համար:`,
        type: 'error'
      });
    }
  };

  // Spin the Pole Chudes wheel / drum
  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setLastWheelWin(null);

    const extraSpins = 4 + Math.floor(Math.random() * 3);
    const randomSectorIndex = Math.floor(Math.random() * WHEEL_SECTORS.length);
    const sectorAngle = 360 / WHEEL_SECTORS.length;
    const targetAngle = extraSpins * 360 + randomSectorIndex * sectorAngle + (sectorAngle / 2);

    const newRotation = wheelRotation + targetAngle;
    setWheelRotation(newRotation);

    // Audio ticking simulation
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      sound.playTick();
      if (ticks > 25) clearInterval(interval);
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);
      const landed = WHEEL_SECTORS[WHEEL_SECTORS.length - 1 - (randomSectorIndex % WHEEL_SECTORS.length)];
      setScore(prev => prev + landed.value);
      setLastWheelWin(landed.label);
      sound.playCorrect();
    }, 3200);
  };

  // Direct word guess
  const handleDirectWordGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGuess = inputWordGuess.trim().toUpperCase();
    if (!cleanGuess) return;

    if (cleanGuess === TARGET_WORD) {
      setGuessedLetters(TARGET_WORD.split(''));
      setShowWordGuessModal(false);
      sound.playVictory();
      fireConfetti(5000);
      setHasWon(true);
      setScore(prev => prev + 5000);
      setStatusMessage({
        textEs: `¡FELICITACIONES! ¡Has adivinado la palabra correcta: ${TARGET_WORD}!`,
        textHy: `ՇՆՈՐՀԱՎՈՐՈՒՄ ԵՆՔ: Դուք գուշակեցիք ճիշտ բառը՝ ${TARGET_WORD}:`,
        type: 'success'
      });
    } else {
      sound.playWrong();
      setStatusMessage({
        textEs: `"${cleanGuess}" no es la palabra correcta. ¡Sigue participando!`,
        textHy: `«${cleanGuess}»-ը ճիշտ բառը չէ: Շարունակեք խաղը:`,
        type: 'error'
      });
      setShowWordGuessModal(false);
      setInputWordGuess('');
    }
  };

  const handleRestart = () => {
    setGuessedLetters([]);
    setLetterTurnsAvailable(0);
    setSelectedAnswers({});
    setScore(0);
    setHasWon(false);
    setCurrentQuestionIndex(0);
    setStatusMessage(null);
    setLastWheelWin(null);
  };

  // Correct answered count
  const correctCount = Object.entries(selectedAnswers).filter(([qId, ans]) => {
    const q = QUESTIONS.find(item => item.id === Number(qId));
    return q && q.correctAnswer === ans;
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/20 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
              <span className="text-xl">⚽</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                  ПОЛЕ ЧУДЕС
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Հրաշքների Դաշտ
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Fútbol Español & Armenio • 30 Preguntas B1–B2
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Score */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-amber-500/30">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold leading-none">Очки</div>
                <div className="text-sm font-bold text-amber-300 font-mono">{score}</div>
              </div>
            </div>

            {/* Letter turns available */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              letterTurnsAvailable > 0 
                ? 'bg-emerald-950/80 border-emerald-500/60 shadow-lg shadow-emerald-900/30 animate-pulse' 
                : 'bg-slate-800 border-slate-700'
            }`}>
              <KeyRound className={`w-4 h-4 ${letterTurnsAvailable > 0 ? 'text-emerald-400' : 'text-slate-400'}`} />
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold leading-none">Ход выбора</div>
                <div className={`text-sm font-bold font-mono ${letterTurnsAvailable > 0 ? 'text-emerald-300' : 'text-slate-300'}`}>
                  {letterTurnsAvailable}
                </div>
              </div>
            </div>

            {/* Translation mode toggle */}
            <button
              onClick={() => setAutoShowArmenian(!autoShowArmenian)}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-medium ${
                autoShowArmenian 
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Показывать всегда армянский перевод"
            >
              <Languages className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">🇦🇲 {autoShowArmenian ? 'Всегда показ' : 'По клику'}</span>
            </button>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Reset */}
            <button
              onClick={handleRestart}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 hover:bg-slate-700 transition"
              title="Начать заново"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Banner notification / Feedback toast */}
        {statusMessage && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg transition-all ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200' 
              : statusMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/60 text-rose-200'
              : 'bg-blue-950/80 border-blue-500/60 text-blue-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm sm:text-base">{statusMessage.textEs}</p>
              <p className="text-xs sm:text-sm opacity-80 mt-0.5 font-sans">{statusMessage.textHy}</p>
            </div>
            <button 
              onClick={() => setStatusMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* POLE CHUDES MAIN BOARD SECTION */}
        <section className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 rounded-3xl border-2 border-amber-500/40 shadow-2xl relative overflow-hidden">
          {/* Decorative stadium ambient lighting */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Board Header */}
            <div className="flex flex-wrap items-center justify-between w-full mb-6 pb-4 border-b border-amber-500/20 gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                  Табло «Поле Чудес» • Таинственное слово (6 букв)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWordGuessModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Назвать слово целиком! / Adivinar
                </button>
              </div>
            </div>

            {/* The 6 Letters Board Tiles */}
            <div className="grid grid-cols-6 gap-2 sm:gap-4 md:gap-6 my-4 w-full max-w-2xl px-2">
              {targetLetters.map((char, index) => {
                const isRevealed = guessedLetters.includes(char) || hasWon;
                return (
                  <div
                    key={index}
                    className="relative aspect-[3/4] perspective-1000 select-none"
                  >
                    <div
                      className={`w-full h-full duration-700 transform-style-3d transition-transform ${
                        isRevealed ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* FRONT (Closed state - classic Pole Chudes gold diamond pattern) */}
                      <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-b from-amber-700 via-amber-900 to-slate-950 border-2 border-amber-400/60 shadow-lg flex flex-col items-center justify-center backface-hidden cursor-pointer hover:border-amber-300 transition-colors group">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 border border-amber-400/40 rotate-45 flex items-center justify-center bg-amber-500/10 group-hover:scale-110 transition-transform">
                          <span className="text-amber-300 font-mono text-[10px] sm:text-xs -rotate-45 font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-400/70 mt-2 font-mono">?</span>
                      </div>

                      {/* BACK (Revealed state - golden bright letter) */}
                      <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 text-slate-950 border-2 border-yellow-200 shadow-xl flex items-center justify-center rotate-y-180 backface-hidden gold-glow">
                        <span className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight font-serif drop-shadow-md">
                          {char}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Board progress & Instruction */}
            <div className="mt-4 text-center">
              <p className="text-xs sm:text-sm text-slate-300">
                {letterTurnsAvailable > 0 ? (
                  <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1.5 animate-bounce">
                    <KeyRound className="w-4 h-4" />
                    У вас есть ход! Выберите любую букву из алфавита ниже!
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Отвечайте правильно на футбольные вопросы, чтобы открыть возможность выбора буквы!
                  </span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* INTERACTIVE ALPHABET PICKER */}
        <section className={`p-5 rounded-2xl border transition-all ${
          letterTurnsAvailable > 0 
            ? 'bg-slate-900/90 border-emerald-500/60 shadow-xl shadow-emerald-950/40' 
            : 'bg-slate-900/60 border-slate-800 opacity-90'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <KeyRound className={`w-4 h-4 ${letterTurnsAvailable > 0 ? 'text-emerald-400' : 'text-slate-400'}`} />
              <h2 className="text-sm font-bold text-slate-200">
                Алфавит для хода (Selecciona una letra)
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              Доступно ходов выбора: <span className="font-bold text-amber-400 font-mono">{letterTurnsAvailable}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
            {ALPHABET.map(letter => {
              const isGuessed = guessedLetters.includes(letter);
              const isInTarget = TARGET_WORD.includes(letter);
              const isEnabled = letterTurnsAvailable > 0 && !isGuessed;

              let btnStyle = 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700';
              if (isGuessed) {
                if (isInTarget) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-400 font-black shadow-md shadow-emerald-900/50';
                } else {
                  btnStyle = 'bg-slate-800/40 text-slate-600 border-slate-800 line-through cursor-not-allowed';
                }
              } else if (isEnabled) {
                btnStyle = 'bg-gradient-to-b from-amber-500 to-yellow-600 text-slate-950 border-amber-300 font-bold hover:brightness-110 active:scale-95 shadow-md shadow-amber-950/40 cursor-pointer animate-pulse';
              }

              return (
                <button
                  key={letter}
                  onClick={() => handlePickLetter(letter)}
                  disabled={isGuessed || letterTurnsAvailable <= 0}
                  className={`w-9 h-10 sm:w-11 sm:h-12 rounded-lg border text-sm sm:text-base transition-all flex items-center justify-center font-mono ${btnStyle}`}
                  title={
                    isGuessed
                      ? (isInTarget ? `Буква ${letter} отгадана!` : `Буквы ${letter} нет в слове`)
                      : (letterTurnsAvailable > 0 ? `Выбрать букву ${letter}` : 'Ответьте на вопрос для хода')
                  }
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2-COLUMN LAYOUT: FOOTBALL QUESTION + POLE CHUDES DRUM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: FOOTBALL QUESTIONS (30 Qs) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Question card container */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl relative">
              
              {/* Question metadata bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    currentQ.part === 1 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : currentQ.part === 2 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {currentQ.partTitleEs}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    Pregunta {currentQ.id} / 30
                  </span>
                  <button
                    onClick={() => setShowQuestionMap(!showQuestionMap)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    Все вопросы (30)
                  </button>
                </div>
              </div>

              {/* Question Text with Click-to-Translate to Armenian */}
              <div 
                onClick={() => toggleQuestionTranslation(currentQ.id)}
                className="cursor-pointer group p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-400/50 hover:bg-slate-800/80 transition mb-5"
                title="Нажмите на текст, чтобы открыть/закрыть перевод на армянский"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                    <span>🇪🇸 Español</span>
                    <span className="text-slate-500 text-[10px]">
                      (Кликните для перевода на 🇦🇲 армянский)
                    </span>
                  </div>
                  <Globe className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition" />
                </div>

                <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                  {currentQ.questionEs}
                </p>

                {/* Armenian translation (visible if autoShowArmenian or clicked) */}
                {(autoShowArmenian || revealedArmenianQuestions[currentQ.id]) && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 text-amber-200/90 text-sm sm:text-base leading-relaxed bg-amber-950/20 p-2.5 rounded-lg">
                    <div className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider mb-1">
                      🇦🇲 Հայերեն թարգմանություն:
                    </div>
                    {currentQ.questionHy}
                  </div>
                )}
              </div>

              {/* Options (A, B, C, D) */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Выберите правильный вариант:</span>
                  <span className="text-slate-500 font-normal">Нажмите на значок 🇦🇲 для перевода варианта</span>
                </div>

                {currentQ.options.map(option => {
                  const isSelected = selectedAnswers[currentQ.id] === option.key;
                  const isAnswered = selectedAnswers[currentQ.id] !== undefined;
                  const isCorrect = option.key === currentQ.correctAnswer;
                  const optTransKey = `${currentQ.id}-${option.key}`;
                  const showOptArm = autoShowArmenian || revealedArmenianOptions[optTransKey];

                  let optionCardStyle = 'bg-slate-800/70 border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-200';
                  if (isAnswered) {
                    if (isCorrect) {
                      optionCardStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-100 shadow-md shadow-emerald-950/50';
                    } else if (isSelected) {
                      optionCardStyle = 'bg-rose-950/70 border-rose-500 text-rose-100';
                    } else {
                      optionCardStyle = 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <div
                      key={option.key}
                      onClick={() => !isAnswered && handleSelectOption(option.key)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all relative flex flex-col ${
                        !isAnswered ? 'cursor-pointer active:scale-[0.99]' : ''
                      } ${optionCardStyle}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected && isCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : isSelected && !isCorrect
                              ? 'bg-rose-500 text-white'
                              : isAnswered && isCorrect
                              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {option.key}
                          </span>
                          
                          <div>
                            <span className="text-sm sm:text-base font-normal">
                              {option.es}
                            </span>
                          </div>
                        </div>

                        {/* Translation button for this option */}
                        <button
                          type="button"
                          onClick={(e) => toggleOptionTranslation(currentQ.id, option.key, e)}
                          className="px-2 py-1 rounded bg-slate-700/60 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs shrink-0 transition flex items-center gap-1 border border-slate-600/50"
                          title="Показать армянский перевод варианта"
                        >
                          <span className="text-[10px]">🇦🇲</span>
                          <span className="text-[11px] font-sans">Թարգմ.</span>
                        </button>
                      </div>

                      {/* Armenian option text */}
                      {showOptArm && (
                        <div className="mt-2 ml-10 pt-2 border-t border-slate-700/50 text-xs sm:text-sm text-amber-200/90 font-sans">
                          {option.hy}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800 gap-2">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Предыдущий
                </button>

                <span className="text-xs text-slate-400">
                  Верно: <strong className="text-emerald-400">{correctCount}</strong> / 30
                </span>

                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(QUESTIONS.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === QUESTIONS.length - 1}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition"
                >
                  Следующий
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Questions Quick Grid Drawer */}
              {showQuestionMap && (
                <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-300">
                      Все 30 вопросов (быстрый переход):
                    </span>
                    <button
                      onClick={() => setShowQuestionMap(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Закрыть ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                    {QUESTIONS.map(q => {
                      const userAns = selectedAnswers[q.id];
                      let dotColor = 'bg-slate-800 text-slate-400 hover:bg-slate-700';
                      if (userAns) {
                        dotColor = userAns === q.correctAnswer 
                          ? 'bg-emerald-600 text-white font-bold' 
                          : 'bg-rose-600 text-white';
                      }
                      if (q.id === currentQ.id) {
                        dotColor += ' ring-2 ring-amber-400';
                      }
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentQuestionIndex(q.id - 1);
                            setShowQuestionMap(false);
                          }}
                          className={`h-8 rounded text-xs font-mono transition-all flex items-center justify-center ${dotColor}`}
                        >
                          {q.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Translation Help Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
              <Globe className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="text-slate-300">Интерактивный перевод:</strong> Нажмите на любой испанский текст (вопрос или вариант ответа) — откроется его точный перевод на армянский язык!
              </div>
            </div>
          </div>

          {/* RIGHT: POLE CHUDES DRUM (WHEEL) & STATS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* The Wheel */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col items-center">
              <div className="flex items-center gap-2 mb-3">
                <Disc className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Барабан Поле Чудес
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 text-center mb-4">
                Крутите барабан для получения бонусных очков в свой банк!
              </p>

              {/* Wheel Graphic */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 my-2 select-none">
                {/* Pointer Indicator Arrow */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-x-8 border-x-transparent border-t-[18px] border-t-amber-400 drop-shadow-md" />

                {/* Rotating SVG Wheel */}
                <div 
                  className="w-full h-full rounded-full border-4 border-amber-400/80 shadow-2xl relative overflow-hidden"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: isSpinning ? 'transform 3.2s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none'
                  }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {WHEEL_SECTORS.map((sector, i) => {
                      const total = WHEEL_SECTORS.length;
                      const angle = 360 / total;
                      const startAngle = (i * angle - 90) * (Math.PI / 180);
                      const endAngle = ((i + 1) * angle - 90) * (Math.PI / 180);
                      
                      const x1 = 50 + 50 * Math.cos(startAngle);
                      const y1 = 50 + 50 * Math.sin(startAngle);
                      const x2 = 50 + 50 * Math.cos(endAngle);
                      const y2 = 50 + 50 * Math.sin(endAngle);

                      const textAngle = i * angle + angle / 2;
                      const textRadius = 32;
                      const tx = 50 + textRadius * Math.cos((textAngle - 90) * (Math.PI / 180));
                      const ty = 50 + textRadius * Math.sin((textAngle - 90) * (Math.PI / 180));

                      return (
                        <g key={i}>
                          <path
                            d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                            fill={sector.color}
                            stroke="#1e293b"
                            strokeWidth="0.8"
                          />
                          <text
                            x={tx}
                            y={ty}
                            fill={sector.text}
                            fontSize="4"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                          >
                            {sector.label}
                          </text>
                        </g>
                      );
                    })}
                    {/* Center Hub */}
                    <circle cx="50" cy="50" r="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                    <circle cx="50" cy="50" r="4" fill="#f59e0b" />
                  </svg>
                </div>
              </div>

              {/* Spin Result & Button */}
              {lastWheelWin && (
                <div className="mt-3 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-xs animate-bounce">
                  Выпало: {lastWheelWin}!
                </div>
              )}

              <button
                onClick={handleSpinWheel}
                disabled={isSpinning}
                className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-950/40 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Disc className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning ? 'Барабан вращается...' : 'КРУТИТЬ БАРАБАН!'}
              </button>
            </div>

            {/* Game Progress Overview */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Прогресс угадывания слова
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Открыто букв в слове:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {targetLetters.filter(c => guessedLetters.includes(c)).length} / {targetLetters.length}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                    style={{
                      width: `${(targetLetters.filter(c => guessedLetters.includes(c)).length / targetLetters.length) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Вопросов пройдено:</span>
                  <span className="font-mono text-slate-200">{Object.keys(selectedAnswers).length} / 30</span>
                </div>
                <div className="flex justify-between">
                  <span>Правильных ответов:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{correctCount}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* MODAL: DIRECT WORD GUESS */}
      {showWordGuessModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowWordGuessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-lg font-bold">Назвать слово целиком</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Внимание! Вы можете назвать всё испанское слово из 6 букв сразу.
            </p>

            <form onSubmit={handleDirectWordGuess} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={10}
                  value={inputWordGuess}
                  onChange={(e) => setInputWordGuess(e.target.value.toUpperCase())}
                  placeholder="ВВЕДИТЕ СЛОВО..."
                  className="w-full text-center tracking-widest font-mono font-bold text-xl px-4 py-3 rounded-xl bg-slate-950 border-2 border-amber-400/50 text-amber-300 focus:outline-none focus:border-amber-300 uppercase"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWordGuessModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95"
                >
                  Проверить слово!
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VICTORY MODAL */}
      {hasWon && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl relative gold-glow">
            
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-3xl shadow-lg">
              🏆
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mb-1">
              ¡VICTORIA! ПОБЕДА!
            </h2>
            <p className="text-sm text-amber-300/90 font-medium mb-6">
              ՀԱՂԹԱՆԱԿ: Դուք բացեցիք ամբողջ գաղտնի բառը:
            </p>

            {/* Revealed Word Display */}
            <div className="py-4 px-6 rounded-2xl bg-amber-500/10 border border-amber-400/40 mb-6">
              <div className="text-xs text-amber-400 uppercase tracking-widest font-semibold mb-1">
                Секретное слово:
              </div>
              <div className="text-4xl sm:text-5xl font-black font-serif tracking-widest text-yellow-300 drop-shadow">
                {TARGET_WORD}
              </div>
              <div className="mt-3 text-xs sm:text-sm text-slate-200 space-y-1 text-left bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <p><strong>🇪🇸 Significado:</strong> {TARGET_WORD_MEANING.es}</p>
                <p className="text-amber-300"><strong>🇦🇲 Իմաստը:</strong> {TARGET_WORD_MEANING.hy}</p>
                <p className="text-slate-400"><strong>🇷🇺 Значение:</strong> {TARGET_WORD_MEANING.ru}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Итоговый счёт</div>
                <div className="text-xl font-bold text-amber-300 font-mono">{score}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Правильных ответов</div>
                <div className="text-xl font-bold text-emerald-400 font-mono">{correctCount} / 30</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setHasWon(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition"
              >
                Продолжить изучать вопросы
              </button>
              <button
                onClick={handleRestart}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs sm:text-sm font-black hover:brightness-110 active:scale-95 transition shadow-lg shadow-amber-950/40"
              >
                Сыграть ещё раз
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        Поле Чудес: Fútbol Español & Armenio • Palabra secreta: CHUTAR • 30 футбольных вопросов B1–B2
      </footer>
    </div>
  );
}
