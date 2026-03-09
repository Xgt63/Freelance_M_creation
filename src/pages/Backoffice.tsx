import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Briefcase, TrendingUp, Sparkles, Plus, Search, Filter, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ResultView } from '../components/Result';

export default function Backoffice() {
  const [data, setData] = useState<any>({ clients: [], projects: [], transactions: [] });
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'projects' | 'finance'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchInsights();
  }, []);

  const fetchData = async () => {
    try {
      const pin = localStorage.getItem('admin_pin') || '';
      const res = await fetch('/api/admin/data', {
        headers: { 'x-admin-pin': pin }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('admin_pin');
          window.location.reload();
        }
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Réponse non-JSON reçue:', text.substring(0, 100));
        throw new Error('La réponse du serveur n\'est pas au format JSON');
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Erreur fetchData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const pin = localStorage.getItem('admin_pin') || '';
      const res = await fetch('/api/admin/ai-insights', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-pin': pin
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la récupération des insights');
      }
      
      const json = await res.json();
      setInsights(json);
    } catch (err) {
      console.error(err);
    }
  };

  // Finance calculations
  const paidIncome = data.transactions.filter((t: any) => t.type === 'income' && t.status === 'paid').reduce((acc: number, t: any) => acc + t.amount, 0);
  const pendingIncome = data.transactions.filter((t: any) => t.type === 'income' && t.status === 'pending').reduce((acc: number, t: any) => acc + t.amount, 0);
  const totalExpenses = data.transactions.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0);
  const profit = paidIncome - totalExpenses;

  // Chart data (group by month)
  const chartData = data.transactions.reduce((acc: any[], t: any) => {
    const month = new Date(t.date).toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
    const existing = acc.find(d => d.name === month);
    if (existing) {
      if (t.type === 'income') {
        if (t.status === 'paid') existing.revenus += t.amount;
        else existing.attente += t.amount;
      } else {
        existing.depenses += t.amount;
      }
      existing.benefice = existing.revenus - existing.depenses;
    } else {
      acc.push({
        name: month,
        revenus: (t.type === 'income' && t.status === 'paid') ? t.amount : 0,
        attente: (t.type === 'income' && t.status === 'pending') ? t.amount : 0,
        depenses: t.type === 'expense' ? t.amount : 0,
        benefice: (t.type === 'income' && t.status === 'paid') ? t.amount : (t.type === 'expense' ? -t.amount : 0)
      });
    }
    return acc;
  }, []).reverse();

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    clientName: '',
    description: '',
    amount: '',
    status: 'paid' as 'paid' | 'pending'
  });

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income',
          amount: parseFloat(invoiceForm.amount),
          description: `Facture: ${invoiceForm.clientName} - ${invoiceForm.description}`,
          status: invoiceForm.status
        })
      });
      setShowInvoiceModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openInvoiceFromProject = (project: any) => {
    const client = data.clients.find((c: any) => c.id === project.client_id);
    setInvoiceForm({
      clientName: client?.name || project.brand_name,
      description: `Services pour ${project.brand_name}`,
      amount: '',
      status: 'pending'
    });
    setActiveTab('finance');
    setShowInvoiceModal(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md">
          <div className="bg-red-50 text-red-600 p-3 rounded-full inline-block mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition-all"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Brief IA Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', icon: TrendingUp, label: 'Tableau de bord' },
            { id: 'clients', icon: Users, label: 'Clients' },
            { id: 'projects', icon: Briefcase, label: 'Projets' },
            { id: 'finance', icon: DollarSign, label: 'Finances' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <h1 className="text-3xl font-bold text-gray-900">Vue d'ensemble</h1>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 text-gray-500 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Total Clients</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{data.clients.length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 text-emerald-600 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">Revenus Encaissés</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{paidIncome.toLocaleString()} Ar</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 text-amber-600 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">En attente (Libéré)</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{pendingIncome.toLocaleString()} Ar</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 text-indigo-600 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Bénéfice Net</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{profit.toLocaleString()} Ar</div>
                </div>
              </div>

              {/* AI Insights */}
              {insights && (
                <div className="bg-gradient-to-br from-indigo-900 to-black rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="w-48 h-48" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                        <Sparkles className="w-6 h-6 text-indigo-200" />
                      </div>
                      <h2 className="text-2xl font-bold">Assistant IA Stratégique</h2>
                    </div>
                    
                    <p className="text-indigo-100 text-lg mb-8 max-w-3xl leading-relaxed">
                      {insights.performanceSummary}
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-400" />
                          Alertes & Tendances
                        </h3>
                        <ul className="space-y-3">
                          {insights.alerts.map((alert: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-indigo-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                              {alert}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                          Conseils Stratégiques
                        </h3>
                        <ul className="space-y-3">
                          {insights.strategicAdvice.map((advice: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-indigo-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                              {advice}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Projets & Briefs</h1>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Rechercher..." className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                    <Filter className="w-4 h-4" /> Filtres
                  </button>
                </div>
              </div>

              {selectedProject ? (
                <div className="space-y-6">
                  <button onClick={() => setSelectedProject(null)} className="text-sm font-medium text-gray-500 hover:text-black">← Retour à la liste</button>
                  <ResultView 
                    analysis={selectedProject.ai_analysis} 
                    formData={{
                      brandName: selectedProject.brand_name,
                      slogan: selectedProject.slogan,
                      description: selectedProject.description,
                      targetAudience: selectedProject.target_audience,
                      deadline: selectedProject.deadline,
                      serviceType: selectedProject.service_type,
                      graphicStyle: selectedProject.graphic_style,
                      selectedColors: selectedProject.selected_colors,
                      customColors: selectedProject.custom_colors,
                      typography: selectedProject.typography,
                      references: selectedProject.references_link,
                      clientName: '', email: '', phone: '', otherContact: '', address: ''
                    }}
                    onReset={() => setSelectedProject(null)}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4">Projet</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Deadline</th>
                        <th className="px-6 py-4">Score IA</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.projects.map((project: any) => {
                        const client = data.clients.find((c: any) => c.id === project.client_id);
                        return (
                          <tr key={project.id} className="hover:bg-gray-50 transition-colors group">
                            <td onClick={() => setSelectedProject(project)} className="px-6 py-4 font-medium text-gray-900 cursor-pointer">{project.brand_name}</td>
                            <td onClick={() => setSelectedProject(project)} className="px-6 py-4 text-gray-600 cursor-pointer">{client?.name || 'Inconnu'}</td>
                            <td onClick={() => setSelectedProject(project)} className="px-6 py-4 cursor-pointer">
                              <div className="flex gap-1 flex-wrap">
                                {project.service_type.slice(0, 2).map((t: string) => (
                                  <span key={t} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">{t}</span>
                                ))}
                                {project.service_type.length > 2 && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">+{project.service_type.length - 2}</span>}
                              </div>
                            </td>
                            <td onClick={() => setSelectedProject(project)} className="px-6 py-4 text-gray-600 cursor-pointer">{project.deadline || '-'}</td>
                            <td onClick={() => setSelectedProject(project)} className="px-6 py-4 cursor-pointer">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                project.ai_score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                project.ai_score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {project.ai_score}%
                              </span>
                            </td>
                            <td onClick={() => setSelectedProject(project)} className="px-6 py-4 text-gray-500 cursor-pointer">{new Date(project.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openInvoiceFromProject(project); }}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Créer une facture"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Finance Tab */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Gestion Budgétaire</h1>
                <button 
                  onClick={() => {
                    setInvoiceForm({ clientName: '', description: '', amount: '', status: 'paid' });
                    setShowInvoiceModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4" /> Nouvelle Transaction
                </button>
              </div>

              {/* Finance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 mb-1">Revenus Encaissés</div>
                  <div className="text-2xl font-bold text-emerald-600">{paidIncome.toLocaleString()} Ar</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 mb-1">En attente (Libéré)</div>
                  <div className="text-2xl font-bold text-amber-600">{pendingIncome.toLocaleString()} Ar</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 mb-1">Dépenses</div>
                  <div className="text-2xl font-bold text-red-600">{totalExpenses.toLocaleString()} Ar</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 mb-1">Bénéfice Net</div>
                  <div className="text-2xl font-bold text-indigo-600">{profit.toLocaleString()} Ar</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-6">Évolution Financière</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAttente" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value.toLocaleString()} Ar`, '']}
                      />
                      <Area type="monotone" dataKey="revenus" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenus)" name="Encaissé" />
                      <Area type="monotone" dataKey="attente" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorAttente)" name="En attente" />
                      <Area type="monotone" dataKey="depenses" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDepenses)" name="Dépenses" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold">Transactions Récentes</h3>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Montant</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.transactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{t.description}</td>
                        <td className={`px-6 py-4 font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} Ar
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            t.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {t.status === 'paid' ? 'Payé' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoice Modal */}
          {showInvoiceModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              >
                <h2 className="text-2xl font-bold mb-6">Générer une Facture</h2>
                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <input 
                      type="text" 
                      required
                      value={invoiceForm.clientName}
                      onChange={e => setInvoiceForm({...invoiceForm, clientName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input 
                      type="text" 
                      required
                      value={invoiceForm.description}
                      onChange={e => setInvoiceForm({...invoiceForm, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (Ar)</label>
                    <input 
                      type="number" 
                      required
                      value={invoiceForm.amount}
                      onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => {
                        setInvoiceForm({...invoiceForm, status: 'pending'});
                        // Trigger submit manually or just wait for user to click "Libérer"
                      }}
                      className={`py-3 rounded-xl font-medium transition-all ${
                        invoiceForm.status === 'pending' ? 'bg-amber-100 text-amber-700 border-2 border-amber-500' : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                      }`}
                    >
                      Libérer (En attente)
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setInvoiceForm({...invoiceForm, status: 'paid'});
                      }}
                      className={`py-3 rounded-xl font-medium transition-all ${
                        invoiceForm.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                      }`}
                    >
                      Payer & Enregistrer
                    </button>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowInvoiceModal(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800"
                    >
                      Confirmer
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
