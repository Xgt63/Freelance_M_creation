import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Briefcase, TrendingUp, Sparkles, Plus, Search, Filter, Calendar, DollarSign, ChevronDown, ChevronUp, Bell, FileText, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { io } from 'socket.io-client';
import { ResultView } from './Result';
import { getAIInsights, AIInsights } from '../services/ai';
import { InvoiceGenerator } from './InvoiceGenerator';

export function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clients' | 'finance' | 'ai'>('clients');
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [invoicingProject, setInvoicingProject] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    fetchData(isMounted);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Connect to Socket.io
    const socket = io();
    socket.on('new_project', (project) => {
      if (!isMounted) return;
      const message = `Nouveau projet: ${project.brandName} par ${project.clientName}`;
      setNotifications(prev => [message, ...prev]);
      
      // Refresh data
      fetchData(isMounted);

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('M Creation Design App', {
          body: message,
          icon: '/logo.svg'
        });
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  const fetchData = async (isMounted: boolean = true) => {
    try {
      const pin = localStorage.getItem('admin_pin') || '';
      const res = await fetch('/api/admin/data', {
        headers: { 'x-admin-pin': pin }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('admin_pin');
          if (isMounted) window.location.reload();
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
      if (isMounted) {
        setData(json);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Erreur fetchData:', err);
      if (isMounted) {
        setError(err.message);
        setLoading(false);
      }
    }
  };

  const fetchInsights = async () => {
    if (!data) return;
    setInsightsError(null);
    try {
      const result = await getAIInsights(data);
      setInsights(result);
    } catch (err: any) {
      console.error(err);
      setInsightsError(err.message || "Impossible de générer les insights IA.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md">
          <div className="bg-red-50 text-red-600 p-3 rounded-full inline-block mb-4">
            <Users className="w-8 h-8" />
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

  const { clients = [], projects = [], transactions = [] } = data || {};

  // Process chart data
  const chartData = transactions.reduce((acc: any[], t: any) => {
    const date = new Date(t.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      if (t.type === 'income') {
        if (t.status === 'paid') existing.revenus += t.amount;
        else existing.pending += t.amount;
      }
      else existing.depenses += t.amount;
      existing.benefice = existing.revenus - existing.depenses;
    } else {
      acc.push({
        date,
        revenus: (t.type === 'income' && t.status === 'paid') ? t.amount : 0,
        pending: (t.type === 'income' && t.status === 'pending') ? t.amount : 0,
        depenses: t.type === 'expense' ? t.amount : 0,
        benefice: (t.type === 'income' && t.status === 'paid') ? t.amount : (t.type === 'expense' ? -t.amount : 0)
      });
    }
    return acc;
  }, []).reverse();

  const totalRevenus = transactions.filter((t: any) => t.type === 'income' && t.status === 'paid').reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalEnAttente = transactions.filter((t: any) => t.type === 'income' && t.status === 'pending').reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalDepenses = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0);

  const filteredProjects = projects.filter((p: any) => {
    const client = clients.find((c: any) => c.id === p.client_id);
    const serviceTypes = Array.isArray(p.service_type) ? p.service_type : [];
    const searchStr = `${p.brand_name} ${client?.name} ${serviceTypes.join(' ')}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar / Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button 
              onClick={() => window.location.href = '/'}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              title="Retour au site"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-black text-white p-1.5 rounded-lg">
                <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="font-bold text-base md:text-lg tracking-tight hidden sm:inline">Freelance OS</span>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {notifications.length > 0 && (
              <div className="relative mr-2 shrink-0">
                <Bell className="w-5 h-5 text-indigo-600 animate-bounce" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {notifications.length}
                </span>
              </div>
            )}
            <button onClick={() => setActiveTab('clients')} className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors shrink-0 ${activeTab === 'clients' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
              Clients
            </button>
            <button onClick={() => setActiveTab('finance')} className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors shrink-0 ${activeTab === 'finance' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
              Finances
            </button>
            <button onClick={() => { setActiveTab('ai'); if (!insights) fetchInsights(); }} className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shrink-0 ${activeTab === 'ai' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}>
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              IA
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB: CLIENTS */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Projets Récents</h1>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredProjects.map((project: any) => {
                const client = clients.find((c: any) => c.id === project.client_id);
                const isExpanded = expandedProject === project.id;
                
                return (
                  <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div 
                      className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors gap-4"
                      onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg md:text-xl font-bold text-gray-400 shrink-0">
                          {project.brand_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{project.brand_name}</h3>
                          <div className="text-xs md:text-sm text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                            <span className="font-medium text-gray-700 truncate">{client?.name}</span>
                            <span className="hidden xs:inline">•</span>
                            <span className="truncate">{new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-6">
                        <div className="text-right hidden lg:block">
                          <div className="text-sm font-medium text-gray-900">{project.deadline}</div>
                          <div className="text-xs text-gray-500">Deadline</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setInvoicingProject(project);
                              setActiveTab('finance');
                            }}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Facture"
                          >
                            <FileText className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <div className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium ${project.ai_score >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            <span>{project.ai_score}%</span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 p-6 bg-gray-50/50">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Client Info */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Contact Client</h4>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3 text-sm">
                              <div><span className="text-gray-500 block text-xs">Nom</span>{client?.name}</div>
                              <div><span className="text-gray-500 block text-xs">Email</span>{client?.email}</div>
                              <div><span className="text-gray-500 block text-xs">Téléphone</span>{client?.phone}</div>
                              {client?.other_contact && <div><span className="text-gray-500 block text-xs">Autre contact</span>{client.other_contact}</div>}
                              {client?.address && <div><span className="text-gray-500 block text-xs">Adresse</span>{client.address}</div>}
                            </div>
                          </div>
                          
                          {/* Brief Recap */}
                          <div className="lg:col-span-2 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Analyse IA du Brief</h4>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                               <ResultView 
                                 analysis={project.ai_analysis || {}} 
                                 formData={{...project, serviceType: project.service_type, graphicStyle: project.graphic_style, selectedColors: project.selected_colors, customColors: project.custom_colors, typography: project.typography, brandName: project.brand_name}} 
                                 onReset={() => {}} 
                                 hideActions={true}
                               />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredProjects.length === 0 && (
                <div className="text-center py-12 text-gray-500">Aucun projet trouvé.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB: FINANCE */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Gestion Budgétaire</h1>
              {invoicingProject && (
                <button 
                  onClick={() => setInvoicingProject(null)}
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  Annuler la pré-saisie
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-xs md:text-sm font-medium text-gray-500 mb-2">Revenus Encaissés</div>
                <div className="text-xl md:text-2xl font-bold text-emerald-600"><span>{totalRevenus.toLocaleString()} Ar</span></div>
              </div>
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-xs md:text-sm font-medium text-gray-500 mb-2">En attente</div>
                <div className="text-xl md:text-2xl font-bold text-amber-600"><span>{totalEnAttente.toLocaleString()} Ar</span></div>
              </div>
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-xs md:text-sm font-medium text-gray-500 mb-2">Dépenses Totales</div>
                <div className="text-xl md:text-2xl font-bold text-rose-600"><span>{totalDepenses.toLocaleString()} Ar</span></div>
              </div>
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-xs md:text-sm font-medium text-gray-500 mb-2">Bénéfice Net</div>
                <div className="text-xl md:text-2xl font-bold text-gray-900"><span>{(totalRevenus - totalDepenses).toLocaleString()} Ar</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-[400px]">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Évolution de la comptabilité</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} Ar`, '']}
                  />
                  <Area type="monotone" dataKey="revenus" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenus)" name="Revenus Encaissés" />
                  <Area type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorPending)" name="En attente" />
                  <Area type="monotone" dataKey="depenses" stroke="#EF4444" strokeWidth={2} fill="none" name="Dépenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Transactions Récentes</h3>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Payé
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> En attente
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(t.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {t.description}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            t.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {t.status === 'paid' ? 'Payé' : 'En attente'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold text-right ${
                          t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} Ar
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <InvoiceGenerator 
                initialClientName={invoicingProject ? clients.find((c: any) => c.id === invoicingProject.client_id)?.name : ''}
                initialClientAddress={invoicingProject ? clients.find((c: any) => c.id === invoicingProject.client_id)?.address : ''}
                initialItems={invoicingProject ? [{ id: '1', description: `Projet ${invoicingProject.brand_name} - ${invoicingProject.service_type.join(', ')}`, quantity: 1, unitPrice: 0 }] : undefined}
                onSuccess={() => {
                  setInvoicingProject(null);
                  fetchData();
                }}
              />
            </div>
          </div>
        )}

        {/* TAB: AI INSIGHTS */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Conseiller Stratégique IA
            </h1>
            
            {insightsError ? (
              <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-red-700 flex items-center gap-4">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Erreur lors de la génération des insights</p>
                  <p className="text-sm opacity-90">{insightsError}</p>
                </div>
                <button 
                  onClick={fetchInsights}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-xl text-sm font-medium transition-colors"
                >
                  Réessayer
                </button>
              </div>
            ) : !insights ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">L'IA analyse vos données globales (clients, projets, finances)...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé des performances</h2>
                    <p className="text-gray-600 leading-relaxed">{insights.performanceSummary}</p>
                  </div>
                  
                  <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-100">
                    <h2 className="text-lg font-semibold text-indigo-900 mb-4">Conseils Stratégiques</h2>
                    <ul className="space-y-4">
                      {insights.strategicAdvice.map((advice: string, i: number) => (
                        <li key={i} className="flex gap-3 text-indigo-800">
                          <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">{i+1}</span>
                          <span className="leading-relaxed">{advice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                    <h2 className="text-lg font-semibold text-rose-900 mb-4 flex items-center gap-2">
                      Alertes & Points d'attention
                    </h2>
                    <ul className="space-y-3">
                      {insights.alerts.map((alert: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-rose-800 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <span>{alert}</span>
                        </li>
                      ))}
                      {insights.alerts.length === 0 && (
                        <li className="text-emerald-700 text-sm">Aucune alerte détectée. Tout va bien !</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
