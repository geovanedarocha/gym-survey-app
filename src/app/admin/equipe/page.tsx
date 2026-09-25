"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Users, Trash2, ArrowLeft, User, Camera, X, Pencil, Check, Sparkles, Music } from "lucide-react";

// Comprime e redimensiona imagem para base64 (máx 300x300, JPEG 82%)
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else        { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ──────────────────────────────────────────────
// Modal de Edição
// ──────────────────────────────────────────────
function EditModal({ member, onClose, onSave }: {
  member: any;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
}) {
  const [nome, setNome] = useState(member.nome);
  const [cargo, setCargo] = useState(member.cargo);
  const [setor, setSetor] = useState(member.setor);
  const [preview, setPreview] = useState<string>(member.image || "");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Selecione uma imagem válida."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Máximo 10MB."); return; }
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
    } catch { alert("Erro ao processar imagem."); }
    finally { setIsCompressing(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cargo.trim()) return;
    setIsSaving(true);
    try {
      await onSave(member.id, { nome, cargo, setor, image: preview });
      onClose();
    } catch { alert("Erro ao salvar. Tente novamente."); }
    finally { setIsSaving(false); }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Pencil size={18} className="text-emerald-400" />
            Editar Colaborador
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Foto */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Foto</label>
            <div className="flex items-center gap-4">
              {/* Avatar preview */}
              <div className="relative flex-shrink-0">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-4 border-emerald-500/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center">
                    <User size={28} className="text-zinc-500" />
                  </div>
                )}
                {/* Botão câmera sobreposto */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center transition-colors shadow-lg disabled:opacity-50"
                >
                  {isCompressing
                    ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Camera size={13} />
                  }
                </button>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors disabled:opacity-50"
                >
                  {isCompressing ? "Processando..." : preview ? "Trocar foto" : "Adicionar foto"}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={() => setPreview("")}
                    className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm text-red-400 transition-colors"
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
          </div>

          {/* Nome */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
              maxLength={40}
              required
            />
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Cargo / Nome da Aula</label>
            <input
              type="text"
              value={cargo}
              onChange={e => setCargo(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
              placeholder={setor === 'coletiva' ? 'Ex: Ritmos, Zumba' : 'Ex: Professor'}
              maxLength={40}
              required
            />
          </div>

          {/* Setor */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Setor / Função</label>
            <select
              value={setor}
              onChange={e => setSetor(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="recepcao">Recepção</option>
              <option value="musculacao">Sala de Musculação (Professor)</option>
              <option value="coletiva">Aulas Coletivas (Professor)</option>
              <option value="limpeza">Limpeza</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isCompressing}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
              ) : (
                <><Check size={18} /> Salvar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────
function EquipeDashboardInner() {
  const router = useRouter();

  const [staff, setStaff] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [unitId, setUnitId] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [setor, setSetor] = useState("recepcao");
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edição
  const [editingMember, setEditingMember] = useState<any | null>(null);

  useEffect(() => {
    let unsubscribeData: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        const userEmail = (user.email || "").toLowerCase().trim();
        setUnitId(userEmail);

        if (unsubscribeData) {
          unsubscribeData();
        }

        const q = query(collection(db, "colaboradores"), where("unit_id", "==", userEmail));
        unsubscribeData = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          list.sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || ""));
          setStaff(list);
        }, (err) => {
          if (err.code !== "permission-denied") {
            console.error("Erro ao carregar colaboradores:", err);
          }
        });
      } else {
        if (unsubscribeData) {
          unsubscribeData();
          unsubscribeData = null;
        }
        setStaff([]);
        setIsAuthenticated(false);
        router.push("/admin/login");
      }
    });

    return () => {
      if (unsubscribeData) {
        unsubscribeData();
      }
      unsubscribeAuth();
    };
  }, [router]);

  if (isAuthenticated === null) {
    return <div className="h-screen bg-zinc-950 flex justify-center items-center text-white">Verificando acesso...</div>;
  }
  if (isAuthenticated === false) return null;

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Selecione uma imagem válida."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Máximo 10MB."); return; }
    setIsCompressing(true);
    try { setPreview(await compressImage(file)); }
    catch { alert("Erro ao processar imagem."); }
    finally { setIsCompressing(false); }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cargo.trim()) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "colaboradores"), {
        nome: nome.trim(),
        cargo: cargo.trim(),
        image: preview,
        setor,
        unit_id: unitId.toLowerCase().trim(),
      });
      setNome(""); setCargo(""); setPreview(""); setSetor("recepcao");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar colaborador.");
    } finally { setIsSaving(false); }
  };

  const handleSaveEdit = async (id: string, data: any) => {
    const ref = doc(db, "colaboradores", id);
    await updateDoc(ref, data);
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este membro da equipe?")) return;
    try { await deleteDoc(doc(db, "colaboradores", id)); }
    catch (err) { console.error(err); }
  };

  const setBadge = (s: string) => {
    if (s === 'recepcao') return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    if (s === 'coletiva') return 'bg-pink-500/20 text-pink-400 border border-pink-500/30';
    if (s === 'limpeza') return 'bg-teal-500/20 text-teal-400 border border-teal-500/30';
    return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
  };
  const setLabel = (s: string) => {
    if (s === 'recepcao') return 'Recepção';
    if (s === 'coletiva') return 'Aulas Coletivas';
    if (s === 'limpeza') return 'Limpeza';
    return 'Musculação';
  };

  const SECTORS = [
    { key: "recepcao", title: "Recepção", icon: Users, color: "text-purple-400", bgBadge: "bg-purple-500/10 text-purple-400" },
    { key: "musculacao", title: "Sala de Musculação", icon: User, color: "text-orange-400", bgBadge: "bg-orange-500/10 text-orange-400" },
    { key: "coletiva", title: "Aulas Coletivas", icon: Music, color: "text-pink-400", bgBadge: "bg-pink-500/10 text-pink-400" },
    { key: "limpeza", title: "Limpeza", icon: Sparkles, color: "text-teal-400", bgBadge: "bg-teal-500/10 text-teal-400" },
  ];

  return (
    <>
      {/* Modal de edição */}
      {editingMember && (
        <EditModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleSaveEdit}
        />
      )}

      <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
        <header className="mb-10 flex flex-col gap-4 border-b border-zinc-800 pb-6">
          <button onClick={() => router.push(`/admin`)} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-2 self-start transition-colors">
            <ArrowLeft size={20} /> Voltar ao Painel
          </button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-4">
                <Users className="text-[#10B981] w-10 h-10" />
                Gestão de Equipe
              </h1>
              <p className="text-zinc-400 mt-1">Adicione, edite ou remova membros da tela do Totem.</p>
            </div>
            {unitId && (
              <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2 text-sm self-start md:self-auto shadow-sm">
                <span className="text-zinc-400">Unidade:</span>
                <span className="font-mono text-emerald-400 font-semibold">{unitId}</span>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Formulário Novo Membro */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl h-fit">
            <h2 className="text-2xl font-semibold mb-6 text-emerald-400">Novo Colaborador</h2>
            <form onSubmit={handleAddSubmit} className="space-y-6">

              {/* Foto */}
              <div>
                <label className="block text-zinc-400 mb-2">Foto (Opcional)</label>
                {preview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <img src={preview} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500/40" />
                      <button
                        type="button"
                        onClick={() => { setPreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-zinc-500 hover:text-zinc-300 underline transition-colors">
                      Trocar foto
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-zinc-700 hover:border-emerald-500/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
                  >
                    {isCompressing ? (
                      <>
                        <div className="w-14 h-14 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                        <p className="text-zinc-400 text-sm">Processando imagem...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-zinc-800 group-hover:bg-zinc-700 rounded-full flex items-center justify-center transition-colors">
                          <Camera size={28} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <p className="text-zinc-400 text-sm text-center">
                          <span className="text-emerald-400 font-semibold">Clique para enviar</span> ou arraste a foto aqui
                        </p>
                        <p className="text-zinc-600 text-xs">JPG, PNG, WebP — máx. 10MB</p>
                      </>
                    )}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
              </div>

              <div>
                <label className="block text-zinc-400 mb-2">Nome</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                  className="w-full bg-zinc-800 border box-border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Carlos" maxLength={40} required />
              </div>
              <div>
                <label className="block text-zinc-400 mb-2">Cargo / Função / Nome da Aula</label>
                <input type="text" value={cargo} onChange={e => setCargo(e.target.value)}
                  className="w-full bg-zinc-800 border box-border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder={
                    setor === 'coletiva' ? 'Ex: Ritmos, Zumba, Spinning' : 
                    setor === 'limpeza' ? 'Ex: Auxiliar de Limpeza' : 
                    setor === 'recepcao' ? 'Ex: Recepcionista' : 'Ex: Professor'
                  } 
                  maxLength={40} required />
              </div>
              <div>
                <label className="block text-zinc-400 mb-2">Setor / Função</label>
                <select value={setor} onChange={e => setSetor(e.target.value)}
                  className="w-full bg-zinc-800 border box-border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500" required>
                  <option value="recepcao">Recepção</option>
                  <option value="musculacao">Sala de Musculação (Professor)</option>
                  <option value="coletiva">Aulas Coletivas (Professor)</option>
                  <option value="limpeza">Limpeza</option>
                </select>
              </div>

              <button type="submit" disabled={isSaving || isCompressing}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
                {isSaving ? "Salvando..." : "Adicionar na Tela"}
              </button>
            </form>
          </div>

          {/* Lista de Equipe Agrupada por Setor */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col gap-6 h-fit">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-semibold text-zinc-200">
                Equipe por Setor
              </h2>
              <span className="bg-zinc-800 text-emerald-400 text-sm font-semibold px-3 py-1 rounded-full border border-zinc-700">
                {staff.length} {staff.length === 1 ? 'Colaborador' : 'Colaboradores'}
              </span>
            </div>

            {staff.length === 0 ? (
              <p className="text-zinc-500 py-8 text-center">Nenhum colaborador adicionado ainda.</p>
            ) : (
              <div className="space-y-5 max-h-[720px] overflow-y-auto pr-2 custom-scrollbar">
                {SECTORS.map((sector) => {
                  const membersInSector = staff.filter((m) => (m.setor || "recepcao") === sector.key);
                  const SectorIcon = sector.icon;

                  return (
                    <div key={sector.key} className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 shadow-sm">
                      {/* Cabeçalho do Setor */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60">
                        <div className="flex items-center gap-2">
                          <SectorIcon size={18} className={sector.color} />
                          <h3 className={`font-bold text-sm tracking-wide ${sector.color}`}>
                            {sector.title}
                          </h3>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${sector.bgBadge}`}>
                          {membersInSector.length} {membersInSector.length === 1 ? 'membro' : 'membros'}
                        </span>
                      </div>

                      {/* Lista de Membros do Setor */}
                      {membersInSector.length === 0 ? (
                        <p className="text-zinc-600 text-xs italic py-2 pl-1">
                          Nenhum colaborador cadastrado neste setor.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {membersInSector.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                              {/* Foto */}
                              <div className="flex-shrink-0">
                                {member.image ? (
                                  <img
                                    src={member.image}
                                    alt={member.nome}
                                    className="w-11 h-11 rounded-full object-cover bg-zinc-800 border-2 border-zinc-700"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-400">
                                    <User size={18} />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-zinc-100 truncate">{member.nome}</p>
                                <p className="text-xs text-zinc-400 truncate mt-0.5">{member.cargo}</p>
                              </div>

                              {/* Ações */}
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => setEditingMember(member)}
                                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => handleRemove(member.id)}
                                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                  title="Remover"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function EquipeDashboard() {
  return (
    <Suspense fallback={<div className="h-screen bg-zinc-950 text-white">Carregando...</div>}>
      <EquipeDashboardInner />
    </Suspense>
  );
}
