"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      router.push("/admin");
    } catch (err: unknown) {
      console.error(err);
      setError("Credenciais inválidas. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-8">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(16,185,129,0.05)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-[#10B981]">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Acesso Restrito</h1>
          <p className="text-zinc-400 mt-2 text-center">Insira suas credenciais para gerenciar a pesquisa.</p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-500 p-4 rounded-lg mb-6 text-center border border-red-500/50">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-zinc-400 mb-2 font-medium">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 text-white focus:outline-none focus:border-[#10B981] transition-colors"
              placeholder="admin@academia.com"
              required
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-2 font-medium">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 text-white focus:outline-none focus:border-[#10B981] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-lg py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 mt-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            {isLoading ? "Autenticando..." : "Entrar no Painel"}
          </button>
        </form>
      </div>
    </div>
  );
}
