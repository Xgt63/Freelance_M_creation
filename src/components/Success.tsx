import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export function SuccessView({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-10 md:p-16 text-center"
    >
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Merci pour votre confiance !</h2>
      <p className="text-lg text-gray-600 mb-10">
        Votre brief a bien été envoyé. Je l'étudierai avec attention et je vous recontacterai très prochainement pour discuter de votre projet.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
      >
        Nouveau projet
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
