import React, { useState, useRef } from 'react';
import { Download, Plus, Trash2, FileText, Printer, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceGeneratorProps {
  initialClientName?: string;
  initialClientAddress?: string;
  initialItems?: InvoiceItem[];
  onSuccess?: () => void;
}

export function InvoiceGenerator({ initialClientName = '', initialClientAddress = '', initialItems, onSuccess }: InvoiceGeneratorProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(`FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState(initialClientName);
  const [clientAddress, setClientAddress] = useState(initialClientAddress);
  const [items, setItems] = useState<InvoiceItem[]>(initialItems || [
    { id: '1', description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const saveTransaction = async (status: 'paid' | 'pending') => {
    setIsSaving(true);
    try {
      const pin = localStorage.getItem('admin_pin') || '';
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-pin': pin
        },
        body: JSON.stringify({
          type: 'income',
          amount: total,
          description: `Facture ${invoiceNumber} - ${clientName}`,
          date: new Date(date).toISOString(),
          status
        })
      });
      if (res.ok) {
        alert(status === 'paid' ? 'Facture enregistrée et payée !' : 'Facture enregistrée en attente.');
        if (onSuccess) onSuccess();
      } else {
        if (res.status === 401) {
          alert('Session expirée ou PIN invalide. Veuillez vous reconnecter.');
          localStorage.removeItem('admin_pin');
          window.location.reload();
        } else {
          alert('Erreur lors de l\'enregistrement');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const exportPDF = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Facture-${invoiceNumber}.pdf`);
  };

  const exportPNG = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = `Facture-${invoiceNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Créateur de Facture
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => saveTransaction('pending')}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-xs md:text-sm font-medium border border-amber-200 whitespace-nowrap"
            >
              Libérer
            </button>
            <button 
              onClick={() => saveTransaction('paid')}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs md:text-sm font-medium whitespace-nowrap"
            >
              Payer
            </button>
            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1" />
            <button 
              onClick={exportPNG}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs md:text-sm font-medium"
            >
              <ImageIcon className="w-4 h-4" />
              PNG
            </button>
            <button 
              onClick={exportPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-xs md:text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Numéro de Facture</label>
              <input 
                type="text" 
                value={invoiceNumber} 
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nom du Client</label>
              <input 
                type="text" 
                placeholder="Ex: Jean Dupont"
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Adresse du Client</label>
              <textarea 
                placeholder="Adresse complète..."
                value={clientAddress} 
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-20 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Articles / Services</h3>
            <button 
              onClick={addItem}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Ajouter une ligne
            </button>
          </div>
          
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50/50 p-3 rounded-xl sm:bg-transparent sm:p-0">
                <div className="flex-1 w-full">
                  <input 
                    type="text" 
                    placeholder="Description du service"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="flex-1 sm:w-20">
                    <input 
                      type="number" 
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                  <div className="flex-1 sm:w-32">
                    <input 
                      type="number" 
                      placeholder="Prix"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span className="font-semibold">{subtotal.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Taxe (%)</span>
              <input 
                type="number" 
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 rounded border border-gray-200 text-right text-sm"
              />
            </div>
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-indigo-600">{total.toLocaleString()} Ar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section (Hidden from view but used for capture) */}
      <div className="mt-12 overflow-x-auto pb-8 no-scrollbar">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Aperçu de la facture</h3>
        <div className="flex justify-start lg:justify-center min-w-[210mm]">
          <div 
            ref={invoiceRef}
            className="w-[210mm] min-h-[297mm] bg-white p-[20mm] shadow-2xl border border-gray-100 text-gray-900 font-sans"
            style={{ backgroundColor: '#ffffff', color: '#111827', borderColor: '#f3f4f6' }}
          >
            <div className="flex justify-between items-start mb-16">
              <div>
                <h1 className="text-3xl font-black tracking-tighter mb-2" style={{ color: '#111827' }}>FACTURE</h1>
                <p className="font-mono text-sm" style={{ color: '#6b7280' }}>#{invoiceNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="font-bold text-xl" style={{ color: '#111827' }}>M Creation Design</h2>
                <p className="text-sm" style={{ color: '#6b7280' }}>Antananarivo, Madagascar</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>contact@mcreation.mg</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-16">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Facturé à</h3>
                <p className="font-bold text-lg" style={{ color: '#111827' }}>{clientName || 'Nom du Client'}</p>
                <p className="whitespace-pre-line" style={{ color: '#6b7280' }}>{clientAddress || 'Adresse du client'}</p>
              </div>
              <div className="text-right">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Détails</h3>
                <p className="text-sm"><span style={{ color: '#9ca3af' }}>Date d'émission:</span> {new Date(date).toLocaleDateString('fr-FR')}</p>
                <p className="text-sm"><span style={{ color: '#9ca3af' }}>Échéance:</span> Immédiate</p>
              </div>
            </div>

            <table className="w-full mb-16">
              <thead>
                <tr className="border-b-2 text-left" style={{ borderColor: '#000000' }}>
                  <th className="py-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#111827' }}>Description</th>
                  <th className="py-4 text-xs font-bold uppercase tracking-widest text-center" style={{ color: '#111827' }}>Qté</th>
                  <th className="py-4 text-xs font-bold uppercase tracking-widest text-right" style={{ color: '#111827' }}>Prix Unitaire</th>
                  <th className="py-4 text-xs font-bold uppercase tracking-widest text-right" style={{ color: '#111827' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: '#f3f4f6' }}>
                    <td className="py-4 text-sm" style={{ color: '#111827' }}>{item.description || 'Description du service'}</td>
                    <td className="py-4 text-sm text-center" style={{ color: '#111827' }}>{item.quantity}</td>
                    <td className="py-4 text-sm text-right" style={{ color: '#111827' }}>{item.unitPrice.toLocaleString()} Ar</td>
                    <td className="py-4 text-sm text-right font-medium" style={{ color: '#111827' }}>{(item.quantity * item.unitPrice).toLocaleString()} Ar</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#9ca3af' }}>Sous-total</span>
                  <span style={{ color: '#111827' }}>{subtotal.toLocaleString()} Ar</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#9ca3af' }}>Taxe ({taxRate}%)</span>
                    <span style={{ color: '#111827' }}>{taxAmount.toLocaleString()} Ar</span>
                  </div>
                )}
                <div className="pt-4 border-t-2 flex justify-between items-center" style={{ borderColor: '#000000' }}>
                  <span className="font-black text-lg uppercase" style={{ color: '#111827' }}>Total</span>
                  <span className="text-2xl font-black" style={{ color: '#111827' }}>{total.toLocaleString()} Ar</span>
                </div>
              </div>
            </div>

            <div className="mt-32 pt-8 border-t text-center" style={{ borderColor: '#f3f4f6' }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#9ca3af' }}>Merci pour votre confiance</p>
              <p className="text-[10px]" style={{ color: '#d1d5db' }}>M Creation Design • SIRET: 123 456 789 00012 • Antananarivo, Madagascar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
