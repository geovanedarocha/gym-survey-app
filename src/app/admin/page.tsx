"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Activity, MessageCircle, BarChart3, Users, Star, LogOut, Mail, Check, Phone } from "lucide-react";

function AdminDashboardInner() {
  const router = useRouter();
  
  const [data, setData] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [gymEmail, setGymEmail] = useState("skyfitb.gestao@gmail.com");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">("idle");

  // Auth and evaluations listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        const q = query(collection(db, "avaliacoes"), orderBy("timestamp", "desc"), limit(100));
        
        const unsubscribeData = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => {
            const rawData = doc.data();
            const date = rawData.timestamp?.toDate() || new Date();
            return {
              id: doc.id,
              ...rawData,
              timeLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              dateLabel: date.toLocaleDateString()
            };
          });
          setData(docs);
        }, (err) => {
          console.error("Erro ao escutar dados admin", err);
        });

        return () => unsubscribeData();
      } else {
        setIsAuthenticated(false);
        router.push("/admin/login");
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  // Settings listener (email)
  useEffect(() => {
    if (isAuthenticated) {
      const docRef = doc(db, "configuracoes", "geral");
      const unsubscribeConfig = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.email_gestao) {
            setGymEmail(data.email_gestao);
          }
        }
      });
      return () => unsubscribeConfig();
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return <div className="h-screen bg-zinc-950 flex justify-center items-center text-white">Verificando acesso...</div>;
  }

  if (isAuthenticated === false) {
    return null; // Will redirect
  }

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmail(true);
    setEmailStatus("idle");
    try {
      const docRef = doc(db, "configuracoes", "geral");
      await setDoc(docRef, { email_gestao: gymEmail }, { merge: true });
      setEmailStatus("success");
      setTimeout(() => setEmailStatus("idle"), 3000);
    } catch (err) {
      console.error("Erro ao salvar e-mail", err);
      setEmailStatus("error");
    } finally {
      setIsSavingEmail(false);
    }
  };

  // --- KPI CALCULATIONS ---
  const total = data.length || 1;
  const boas = data.filter(d => d.nota_geral === "Bom" || d.nota_geral === "Excelente").length;
  const taxaSatisfacao = ((boas / total) * 100).toFixed(1);

  // Worst tag
  const tagCounts: Record<string, number> = {};
  data.forEach(d => {
    if (d.nota_geral === "Ruim" || d.nota_geral === "Regular") {
      d.tags?.forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    }
  });
  const worstTag = Object.keys(tagCounts).sort((a,b) => tagCounts[b] - tagCounts[a])[0] || "Nenhuma";

  // Recepcionista TOP
  const recepAvg: Record<string, { totalNotes: number, sumNotes: number, nome: string }> = {};
  data.forEach(d => {
    if (d.recepcionista_id && d.recepcionista_id !== "Nenhum" && d.recepcionista_nota > 0) {
      const id = d.recepcionista_id;
      const nota = d.recepcionista_nota;
      const name = d.recepcionista_nome || "Desconhecido";
      if (!recepAvg[id]) recepAvg[id] = { totalNotes: 0, sumNotes: 0, nome: name };
      recepAvg[id].totalNotes += 1;
      recepAvg[id].sumNotes += nota;
    }
  });
  const topRecepList = Object.keys(recepAvg).map(id => ({
    id,
    nome: recepAvg[id].nome,
    media: recepAvg[id].sumNotes / recepAvg[id].totalNotes,
    votos: recepAvg[id].totalNotes
  })).sort((a, b) => b.media - a.media || b.votos - a.votos);
  const topRecep = topRecepList[0];

  // Professor TOP
  const profAvg: Record<string, { totalNotes: number, sumNotes: number, nome: string }> = {};
  data.forEach(d => {
    if (d.professor_id && d.professor_id !== "Nenhum" && d.professor_nota > 0) {
      const id = d.professor_id;
      const nota = d.professor_nota;
      const name = d.professor_nome || "Desconhecido";
      if (!profAvg[id]) profAvg[id] = { totalNotes: 0, sumNotes: 0, nome: name };
      profAvg[id].totalNotes += 1;
      profAvg[id].sumNotes += nota;
    }
  });
  const topProfList = Object.keys(profAvg).map(id => ({
    id,
    nome: profAvg[id].nome,
    media: profAvg[id].sumNotes / profAvg[id].totalNotes,
    votos: profAvg[id].totalNotes
  })).sort((a, b) => b.media - a.media || b.votos - a.votos);
  const topProf = topProfList[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans overflow-auto">
      {/* SkyFit Header Logo */}
      <div className="flex items-center gap-2 mb-4 select-none">
        <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 14h9l-2 8 10-12h-9z" />
        </svg>
        <span className="font-extrabold text-2xl tracking-wider font-mono italic">
          <span className="text-white">SKY</span>
          <span className="text-orange-500">FIT</span>
          <span className="text-zinc-500 text-lg ml-1 font-sans not-italic font-bold">B</span>
        </span>
      </div>

      <header className="mb-10 flex flex-col items-start gap-4 border-b border-zinc-800 pb-6">
        <div className="flex w-full justify-between items-center flex-wrap gap-4">
          <h1 className="text-4xl font-bold flex items-center gap-4">
            <Activity className="text-[#10B981] w-10 h-10 animate-pulse" />
            Dashboard Executivo
          </h1>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push(`/admin/equipe`)}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-xl transition-colors border border-zinc-700 font-medium"
            >
              <Users size={18} /> Gerir Equipe
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 px-4 rounded-xl transition-colors font-medium"
            >
              <LogOut size={18} /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 w-full max-w-6xl">
        <div className="bg-zinc-900 border border-[#10B981]/50 rounded-2xl p-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <p className="text-zinc-400 flex items-center gap-2 mb-2"><BarChart3 size={18}/> Índice de Satisfação</p>
          <p className="text-5xl font-bold text-[#10B981]">{total > 1 ? taxaSatisfacao : "--"}%</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 flex items-center gap-2 mb-2"><Activity size={18}/> Área com mais Queixas</p>
          <p className="text-3xl font-bold text-orange-400">{worstTag}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 flex items-center gap-2 mb-2"><Star size={18}/> Recepcionista TOP</p>
          <p className="text-2xl font-bold text-purple-400 truncate">{topRecep ? `${topRecep.nome} (${topRecep.media.toFixed(1)}⭐)` : "--"}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 flex items-center gap-2 mb-2"><Star size={18}/> Professor TOP</p>
          <p className="text-2xl font-bold text-blue-400 truncate">{topProf ? `${topProf.nome} (${topProf.media.toFixed(1)}⭐)` : "--"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 w-full max-w-6xl">
        {/* Main interactions list */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-zinc-300 mb-6">Últimas 100 Interações</h2>
          <div className="space-y-6">
            {data.length === 0 ? (
              <p className="text-zinc-500 animate-pulse">Aguardando dados ao vivo...</p>
            ) : (
              data.map((item) => {
                const onlyNumbers = item.contato ? item.contato.replace(/\D/g, "") : "";
                const hasPhone = onlyNumbers.length >= 10;

                return (
                  <div key={item.id} className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 flex flex-col gap-4 text-base font-sans">
                    <div className="flex flex-wrap justify-between items-center border-b border-zinc-800 pb-3 gap-2">
                      <span className="text-zinc-500 font-mono text-sm">[{item.dateLabel} {item.timeLabel}]</span>
                      <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                        item.nota_geral === 'Ruim' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        item.nota_geral === 'Regular' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        item.nota_geral === 'Bom' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-[#10B981] border border-[#10B981]/20'
                      }`}>
                        Experiência: {item.nota_geral || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-zinc-300">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Destaques (Tags)</p>
                        <p className="mt-1 font-semibold text-zinc-200">{item.tags && item.tags.length > 0 ? item.tags.join(", ") : "--"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Recepção</p>
                        <p className="mt-1 font-semibold text-purple-400">
                          {item.recepcionista_nome && item.recepcionista_nome !== "Nenhum" 
                            ? `${item.recepcionista_nome} (${item.recepcionista_nota || 0}/5 ⭐)` 
                            : "Não avaliado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Musculação</p>
                        <p className="mt-1 font-semibold text-blue-400">
                          {item.professor_nome && item.professor_nome !== "Nenhum" 
                            ? `${item.professor_nome} (${item.professor_nota || 0}/5 ⭐)` 
                            : "Não avaliado"}
                        </p>
                      </div>
                    </div>

                    {item.sugestao && (
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Sugestão do Cliente</p>
                        <p className="text-zinc-200 font-mono italic">"{item.sugestao}"</p>
                      </div>
                    )}

                    {(item.contato || hasPhone) && (
                      <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-xl border border-zinc-850 flex-wrap gap-2">
                        <span className="text-zinc-400 flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-emerald-500 animate-pulse" />
                          Retorno solicitado para: <strong className="text-white font-mono">{item.contato}</strong>
                        </span>
                        {hasPhone && (
                          <a 
                            href={`https://api.whatsapp.com/send?phone=55${onlyNumbers}&text=Ol%C3%A1!%20Sou%20o%20gestor%20da%20academia%20SkyFit.%20Recebemos%20seu%20feedback%20no%20totem%20e%20gostaria%20de%20conversar%20mais%20sobre%20sua%20sugest%C3%A3o.`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#10B981] text-zinc-950 px-4 py-2 text-xs font-bold rounded-lg hover:bg-emerald-400 transition flex items-center gap-1.5"
                          >
                            <MessageCircle size={14} /> Acionar no Zap
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl h-fit">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-200">
            <Mail className="text-orange-500 w-5 h-5" />
            Configuração de E-mail
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            Defina o e-mail de destino da administração. Todas as novas pesquisas finalizadas enviarão um relatório para este e-mail.
          </p>

          <form onSubmit={handleSaveEmail} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-2 font-medium">E-mail da Gestão</label>
              <input 
                type="email" 
                value={gymEmail}
                onChange={e => setGymEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 text-sm"
                placeholder="skyfitb.gestao@gmail.com"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={isSavingEmail}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isSavingEmail ? "Salvando..." : "Salvar Configuração"}
            </button>

            {emailStatus === "success" && (
              <p className="text-emerald-500 text-xs flex items-center gap-1.5 justify-center">
                <Check size={14} /> Salvo com sucesso!
              </p>
            )}
            {emailStatus === "error" && (
              <p className="text-red-500 text-xs text-center">
                Erro ao salvar as configurações.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="h-screen bg-zinc-950 flex justify-center items-center text-white">Carregando...</div>}>
      <AdminDashboardInner />
    </Suspense>
  )
}
