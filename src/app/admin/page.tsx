"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Activity, MessageCircle, BarChart3, Users, Star } from "lucide-react";

function AdminDashboardInner() {
  const searchParams = useSearchParams();
  const secret = searchParams.get("secret");
  const router = useRouter();
  
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (secret !== "123") return;

    // A fetching total amount for KPIs is complex if relying only on limit(100), 
    // but since it's an MVP, I'll fetch the last 100 to show some realistic KPI representation.
    const q = query(collection(db, "avaliacoes"), orderBy("timestamp", "desc"), limit(100));
    
    // Set up realtime listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
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

    return () => unsubscribe();
  }, [secret]);

  if (secret !== "123") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white font-sans">
        <h1 className="text-3xl text-red-500 font-bold">401 - Não Autorizado</h1>
      </div>
    );
  }

  // --- KPI Calculus over the loaded snapshot ---
  const total = data.length || 1;
  const boas = data.filter(d => d.nota_geral === "Bom" || d.nota_geral === "Excelente").length;
  const taxaSatisfacao = ((boas / total) * 100).toFixed(1);

  // Worst tag
  const tagCounts: Record<string, number> = {};
  data.forEach(d => {
    if (d.nota_geral === "Péssimo" || d.nota_geral === "Regular") {
      d.tags?.forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    }
  });
  const worstTag = Object.keys(tagCounts).sort((a,b) => tagCounts[b] - tagCounts[a])[0] || "Nenhuma";

  // Best staff member
  const staffCounts: Record<string, number> = {};
  data.forEach(d => {
    if (d.id_funcionario && (d.nota_geral === "Bom" || d.nota_geral === "Excelente")) {
      staffCounts[d.id_funcionario] = (staffCounts[d.id_funcionario] || 0) + 1;
    }
  });
  const bestStaffId = Object.keys(staffCounts).sort((a,b) => staffCounts[b] - staffCounts[a])[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans overflow-auto">
      <header className="mb-10 flex flex-col items-start gap-4 border-b border-zinc-800 pb-6">
        <div className="flex w-full justify-between items-center">
          <h1 className="text-4xl font-bold flex items-center gap-4">
            <Activity className="text-[#10B981] w-10 h-10 animate-pulse" />
            Dashboard Executivo
          </h1>
          <button 
            onClick={() => router.push(`/admin/equipe?secret=${secret}`)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-xl transition-colors border border-zinc-700"
          >
            <Users size={18} /> Gerir Equipe
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full max-w-5xl">
        <div className="bg-zinc-900 border border-[#10B981]/50 rounded-2xl p-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <p className="text-zinc-400 flex items-center gap-2 mb-2"><BarChart3 size={18}/> Índice de Satisfação</p>
          <p className="text-5xl font-bold text-[#10B981]">{total > 1 ? taxaSatisfacao : "--"}%</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 flex items-center gap-2 mb-2"><Activity size={18}/> Área com mais Queixas</p>
          <p className="text-3xl font-bold text-orange-400">{worstTag}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 flex items-center gap-2 mb-2"><Star size={18}/> Colaborador TOP</p>
          <p className="text-3xl font-bold text-blue-400">{bestStaffId ? `ID: ${bestStaffId}` : "--"}</p>
        </div>
      </div>

      <div className="w-full max-w-5xl">
        <h2 className="text-2xl font-bold text-zinc-300 mb-6">Últimas 100 Interações</h2>
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-zinc-500 animate-pulse">Aguardando dados ao vivo...</p>
          ) : (
            data.map((item) => {
              const onlyNumbers = item.contato ? item.contato.replace(/\D/g, "") : "";
              const hasPhone = onlyNumbers.length >= 10; // At least 10 digits for WhatsApp

              return (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4 itens-center justify-start text-lg font-mono flex-wrap">
                  <span className="text-zinc-500 min-w-[200px]">[{item.dateLabel} {item.timeLabel}]</span>
                  <span className={`min-w-[120px] font-bold ${
                    item.nota_geral === 'Péssimo' ? 'text-red-500' :
                    item.nota_geral === 'Regular' ? 'text-orange-400' :
                    item.nota_geral === 'Bom' ? 'text-blue-400' : 'text-[#10B981]'
                  }`}>
                    Experiência: {item.nota_geral || 'N/A'}
                  </span>
                  <span className="text-zinc-300 min-w-[250px]">
                    Tags: {item.tags && item.tags.length > 0 ? item.tags.join(", ") : "--"}
                  </span>
                  <span className="text-[#10B981] flex-1 flex items-center gap-4">
                    {item.contato ? `Contato: ${item.contato}` : ''}
                    {hasPhone && (
                      <a 
                        href={`https://api.whatsapp.com/send?phone=55${onlyNumbers}&text=Ol%C3%A1!%20Sou%20o%20gestor%20da%20academia.%20Recebemos%20seu%20feedback%20no%20totem%20e%20gostaria%20de%20conversar%20mais%20sobre%20sua%20sugest%C3%A3o.`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#10B981] text-zinc-950 px-3 py-1 text-sm font-bold rounded-lg hover:bg-emerald-400 transition flex items-center gap-1"
                      >
                        <MessageCircle size={16} /> Acionar no Zap
                      </a>
                    )}
                  </span>
                </div>
              )
            })
          )}
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

