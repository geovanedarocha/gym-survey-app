"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Activity, MessageCircle, BarChart3, Users, Star, LogOut, Bell, BellOff, Save, Info } from "lucide-react";

function AdminDashboardInner() {
  const router = useRouter();
  
  const [data, setData] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertAtivo, setAlertAtivo] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const emailjsConfigured = !!(
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID &&
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID &&
    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
  );

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);

        getDoc(doc(db, "config", "alertas")).then((snap) => {
          if (snap.exists()) {
            const d = snap.data() as { emailGestor?: string; ativo?: boolean };
            setAlertEmail(d.emailGestor ?? "");
            setAlertAtivo(d.ativo ?? false);
          }
        });

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

  if (isAuthenticated === null) {
    return <div className="h-screen bg-zinc-950 flex justify-center items-center text-white">Verificando acesso...</div>;
  }

  if (isAuthenticated === false) {
    return null; // Will redirect
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

  const saveAlertConfig = async () => {
    setAlertSaving(true);
    try {
      await setDoc(doc(db, "config", "alertas"), {
        emailGestor: alertEmail.trim(),
        ativo: alertAtivo,
      });
      setAlertSaved(true);
      setTimeout(() => setAlertSaved(false), 3000);
    } catch (e) {
      console.error("Erro ao salvar configuração de alerta", e);
    } finally {
      setAlertSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans overflow-auto">
      <header className="mb-10 flex flex-col items-start gap-4 border-b border-zinc-800 pb-6">
        <div className="flex w-full justify-between items-center flex-wrap gap-4">
          <h1 className="text-4xl font-bold flex items-center gap-4">
            <Activity className="text-[#10B981] w-10 h-10 animate-pulse" />
            Dashboard Executivo
          </h1>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push(`/admin/equipe`)}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-xl transition-colors border border-zinc-700"
            >
              <Users size={18} /> Gerir Equipe
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 px-4 rounded-xl transition-colors"
            >
              <LogOut size={18} /> Sair
            </button>
          </div>
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

      {/* Alert Config Panel */}
      <div className="w-full max-w-5xl mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              {alertAtivo ? (
                <Bell className="text-amber-400 w-5 h-5" />
              ) : (
                <BellOff className="text-zinc-500 w-5 h-5" />
              )}
              <h2 className="text-lg font-bold text-zinc-200">Alerta Crítico por E-mail</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${alertAtivo ? "bg-amber-500/20 text-amber-400" : "bg-zinc-700 text-zinc-400"}`}>
                {alertAtivo ? "ATIVO" : "INATIVO"}
              </span>
            </div>
            <button
              onClick={() => setAlertAtivo(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${alertAtivo ? "bg-amber-500" : "bg-zinc-700"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alertAtivo ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {!emailjsConfigured && (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm">
                <Info className="text-amber-400 w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-amber-300 space-y-1">
                  <p className="font-semibold">EmailJS não configurado</p>
                  <p className="text-amber-400/80">
                    Para ativar o envio real de e-mails, crie uma conta em{" "}
                    <span className="font-mono text-amber-300">emailjs.com</span>, crie um
                    serviço e template, e defina no seu <span className="font-mono">.env.local</span>:
                  </p>
                  <pre className="mt-2 text-xs bg-zinc-950/60 rounded-lg p-3 text-amber-200 font-mono leading-relaxed">
{`NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxxxx
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxxxx
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx`}
                  </pre>
                  <p className="text-amber-400/70 text-xs">
                    O template deve ter as variáveis: <span className="font-mono">{"{{to_email}}"}</span>,{" "}
                    <span className="font-mono">{"{{alerta}}"}</span>,{" "}
                    <span className="font-mono">{"{{detalhes}}"}</span>,{" "}
                    <span className="font-mono">{"{{tags}}"}</span>,{" "}
                    <span className="font-mono">{"{{timestamp}}"}</span>.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-zinc-400 mb-1.5">
                  E-mail do gestor para receber alertas
                </label>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={e => setAlertEmail(e.target.value)}
                  placeholder="gestor@academia.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={saveAlertConfig}
                  disabled={alertSaving || !alertEmail.trim()}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                    alertSaved
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {alertSaved ? "Salvo!" : alertSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-500">
              O alerta é disparado automaticamente quando 3 ou mais avaliações &quot;Péssimo&quot; consecutivas são registradas no totem.
            </p>
          </div>
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

