import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Save, Lock, ArrowLeft, Bot, Database, Plus, Edit2, Trash2, X } from "lucide-react";

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// Types for our QA Data
interface QAEntry {
  id: number;
  question: string;
  answer: string;
  keywords: string;
  category: string;
  is_active: boolean;
}

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // System Rules State
  const [instructionAr, setInstructionAr] = useState("");
  const [instructionEn, setInstructionEn] = useState("");

  // QA Entries State
  const [qaEntries, setQaEntries] = useState<QAEntry[]>([]);
  const [showQaForm, setShowQaForm] = useState(false);
  const [editingQa, setEditingQa] = useState<Partial<QAEntry>>({
    question: "", answer: "", keywords: "", category: "General", is_active: true
  });
  
  const [filterCategory, setFilterCategory] = useState("All");

  // Force Admin Panel to always be English / Left-to-Right
  useEffect(() => {
    document.documentElement.setAttribute("dir", "ltr");
    document.documentElement.setAttribute("lang", "en");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("Login Failed: " + error.message);
      setIsLoading(false);
    } else {
      setIsAuthenticated(true);
      fetchData();
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const { data: settingsData } = await supabase.from("bot_settings").select("*");
    if (settingsData) {
      setInstructionAr(settingsData.find((row) => row.key === "system_instruction_ar")?.value || "");
      setInstructionEn(settingsData.find((row) => row.key === "system_instruction_en")?.value || "");
    }

    const { data: qaData } = await supabase
      .from("qa_entries")
      .select("*")
      .order("id", { ascending: false });
    if (qaData) setQaEntries(qaData);

    setIsLoading(false);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveStatus("");
    
    const { error: err1 } = await supabase.from("bot_settings").update({ value: instructionAr }).eq("key", "system_instruction_ar");
    const { error: err2 } = await supabase.from("bot_settings").update({ value: instructionEn }).eq("key", "system_instruction_en");
    
    if (err1 || err2) {
      alert(`❌ Access Denied: ${(err1 || err2)?.message}\n\n(Your account does not have permission to modify System Rules.)`);
      setSaveStatus("❌ Update Failed");
    } else {
      setSaveStatus("✅ Rules updated!");
    }
    
    setTimeout(() => setSaveStatus(""), 3000);
    setIsSaving(false);
  };

  const handleSaveQa = async () => {
    if (!editingQa.question || !editingQa.answer) {
      alert("Question and Answer are required!");
      return;
    }

    try {
      if (editingQa.id) {
        // Added .select() to check if the update was silently blocked
        const { data, error } = await supabase.from("qa_entries").update(editingQa).eq("id", editingQa.id).select();
        if (error) throw error;
        if (data && data.length === 0) throw new Error("Action blocked by security policy. Your specific account role does not have permission to edit existing entries.");
      } else {
        const { error } = await supabase.from("qa_entries").insert([editingQa]);
        if (error) throw error;
      }
      
      setShowQaForm(false);
      fetchData();
      
    } catch (error: any) {
      console.error("DATABASE REJECTION:", error);
      alert(`❌ Access Denied: ${error.message}`);
    }
  };
 const handleDeleteQa = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      // NOTE: We added .select() at the end to force Supabase to return what it deleted
      const { data, error } = await supabase.from("qa_entries").delete().eq("id", id).select();
      
      if (error) {
        console.error("DELETE REJECTION:", error);
        alert(`❌ Delete Failed: ${error.message}\n\n(Your account does not have permission to delete entries.)`);
      } else if (data && data.length === 0) {
        // THIS CATCHES THE SILENT FAIL!
        console.warn("SILENT RLS BLOCK: 0 rows deleted");
        alert(`❌ Access Denied: Action blocked by security policy.\n\n(Your account does not have permission to delete entries.)`);
      } else {
        fetchData();
      }
    }
  };
  const openQaForm = (entry?: QAEntry) => {
    setEditingQa(entry || { question: "", answer: "", keywords: "", category: "General", is_active: true });
    setShowQaForm(true);
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-white font-sans">
        <form onSubmit={handleLogin} className="bg-[#140505] p-8 rounded-2xl border border-[#C8102E]/30 shadow-2xl max-w-sm w-full">
          <div className="flex justify-center mb-6 text-[#C8102E]">
            <Lock size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Admin Access</h2>
          
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="University Email..." 
            required
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 mb-4 text-white focus:border-[#C8102E] outline-none transition-colors" 
          />
          
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password..." 
            required
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 mb-6 text-white focus:border-[#C8102E] outline-none transition-colors" 
          />

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#C8102E] hover:bg-[#a00d24] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  // --- DASHBOARD SCREEN ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Bot size={32} className="text-[#C8102E]" />
            <h1 className="text-2xl font-bold">HTU Bot Control Center</h1>
          </div>
          <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Chat</span>
          </button>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin text-[#C8102E] text-4xl">⏳</div>
          </div>
        ) : (
          <div className="space-y-8 pb-20">
            
            {/* SECTION 1: System Rules */}
            <div className="bg-[#140505] border border-[#C8102E]/20 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Bot size={20} className="text-[#C8102E]"/> System Rules (Prompt Engineering)</h2>
              <p className="text-sm text-white/50 mb-6">Manage personality rules. Keep the <code className="bg-black/50 px-1 rounded text-[#C8102E]">{"${HTU_DATASET}"}</code> tag!</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#C8102E] mb-2 text-right">التعليمات الأساسية (عربي)</label>
                  <textarea value={instructionAr} onChange={(e) => setInstructionAr(e.target.value)} dir="rtl" className="w-full h-64 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-sm focus:border-[#C8102E] outline-none resize-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#C8102E] mb-2">System Instructions (English)</label>
                  <textarea value={instructionEn} onChange={(e) => setInstructionEn(e.target.value)} dir="ltr" className="w-full h-64 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-sm focus:border-[#C8102E] outline-none resize-none font-mono" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-4">
                <span className="text-sm font-bold text-green-500">{saveStatus}</span>
                <button onClick={saveSettings} disabled={isSaving} className="bg-[#C8102E] hover:bg-[#a00d24] text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2">
                  <Save size={18} /> Save Rules
                </button>
              </div>
            </div>

            {/* SECTION 2: Knowledge Base */}
            <div className="bg-[#140505] border border-[#C8102E]/20 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><Database size={20} className="text-[#C8102E]"/> Knowledge Base</h2>
                  <p className="text-sm text-white/50">Manage {qaEntries.length} items.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-[#0a0a0a] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#C8102E] cursor-pointer"
                  >
                    {["All", ...Array.from(new Set(qaEntries.map(qa => qa.category)))].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button onClick={() => openQaForm()} className="bg-[#C8102E] hover:bg-[#a00d24] text-white px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm">
                    <Plus size={16} /> Add Question
                  </button>
                </div>
              </div>

              {showQaForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="bg-[#0a0a0a] border border-[#C8102E]/50 rounded-2xl p-6 relative w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95">
                    <button onClick={() => setShowQaForm(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={24}/></button>
                    <h3 className="text-xl font-bold mb-6 text-[#C8102E]">{editingQa.id ? "Edit Entry" : "New Entry"}</h3>
                    <div className="grid md:grid-cols-2 gap-5 mb-6">
                      <div className="col-span-2">
                        <label className="block text-xs text-white/50 mb-1">Question</label>
                        <input type="text" value={editingQa.question} onChange={(e) => setEditingQa({...editingQa, question: e.target.value})} className="w-full bg-[#140505] border border-white/10 rounded-lg p-3 text-sm focus:border-[#C8102E] outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-white/50 mb-1">Answer</label>
                        <textarea value={editingQa.answer} onChange={(e) => setEditingQa({...editingQa, answer: e.target.value})} className="w-full h-24 bg-[#140505] border border-white/10 rounded-lg p-3 text-sm focus:border-[#C8102E] outline-none resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1">Keywords</label>
                        <input type="text" value={editingQa.keywords} onChange={(e) => setEditingQa({...editingQa, keywords: e.target.value})} className="w-full bg-[#140505] border border-white/10 rounded-lg p-3 text-sm focus:border-[#C8102E] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1">Category</label>
                        <input type="text" value={editingQa.category} onChange={(e) => setEditingQa({...editingQa, category: e.target.value})} className="w-full bg-[#140505] border border-white/10 rounded-lg p-3 text-sm focus:border-[#C8102E] outline-none" />
                      </div>
                      <div className="col-span-2 flex items-center gap-3 mt-2 bg-[#140505] border border-white/10 rounded-lg p-3">
                        <input type="checkbox" id="isActive" checked={editingQa.is_active || false} onChange={(e) => setEditingQa({...editingQa, is_active: e.target.checked})} className="w-4 h-4 accent-[#C8102E]" />
                        <label htmlFor="isActive" className="text-sm text-white/80">Active (Visible to students)</label>
                      </div>
                    </div> 
                    <button onClick={handleSaveQa} className="bg-[#C8102E] hover:bg-[#a00d24] text-white px-6 py-2 rounded-lg font-bold w-full">Save Entry</button>
                  </div> 
                </div> 
              )}

              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/50 text-white/50 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3 w-1/3">Question</th>
                      <th className="px-4 py-3 w-1/3">Answer</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-[#0a0a0a]">
                    {(filterCategory === "All" ? qaEntries : qaEntries.filter(qa => qa.category === filterCategory)).map((qa) => (
                      <tr key={qa.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white/30">{qa.id}</td>
                        <td className="px-4 py-3 font-medium line-clamp-2">{qa.question}</td>
                        <td className="px-4 py-3 text-white/60 truncate max-w-[200px]">{qa.answer}</td>
                        <td className="px-4 py-3"><span className="bg-white/10 px-2 py-1 rounded text-xs">{qa.category}</span></td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${qa.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {qa.is_active ? 'ACTIVE' : 'HIDDEN'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                          <button onClick={() => openQaForm(qa)} className="p-1.5 bg-white/10 hover:bg-[#C8102E] rounded"><Edit2 size={14}/></button>
                          <button onClick={() => handleDeleteQa(qa.id)} className="p-1.5 bg-white/10 hover:bg-red-600 rounded"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;