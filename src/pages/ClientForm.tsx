import React, { useState } from 'react';
import { BriefForm } from '../components/Form';
import { SuccessView } from '../components/Success';
import { FormData, initialFormData } from '../types';
import { Sparkles } from 'lucide-react';

export default function ClientForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la soumission');
      }

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setIsSuccess(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Brief IA</span>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Designer Graphique
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {!isSuccess ? (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Démarrez votre projet
              </h1>
              <p className="text-lg text-gray-500">
                Remplissez ce court questionnaire pour m'aider à comprendre votre vision. Notre IA analysera vos réponses pour structurer le brief créatif.
              </p>
            </div>
            <BriefForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : (
          <SuccessView onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
