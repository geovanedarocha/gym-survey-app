"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc } from "firebase/firestore";
import { User, Star, CheckCircle, ArrowLeft, Music } from "lucide-react";

// Tags dinâmicas por tipo de nota
const negativeTags = ["Equipamentos", "Limpeza", "Atendimento", "Estrutura", "Banheiros", "Ar-condicionado", "Organização dos Pesos", "Som/Música"];
const positiveTags = ["Professores", "Atendimento da Recepção", "Equipamentos", "Limpeza", "Aulas Coletivas", "Climatização", "Ambiente/Conforto"];

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
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    // Ignore audio errors
  }
};

function SkyFitLogo() {
  return (
    <div className="flex items-center justify-center mb-6 select-none">
      <img
        src="/logo.png"
        alt="SkyFit"
        className="h-24 md:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.15)]"
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// FLUXO DE STEPS:
//  1  → Nota Geral
//  2  → Participou de Aula Coletiva? (SIM/NÃO)
//  3  → Selecionar Professor de Aula Coletiva  (só se SIM)
//  4  → Avaliar Aula Coletiva (estrelas)        (só se SIM)
//  5  → Tags de Contexto (motivos)
//  6  → Selecionar Recepcionista
//  7  → Avaliar Recepcionista (estrelas)
//  8  → Selecionar Professor Musculação
//  9  → Avaliar Professor Musculação (estrelas)
// 10  → Sugestão + Contato
// 11  → Tela de Confirmação
// ──────────────────────────────────────────────

export default function Home() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [academiaEmail, setAcademiaEmail] = useState("skyfitb.gestao@gmail.com");
  const [feedback, setFeedback] = useState({
    nota_geral: "",
    tags: [] as string[],
    // Aula Coletiva
    aula_coletiva_participou: false,
    aula_coletiva_professor_id: "",
    aula_coletiva_professor_nome: "",
    aula_coletiva_professor_aula: "",
    aula_coletiva_nota: 0,
    // Recepção
    recepcionista_id: "",
    recepcionista_nome: "",
    recepcionista_nota: 0,
    // Musculação
    professor_id: "",
    professor_nome: "",
    professor_nota: 0,
    // Sugestão e Contato
    sugestao: "",
    contato: "",
  });

  // Fetch staff dynamically (sem filtro de unit_id aqui — o totem usa parâmetro de URL)
  useEffect(() => {
    const q = query(collection(db, "colaboradores"), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaffList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Fetch academy notification email
  useEffect(() => {
    const docRef = doc(db, "configuracoes", "geral");
    const unsubscribeConfig = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.email_gestao) {
          setAcademiaEmail(data.email_gestao);
        }
      }
    });
    return () => unsubscribeConfig();
  }, []);

  const getTagsOptions = () => {
    if (feedback.nota_geral === "Ruim" || feedback.nota_geral === "Regular") {
      return { title: "O que podemos melhorar?", options: negativeTags };
    }
    return { title: "O que você mais gostou?", options: positiveTags };
  };

  // Step 1 → 2
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

  // Step 2: Aula Coletiva resposta
  const handleAulaColetiva = (participou: boolean) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);
    setFeedback(prev => ({ ...prev, aula_coletiva_participou: participou }));
    setTimeout(() => {
      if (participou) {
        setStep(3); // Selecionar professor da aula coletiva
      } else {
        setStep(5); // Pular direto para tags
      }
      setIsProcessing(false);
    }, 300);
  };

  // Step 3: Selecionar professor de aula coletiva
  const handleSelectAulaColetivaProfessor = (id: string, nome: string, aula: string) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);
    setFeedback(prev => ({
      ...prev,
      aula_coletiva_professor_id: id,
      aula_coletiva_professor_nome: nome,
      aula_coletiva_professor_aula: aula,
    }));
    setTimeout(() => {
      setStep(4); // Avaliar aula coletiva
      setIsProcessing(false);
    }, 400);
  };

  // Step 4: Avaliar aula coletiva → vai para tags (step 5)
  const handleRateAulaColetiva = (rating: number) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);
    setFeedback(prev => ({ ...prev, aula_coletiva_nota: rating }));
    setTimeout(() => {
      setStep(5);
      setIsProcessing(false);
    }, 400);
  };

  // Step 5: Tags
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
      setStep(6); // Go to Receptionist Selection
      setIsProcessing(false);
    }, 300);
  };

  // Step 6: Recepção Selection
  const handleSelectRecepcionista = (id: string, name: string) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);
    setFeedback(prev => ({ ...prev, recepcionista_id: id, recepcionista_nome: name }));
    setTimeout(() => {
      if (id === "Nenhum") {
        setFeedback(prev => ({ ...prev, recepcionista_nota: 0 }));
        setStep(8); // Skip rating, go to musculação
      } else {
        setStep(7); // Rate receptionist
      }
      setIsProcessing(false);
    }, 400);
  };

  // Step 7: Recepção Rating
  const handleRateRecepcionista = (rating: number) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);
    setFeedback(prev => ({ ...prev, recepcionista_nota: rating }));
    setTimeout(() => {
      setStep(8); // Go to Professor Selection
      setIsProcessing(false);
    }, 400);
  };

  // Step 8: Professor Musculação Selection
  const handleSelectProfessor = (id: string, name: string) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);
    setFeedback(prev => ({ ...prev, professor_id: id, professor_nome: name }));
    setTimeout(() => {
      if (id === "Nenhum") {
        setFeedback(prev => ({ ...prev, professor_nota: 0 }));
        setStep(10); // Skip rating, go to suggestions
      } else {
        setStep(9); // Rate professor
      }
      setIsProcessing(false);
    }, 400);
  };

  // Step 9: Professor Musculação Rating
  const handleRateProfessor = (rating: number) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);
    setFeedback(prev => ({ ...prev, professor_nota: rating }));
    setTimeout(() => {
      setStep(10); // Go to Suggestions
      setIsProcessing(false);
    }, 400);
  };

  // Step 10 → 11: Submit Feedback
  const submitFeedback = async (sugestao: string, contato: string) => {
    if (isProcessing) return;
    playSound('click');
    setIsProcessing(true);

    const finalFeedback = {
      ...feedback,
      sugestao,
      contato,
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "avaliacoes"), finalFeedback);
    } catch (e) {
      console.error("Erro ao salvar avaliação: ", e);
    }

    // Email dispatch
    try {
      const aulaColetivaSec = feedback.aula_coletiva_participou
        ? `<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
           <h3 style="color: #27272a;">Aula Coletiva:</h3>
           <p><strong>Professor/Aula:</strong> ${feedback.aula_coletiva_professor_nome} — ${feedback.aula_coletiva_professor_aula}</p>
           <p><strong>Nota:</strong> ${feedback.aula_coletiva_nota > 0 ? `${feedback.aula_coletiva_nota} / 5 ⭐` : "Não avaliado"}</p>`
        : `<p><strong>Aula Coletiva:</strong> Não participou</p>`;

      const emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #fafafa; color: #18181b;">
          <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 8px;">Nova Avaliação de Satisfação - SkyFit</h2>
          
          <p style="font-size: 16px; margin: 16px 0;"><strong>Experiência Geral:</strong> 
            <span style="font-size: 18px; font-weight: bold; color: ${
              feedback.nota_geral === 'Ruim' ? '#ef4444' : 
              feedback.nota_geral === 'Regular' ? '#f97316' : 
              feedback.nota_geral === 'Bom' ? '#3b82f6' : '#10b981'
            };">${feedback.nota_geral}</span>
          </p>
          
          <p><strong>Destacados pelo Cliente (Tags):</strong> ${feedback.tags.join(", ") || "Nenhum"}</p>
          
          ${aulaColetivaSec}
          
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          
          <h3 style="color: #27272a;">Avaliação da Recepção:</h3>
          <p><strong>Atendente:</strong> ${feedback.recepcionista_nome}</p>
          <p><strong>Nota:</strong> ${feedback.recepcionista_nota > 0 ? `${feedback.recepcionista_nota} / 5 ⭐` : "Pulado (Não Avaliado)"}</p>
          
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          
          <h3 style="color: #27272a;">Avaliação da Sala de Musculação:</h3>
          <p><strong>Professor/Instrutor:</strong> ${feedback.professor_nome}</p>
          <p><strong>Nota:</strong> ${feedback.professor_nota > 0 ? `${feedback.professor_nota} / 5 ⭐` : "Pulado (Não Avaliado)"}</p>
          
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          
          <p><strong>Sugestões/Críticas:</strong></p>
          <div style="background-color: #ffffff; border: 1px solid #e4e4e7; padding: 12px; border-radius: 8px; font-style: italic; white-space: pre-wrap;">${sugestao || "Nenhuma sugestão enviada."}</div>
          
          <p style="margin-top: 16px;"><strong>Contato deixado para retorno:</strong> ${contato || "Nenhum contato deixado."}</p>
          
          <p style="font-size: 11px; color: #71717a; margin-top: 24px; text-align: center; border-top: 1px solid #e4e4e7; padding-top: 12px;">
            Este e-mail foi gerado automaticamente pelo Totem de Pesquisa da SkyFit. Sincronizado em: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `;

      await addDoc(collection(db, "mail"), {
        to: academiaEmail,
        message: {
          subject: `Avaliação SkyFit: ${feedback.nota_geral} | Recepção: ${feedback.recepcionista_nota}/5 | Musculação: ${feedback.professor_nota}/5`,
          html: emailContent,
        }
      });
    } catch (e) {
      console.error("Erro ao registrar disparo de e-mail:", e);
    }

    setStep(11);
    setIsProcessing(false);
  };

  // Auto reset on step 11
  useEffect(() => {
    if (step === 11) {
      playSound('success');
      const timer = setTimeout(() => {
        setStep(1);
        setFeedback({
          nota_geral: "",
          tags: [],
          aula_coletiva_participou: false,
          aula_coletiva_professor_id: "",
          aula_coletiva_professor_nome: "",
          aula_coletiva_professor_aula: "",
          aula_coletiva_nota: 0,
          recepcionista_id: "",
          recepcionista_nome: "",
          recepcionista_nota: 0,
          professor_id: "",
          professor_nome: "",
          professor_nota: 0,
          sugestao: "",
          contato: "",
        });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Filter staff by sector
  const receptionists = staffList.filter(s => s.setor === "recepcao");
  const professors = staffList.filter(s => s.setor === "musculacao");
  const coletivaProfessors = staffList.filter(s => s.setor === "coletiva");

  // ──────────────────────────────────────────────
  // RENDER STEPS
  // ──────────────────────────────────────────────

  // Step 1: Nota Geral
  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto">
        <SkyFitLogo />
        <h1 className="text-3xl md:text-5xl font-bold mb-8 md:mb-12 text-center tracking-tight">Como foi sua experiência hoje?</h1>
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

  // Step 2: Participou de Aula Coletiva?
  if (step === 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto">
        <SkyFitLogo />
        <div className="flex items-center justify-center gap-3 mb-4">
          <Music className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl md:text-5xl font-bold text-center tracking-tight">
            Você participou de alguma Aula Coletiva hoje?
          </h1>
        </div>
        <p className="text-zinc-400 text-lg md:text-xl mb-12 text-center">Zumba, Ritmos, Spinning, Pilates...</p>
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl">
          <button
            disabled={isProcessing}
            onClick={() => handleAulaColetiva(false)}
            className="flex-1 flex flex-col items-center justify-center gap-4 py-10 px-8 min-h-[140px] rounded-3xl border-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 text-zinc-300 text-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50"
          >
            <span className="text-5xl">❌</span>
            NÃO
          </button>
          <button
            disabled={isProcessing}
            onClick={() => handleAulaColetiva(true)}
            className="flex-1 flex flex-col items-center justify-center gap-4 py-10 px-8 min-h-[140px] rounded-3xl border-2 bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 text-purple-300 text-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50"
          >
            <span className="text-5xl">✅</span>
            SIM
          </button>
        </div>
        <button
          onClick={() => setStep(1)}
          className="mt-8 px-8 py-4 rounded-full text-lg font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-500"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Step 3: Selecionar Professor de Aula Coletiva
  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto">
        <SkyFitLogo />
        <h1 className="text-3xl md:text-5xl font-bold mb-3 text-center tracking-tight">Qual aula coletiva você fez?</h1>
        <p className="text-zinc-400 text-lg md:text-xl mb-8 text-center">Selecione o professor e a aula</p>

        <div className="flex overflow-x-auto snap-x gap-6 w-full max-w-5xl pb-6 px-4 custom-scrollbar">
          {coletivaProfessors.map((staff) => (
            <button
              key={staff.id}
              disabled={isProcessing}
              onClick={() => handleSelectAulaColetivaProfessor(staff.id, staff.nome, staff.cargo || "Aula Coletiva")}
              className="flex-shrink-0 snap-center flex flex-col items-center p-6 min-w-[200px] md:min-w-[240px] bg-zinc-900 border border-zinc-800 rounded-3xl hover:bg-purple-900/30 hover:border-purple-500/50 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {staff.image ? (
                <img src={staff.image} alt={staff.nome} className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-4 object-cover border-4 border-purple-500/30 pointer-events-none" />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-4 bg-purple-900/30 flex items-center justify-center border-4 border-purple-500/30 pointer-events-none">
                  <Music className="w-16 h-16 text-purple-400" />
                </div>
              )}
              <h2 className="text-xl font-bold text-center">{staff.nome}</h2>
              <p className="text-purple-400 text-base font-medium text-center mt-1">{staff.cargo || "Aula Coletiva"}</p>
            </button>
          ))}

          {coletivaProfessors.length === 0 && (
            <div className="text-zinc-500 text-xl flex items-center justify-center w-full min-h-[120px] text-center">
              Nenhum professor de aula coletiva cadastrado.<br />
              <span className="text-sm mt-2">Acesse Admin → Gerir Equipe para cadastrar.</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setStep(2)}
          className="mt-6 px-8 py-4 rounded-full text-lg font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-500"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Step 4: Avaliar Aula Coletiva (estrelas)
  if (step === 4) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto">
        <SkyFitLogo />
        <div className="flex items-center gap-2 mb-3 text-center">
          <Music className="w-7 h-7 text-purple-400 flex-shrink-0" />
          <h1 className="text-2xl md:text-4xl font-bold text-center tracking-tight">
            Como foi a aula de <span className="text-purple-400">{feedback.aula_coletiva_professor_aula}</span> com {feedback.aula_coletiva_professor_nome}?
          </h1>
        </div>
        <p className="text-zinc-400 text-xl mb-10 text-center">Escolha uma nota de 1 a 5 estrelas</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(168,85,247,0.05)]">
          <RatingGroup
            value={feedback.aula_coletiva_nota}
            onChange={handleRateAulaColetiva}
            color="text-purple-500"
            glowColor="rgba(168,85,247,0.3)"
          />
        </div>

        <button
          onClick={() => setStep(3)}
          className="mt-10 px-10 py-5 min-h-[60px] rounded-full text-xl font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-400"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Step 5: Tags de Contexto
  if (step === 5) {
    const { title, options } = getTagsOptions();
    return (
      <div className="flex flex-col items-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto pt-8">
        <SkyFitLogo />
        <h1 className="text-3xl md:text-5xl font-bold mb-6 md:mb-10 text-center tracking-tight">{title}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 w-full max-w-5xl mb-8">
          {options.map((tag) => {
            const isSelected = feedback.tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`py-7 px-4 min-h-[90px] rounded-2xl text-xl font-semibold transition-all transform active:scale-95 border-2 ${
                  isSelected
                    ? "bg-zinc-100 text-zinc-900 border-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-500"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setStep(2)}
            className="px-10 py-6 min-h-[60px] rounded-full text-xl font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-400"
          >
            Voltar
          </button>
          <button
            onClick={nextFromTags}
            disabled={isProcessing}
            className={`px-16 py-6 min-h-[60px] rounded-full text-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50 ${
              feedback.tags.length > 0
                ? "bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Avançar
          </button>
        </div>
      </div>
    );
  }

  // Step 6: Recepção Selection
  if (step === 6) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto">
        <SkyFitLogo />
        <h1 className="text-3xl md:text-5xl font-bold mb-3 text-center tracking-tight">Quem te atendeu hoje na recepção?</h1>
        <p className="text-zinc-400 text-xl mb-8">Toque para avaliar o atendimento</p>

        <div className="flex overflow-x-auto snap-x gap-6 w-full max-w-5xl pb-6 px-4 custom-scrollbar">
          {receptionists.map((staff) => (
            <button
              key={staff.id}
              disabled={isProcessing}
              onClick={() => handleSelectRecepcionista(staff.id, staff.nome)}
              className="flex-shrink-0 snap-center flex flex-col items-center p-6 min-h-[60px] min-w-[200px] md:min-w-[240px] bg-zinc-900 border border-zinc-800 rounded-3xl hover:bg-zinc-800 hover:border-zinc-700 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {staff.image ? (
                <img src={staff.image} alt={staff.nome} className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-6 object-cover border-4 border-zinc-800 pointer-events-none" />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-6 bg-zinc-800 flex items-center justify-center border-4 border-zinc-700 pointer-events-none">
                  <User className="w-16 h-16 text-zinc-500" />
                </div>
              )}
              <h2 className="text-2xl font-bold">{staff.nome}</h2>
              <p className="text-emerald-500 text-lg font-medium">Recepção</p>
            </button>
          ))}

          {receptionists.length === 0 && (
            <>
              {["Amanda", "Jciane", "Tainá"].map((name) => (
                <button
                  key={name}
                  disabled={isProcessing}
                  onClick={() => handleSelectRecepcionista(`mock-${name}`, name)}
                  className="flex-shrink-0 snap-center flex flex-col items-center p-6 min-h-[60px] min-w-[200px] md:min-w-[240px] bg-zinc-900 border border-zinc-800 rounded-3xl hover:bg-zinc-800 hover:border-zinc-700 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-6 bg-zinc-800 flex items-center justify-center border-4 border-zinc-700 pointer-events-none">
                    <User className="w-16 h-16 text-zinc-500" />
                  </div>
                  <h2 className="text-2xl font-bold">{name}</h2>
                  <p className="text-emerald-500 text-lg font-medium">Recepção (Demo)</p>
                </button>
              ))}
            </>
          )}

          {/* Ninguém me atendeu */}
          <button
            onClick={() => handleSelectRecepcionista("Ninguem", "Ninguém me atendeu")}
            className="flex-shrink-0 snap-center flex flex-col items-center justify-center p-6 min-w-[200px] md:min-w-[240px] bg-red-950/40 border-2 border-red-800/50 rounded-3xl hover:bg-red-900/40 hover:border-red-600/60 transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-4 bg-red-900/30 flex items-center justify-center border-4 border-red-700/40 pointer-events-none">
              <span className="text-6xl md:text-7xl select-none">😞</span>
            </div>
            <h2 className="text-xl font-bold text-red-400 text-center">Ninguém me atendeu</h2>
            <p className="text-red-600 text-sm text-center mt-1">Registrar falta de atendimento</p>
          </button>
        </div>
        {/* Pular discreto */}
        <button
          onClick={() => handleSelectRecepcionista("Nenhum", "Nenhum")}
          className="mt-4 text-zinc-600 hover:text-zinc-400 text-base underline underline-offset-4 transition-colors"
        >
          Pular esta etapa
        </button>
      </div>
    );
  }

  // Step 7: Recepção Rating
  if (step === 7) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto">
        <SkyFitLogo />
        <h1 className="text-2xl md:text-5xl font-bold mb-3 text-center tracking-tight">Avalie o atendimento de {feedback.recepcionista_nome}:</h1>
        <p className="text-zinc-400 text-xl mb-10">Escolha uma nota de 1 a 5 estrelas</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(234,88,12,0.05)]">
          <RatingGroup value={feedback.recepcionista_nota} onChange={handleRateRecepcionista} />
        </div>

        <button
          onClick={() => setStep(6)}
          className="mt-12 px-10 py-6 min-h-[60px] rounded-full text-xl font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-400"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Step 8: Professor Musculação Selection
  if (step === 8) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto">
        <SkyFitLogo />
        <h1 className="text-3xl md:text-5xl font-bold mb-3 text-center tracking-tight">Quem te atendeu na sala de musculação hoje?</h1>
        <p className="text-zinc-400 text-xl mb-8">Toque para avaliar a experiência com o professor</p>

        <div className="flex overflow-x-auto snap-x gap-6 w-full max-w-5xl pb-6 px-4 custom-scrollbar">
          {professors.map((staff) => (
            <button
              key={staff.id}
              disabled={isProcessing}
              onClick={() => handleSelectProfessor(staff.id, staff.nome)}
              className="flex-shrink-0 snap-center flex flex-col items-center p-6 min-h-[60px] min-w-[200px] md:min-w-[240px] bg-zinc-900 border border-zinc-800 rounded-3xl hover:bg-zinc-800 hover:border-zinc-700 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {staff.image ? (
                <img src={staff.image} alt={staff.nome} className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-6 object-cover border-4 border-zinc-800 pointer-events-none" />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-6 bg-zinc-800 flex items-center justify-center border-4 border-zinc-700 pointer-events-none">
                  <User className="w-16 h-16 text-zinc-500" />
                </div>
              )}
              <h2 className="text-2xl font-bold">{staff.nome}</h2>
              <p className="text-orange-500 text-lg font-medium">{staff.cargo || "Professor"}</p>
            </button>
          ))}

          {professors.length === 0 && (
            <div className="text-zinc-500 text-xl flex items-center justify-center w-full min-h-[100px]">
              Nenhum professor cadastrado ainda.
            </div>
          )}

          {/* Ninguém me atendeu */}
          <button
            onClick={() => handleSelectProfessor("Ninguem", "Ninguém me atendeu")}
            className="flex-shrink-0 snap-center flex flex-col items-center justify-center p-6 min-w-[200px] md:min-w-[240px] bg-red-950/40 border-2 border-red-800/50 rounded-3xl hover:bg-red-900/40 hover:border-red-600/60 transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-4 bg-red-900/30 flex items-center justify-center border-4 border-red-700/40 pointer-events-none">
              <span className="text-6xl md:text-7xl select-none">😞</span>
            </div>
            <h2 className="text-xl font-bold text-red-400 text-center">Ninguém me atendeu</h2>
            <p className="text-red-600 text-sm text-center mt-1">Registrar falta de atendimento</p>
          </button>
        </div>
        {/* Pular discreto */}
        <button
          onClick={() => handleSelectProfessor("Nenhum", "Nenhum")}
          className="mt-4 text-zinc-600 hover:text-zinc-400 text-base underline underline-offset-4 transition-colors"
        >
          Pular esta etapa
        </button>
      </div>
    );
  }

  // Step 9: Professor Musculação Rating
  if (step === 9) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto">
        <SkyFitLogo />
        <h1 className="text-2xl md:text-5xl font-bold mb-3 text-center tracking-tight">Avalie o atendimento do professor {feedback.professor_nome}:</h1>
        <p className="text-zinc-400 text-xl mb-10">Escolha uma nota de 1 a 5 estrelas</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(234,88,12,0.05)]">
          <RatingGroup value={feedback.professor_nota} onChange={handleRateProfessor} />
        </div>

        <button
          onClick={() => setStep(8)}
          className="mt-12 px-10 py-6 min-h-[60px] rounded-full text-xl font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-400"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Step 10: Sugestão + Contato
  if (step === 10) {
    return (
      <StepSuggestions onSubmit={submitFeedback} isProcessing={isProcessing} onBack={() => setStep(8)} />
    );
  }

  // Step 11: Confirmação
  if (step === 11) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto">
        <SkyFitLogo />
        <div className="w-40 h-40 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-8 animate-bounce transition-all">
          <CheckCircle className="w-24 h-24" />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-center">Obrigado!</h1>
        <p className="text-2xl text-emerald-400 font-semibold text-center max-w-2xl">
          Sua avaliação foi registrada e enviada para a gerência. Bom treino!
        </p>
      </div>
    );
  }

  return null;
}

// Suggestions Component
function StepSuggestions({ onSubmit, isProcessing, onBack }: { onSubmit: (s: string, c: string) => void, isProcessing: boolean, onBack: () => void }) {
  const [sugestao, setSugestao] = useState("");
  const [contato, setContato] = useState("");

  const handleSubmit = () => {
    onSubmit(sugestao, contato);
  };

  return (
    <div className="flex flex-col items-center min-h-full bg-zinc-950 text-white p-6 md:p-8 overflow-y-auto pt-8">
      <SkyFitLogo />
      <div className="w-full max-w-3xl space-y-8 pb-10">
        <h1 className="text-3xl md:text-5xl font-bold text-center tracking-tight">Falta muito pouco!</h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4">
          <label htmlFor="sugestao" className="text-2xl font-semibold text-center text-orange-400">
            Deixe sua sugestão para que possamos melhorar
          </label>
          <textarea
            id="sugestao"
            placeholder="Digite aqui seu feedback ou sugestão..."
            value={sugestao}
            onChange={(e) => {
              if (sugestao === "" && e.target.value.length > 0) playSound('click');
              setSugestao(e.target.value);
            }}
            className="w-full min-h-[160px] bg-zinc-800 border-2 border-zinc-700 rounded-2xl p-6 text-xl focus:outline-none focus:border-[#ea580c] placeholder-zinc-500 text-zinc-100"
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 text-center">
          <label htmlFor="contato" className="text-xl text-zinc-300">
            Quer que a diretoria fale com você? Deixe seu Celular ou WhatsApp (Opcional)
          </label>
          <input
            id="contato"
            type="text"
            placeholder="Ex: (14) 99999-9999"
            value={contato}
            onChange={(e) => {
              if (contato === "" && e.target.value.length > 0) playSound('click');
              setContato(e.target.value);
            }}
            className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl p-6 min-h-[60px] text-xl focus:outline-none focus:border-emerald-500 text-center placeholder-zinc-500"
            autoComplete="off"
          />
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onBack}
            className="px-10 py-6 min-h-[60px] rounded-full text-xl font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-400 w-1/3"
          >
            Voltar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-2/3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-2xl py-6 rounded-full transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {isProcessing ? "Enviando..." : "Finalizar Pesquisa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Rating Stars component
function RatingGroup({ value, onChange, color = "text-orange-500", glowColor = "rgba(234,88,12,0.3)" }: {
  value: number,
  onChange: (val: number) => void,
  color?: string,
  glowColor?: string
}) {
  return (
    <div className="flex gap-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => { playSound('click'); onChange(star); }}
          className={`p-4 transition-transform transform active:scale-90 hover:scale-110 flex items-center justify-center min-h-[60px] min-w-[60px] rounded-full ${
            value >= star ? `${color} bg-orange-500/10 border border-orange-500/30` : "text-zinc-700 bg-zinc-800"
          }`}
          style={value >= star ? { boxShadow: `0 0 15px ${glowColor}` } : {}}
        >
          <Star className="w-12 h-12" fill={value >= star ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}
