"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore";
import { User, Star, Dumbbell, Sparkles, CheckCircle } from "lucide-react";

const negativeTags = ["Equipamentos", "Limpeza", "Atendimento", "Lotação"];
const positiveTags = ["Professores", "Estrutura", "Clima", "Aparelhagem"];

// Web Audio API Synth for Zero-Dependency sounds
const playSound = (type: 'click' | 'success') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      // Success (A nice subtle chord/arpeggio)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); // C#
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    // Ignore audio errors (e.g. browser autoplay policies)
  }
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [feedback, setFeedback] = useState({
    nota_geral: "",
    tags: [] as string[],
    id_funcionario: "",
    nota_limpeza: 0,
    nota_equipamentos: 0,
    contato: "",
  });

  // Fetch dynamic staff offline-ready
  useEffect(() => {
    const q = query(collection(db, "colaboradores"), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaffList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const getTagsOptions = () => {
    if (feedback.nota_geral === "Ruim" || feedback.nota_geral === "Regular") {
      return { title: "O que podemos melhorar?", options: negativeTags };
    }
    return { title: "O que você mais gostou?", options: positiveTags };
  };

  const handleExperience = (rating: string) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);
    setFeedback((prev) => ({ ...prev, nota_geral: rating }));
    setTimeout(() => {
      setStep(2);
      setIsProcessing(false);
    }, 400); 
  };

  const toggleTag = (tag: string) => {
    playSound('click');
    setFeedback((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const nextFromTags = () => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);
    setTimeout(() => {
      setStep(3);
      setIsProcessing(false);
    }, 300);
  };

  const handleStaff = (id: string) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);
    setFeedback((prev) => ({ ...prev, id_funcionario: id }));
    setTimeout(() => {
      setStep(4);
      setIsProcessing(false);
    }, 400);
  };

  const checkAlert = async () => {
    if (feedback.nota_geral !== "Ruim") return;
    
    // Check last 2 to see if they were also "Ruim"
    try {
      const q = query(collection(db, "avaliacoes"), orderBy("timestamp", "desc"), limit(2));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => doc.data());
      
      const allPessimo = docs.length === 2 && docs.every(d => d.nota_geral === "Ruim");
      if (allPessimo) {
        console.warn("⚠️ ALERTA CRÍTICO: Múltiplas avaliações 'Ruim' consecutivas detectadas! Verifique o atendimento.");
      }
    } catch (e) {
      console.error("Erro ao checar alertas", e);
    }
  };

  const submitFeedback = async (limpeza: number, equipamentos: number, contato: string) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);

    const finalFeedback = {
      ...feedback,
      nota_limpeza: limpeza,
      nota_equipamentos: equipamentos,
      contato,
    };
    
    // Simulate Alert Logic
    await checkAlert();

    // Save to Firebase
    try {
      await addDoc(collection(db, "avaliacoes"), {
        ...finalFeedback,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Erro ao salvar avaliação: ", e);
    }

    setStep(5);
    setIsProcessing(false);
  };

  // Auto reset on step 5
  useEffect(() => {
    if (step === 5) {
      playSound('success');
      const timer = setTimeout(() => {
        setStep(1);
        setFeedback({
          nota_geral: "",
          tags: [],
          id_funcionario: "",
          nota_limpeza: 0,
          nota_equipamentos: 0,
          contato: "",
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // --------------
  // RENDER STEPS
  // --------------

  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-white p-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">Como foi sua experiência hoje?</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 w-full max-w-5xl">
          {[
            { label: "Ruim", emoji: "😡", color: "bg-red-500/20 hover:bg-red-500/40 text-red-500 border-red-500/50" },
            { label: "Regular", emoji: "😐", color: "bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 border-orange-500/50" },
            { label: "Bom", emoji: "🙂", color: "bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 border-blue-500/50" },
            { label: "Excelente", emoji: "🤩", color: "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border-emerald-500/50" },
          ].map((item) => (
            <button
              key={item.label}
              disabled={isProcessing}
              onClick={() => handleExperience(item.label)}
              className={`flex flex-col items-center justify-center p-10 md:p-14 min-h-[60px] rounded-3xl border-2 transition-all transform hover:scale-105 active:scale-95 ${item.color} disabled:opacity-50`}
            >
              <span className="text-6xl md:text-8xl mb-6">{item.emoji}</span>
              <span className="text-xl md:text-3xl font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    const { title, options } = getTagsOptions();
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-white p-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-16 text-center tracking-tight">{title}</h1>
        <div className="grid grid-cols-2 gap-6 w-full max-w-3xl mb-16">
          {options.map((tag) => {
            const isSelected = feedback.tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`py-8 px-6 min-h-[80px] rounded-2xl text-2xl font-semibold transition-all transform active:scale-95 border-2 ${
                  isSelected 
                    ? "bg-zinc-100 text-zinc-900 border-zinc-100" 
                    : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-500"
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
        <button
          onClick={nextFromTags}
          disabled={isProcessing}
          className={`px-16 py-8 min-h-[60px] rounded-full text-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50 ${
            feedback.tags.length > 0
              ? "bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Avançar
        </button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-white p-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center tracking-tight">Quem te atendeu?</h1>
        <p className="text-zinc-400 text-xl mb-12">Toque na foto para avaliar (Opcional)</p>
        
        {/* Horizontal scroll layout if we have many staff members */}
        <div className="flex overflow-x-auto snap-x gap-6 w-full max-w-5xl pb-4 px-4 custom-scrollbar">
          {staffList.map((staff) => (
            <button
              key={staff.id}
              disabled={isProcessing}
              onClick={() => handleStaff(staff.id)}
              className="flex-shrink-0 snap-center flex flex-col items-center p-6 min-h-[60px] min-w-[200px] md:min-w-[240px] bg-zinc-900 border border-zinc-800 rounded-3xl hover:bg-zinc-800 transition-colors transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {staff.image ? (
                <img src={staff.image} alt={staff.nome} className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-6 object-cover border-4 border-zinc-800 pointer-events-none" />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-6 bg-zinc-800 flex items-center justify-center border-4 border-zinc-700 pointer-events-none">
                  <User className="w-16 h-16 text-zinc-500" />
                </div>
              )}
              <h2 className="text-2xl font-bold">{staff.nome}</h2>
              <p className="text-zinc-400 text-lg">{staff.cargo}</p>
            </button>
          ))}
          {/* Always provide a 'Nobody' option to skip without penalty */}
          <button
            onClick={() => handleStaff("Nenhum")}
            className="flex-shrink-0 snap-center flex flex-col items-center p-6 min-h-[60px] min-w-[200px] md:min-w-[240px] bg-zinc-950 border border-zinc-800 rounded-3xl hover:bg-zinc-900 transition-colors transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-6 bg-zinc-900 flex items-center justify-center border-4 border-zinc-800 pointer-events-none">
              <User className="w-16 h-16 text-zinc-600" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-500">Ninguém</h2>
            <p className="text-zinc-600 text-lg">Pular etapa</p>
          </button>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return <Step4 onSubmit={submitFeedback} isProcessing={isProcessing} />;
  }

  if (step === 5) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-white p-8">
        <div className="w-40 h-40 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-8 animate-bounce transition-all">
          <CheckCircle className="w-24 h-24" />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-center">Obrigado!</h1>
        <p className="text-2xl text-emerald-400 font-semibold text-center max-w-2xl">
          Feedback enviado com sucesso.
        </p>
      </div>
    );
  }

  return null;
}

function Step4({ onSubmit, isProcessing }: { onSubmit: (l: number, e: number, c: string) => void, isProcessing: boolean }) {
  const [limpeza, setLimpeza] = useState(0);
  const [equipamentos, setEquipamentos] = useState(0);
  const [contato, setContato] = useState("");

  const handleSubmit = () => {
    onSubmit(limpeza, equipamentos, contato);
  };

  const isReady = limpeza > 0 && equipamentos > 0;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-white p-8 overflow-y-auto">
      <div className="w-full max-w-3xl space-y-8 pb-10">
        <h1 className="text-3xl md:text-5xl font-bold text-center tracking-tight">Avalie nossa estrutura:</h1>
        
        {/* Limpeza */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 text-2xl font-semibold">
            <Sparkles className="w-8 h-8 text-blue-400" />
            Limpeza
          </div>
          <RatingGroup value={limpeza} onChange={setLimpeza} />
        </div>

        {/* Equipamentos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 text-2xl font-semibold">
            <Dumbbell className="w-8 h-8 text-emerald-400" />
            Equipamentos
          </div>
          <RatingGroup value={equipamentos} onChange={setEquipamentos} />
        </div>

        {/* Input Opcional */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 text-center">
          <label htmlFor="contato" className="text-xl text-zinc-300">
            Deseja um retorno da gerência? (Opcional)
          </label>
          <input 
            id="contato"
            type="text" 
            placeholder="Deixe seu Celular ou CPF..." 
            value={contato}
            onChange={(e) => {
              if(contato === "" && e.target.value.length > 0) playSound('click');
              setContato(e.target.value);
            }}
            className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl p-6 min-h-[60px] text-xl focus:outline-none focus:border-[#10B981] text-center placeholder-zinc-500"
            autoComplete="off"
          />
        </div>

        <div className="flex justify-center mt-8">
          <button
            onClick={handleSubmit}
            disabled={!isReady || isProcessing}
            className={`px-12 py-6 min-h-[60px] rounded-full text-2xl font-bold transition-all w-full max-w-md ${
              isReady 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50" 
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Enviar Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingGroup({ value, onChange }: { value: number, onChange: (val: number) => void }) {
  return (
    <div className="flex gap-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => { playSound('click'); onChange(star); }}
          className={`p-4 transition-transform transform active:scale-90 hover:scale-110 flex items-center justify-center min-h-[60px] min-w-[60px] rounded-full ${
            value >= star ? "text-[#10B981] bg-[#10B981]/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-zinc-700 bg-zinc-800"
          }`}
        >
          <Star className="w-12 h-12" fill={value >= star ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}
