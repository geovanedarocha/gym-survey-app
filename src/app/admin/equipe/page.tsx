"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Users, Upload, Trash2, ArrowLeft, User } from "lucide-react";

function EquipeDashboardInner() {
  const router = useRouter();

  const [staff, setStaff] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        const q = query(collection(db, "colaboradores"), orderBy("nome", "asc"));
        const unsubscribeData = onSnapshot(q, (snapshot) => {
          setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cargo.trim()) return;

    setIsUploading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        // Upload image to Firebase Storage
        const fileRef = ref(storage, `equipe/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(fileRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      await addDoc(collection(db, "colaboradores"), {
        nome,
        cargo,
        image: imageUrl,
      });

      // Clear form
      setNome("");
      setCargo("");
      setImageFile(null);
    } catch (err) {
      console.error("Erro ao adicionar colaborador", err);
      alert("Erro ao adicionar colaborador. Verifique seu console (e se as Storage Rules estão corretas).");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este membro da equipe?")) return;
    try {
      await deleteDoc(doc(db, "colaboradores", id));
    } catch (err) {
      console.error("Erro ao remover", err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <header className="mb-10 flex flex-col gap-4 border-b border-zinc-800 pb-6">
        <button onClick={() => router.push(`/admin`)} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-2 self-start transition-colors">
          <ArrowLeft size={20} /> Voltar ao Painel
        </button>
        <h1 className="text-4xl font-bold flex items-center gap-4">
          <Users className="text-[#10B981] w-10 h-10" />
          Gestão de Equipe
        </h1>
        <p className="text-zinc-400">Adicione ou remova membros da tela do Totem.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Formulário Novo Membro */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl h-fit">
          <h2 className="text-2xl font-semibold mb-6 text-emerald-400">Novo Colaborador</h2>
          <form onSubmit={handleAddSubmit} className="space-y-6">
            <div>
              <label className="block text-zinc-400 mb-2">Nome</label>
              <input 
                type="text" 
                value={nome} 
                onChange={e => setNome(e.target.value)}
                className="w-full bg-zinc-800 border box-border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500" 
                placeholder="Ex: Carlos" 
                maxLength={40}
                required 
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-2">Cargo</label>
              <input 
                type="text" 
                value={cargo} 
                onChange={e => setCargo(e.target.value)}
                className="w-full bg-zinc-800 border box-border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500" 
                placeholder="Ex: Professor" 
                maxLength={40}
                required 
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-2">Foto (Opcional)</label>
              <label className="flex items-center justify-center gap-2 w-full bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-lg p-6 cursor-pointer transition-colors">
                <Upload size={24} className="text-zinc-400" />
                <span className="text-zinc-400">{imageFile ? imageFile.name : "Clique para selecionar"}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <button 
              type="submit" 
              disabled={isUploading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {isUploading ? "Salvando..." : "Adicionar na Tela"}
            </button>
          </form>
        </div>

        {/* Lista de Equipe Atual */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <h2 className="text-2xl font-semibold mb-6 flex justify-between items-center text-zinc-200">
            Equipe Cadastrada 
            <span className="bg-zinc-800 text-emerald-400 text-sm px-3 py-1 rounded-full">{staff.length} Ativos</span>
          </h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {staff.length === 0 && <p className="text-zinc-500">Nenhum colaborador adicionado ainda.</p>}
            {staff.map((member) => (
              <div key={member.id} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                <div className="flex items-center gap-4 border-r pr-4 border-zinc-700/50 w-[70px]">
                  {member.image ? (
                     <img src={member.image} alt="Foto" className="w-12 h-12 rounded-full object-cover bg-zinc-700" />
                  ) : (
                     <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
                       <User size={20} />
                     </div>
                  )}
                </div>
                <div className="flex-1 px-4">
                  <p className="font-bold text-lg">{member.nome}</p>
                  <p className="text-sm text-zinc-400">{member.cargo}</p>
                </div>
                <button 
                  onClick={() => handleRemove(member.id)}
                  className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EquipeDashboard() {
  return (
    <Suspense fallback={<div className="h-screen bg-zinc-950 text-white">Carregando...</div>}>
      <EquipeDashboardInner />
    </Suspense>
  )
}
