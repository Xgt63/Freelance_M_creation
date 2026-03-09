import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

export function ThankYou() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="bg-emerald-100 text-emerald-600 p-4 rounded-full mb-6"
      >
        <CheckCircle2 className="w-12 h-12" />
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
      >
        Merci pour votre confiance !
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-gray-600 max-w-lg mx-auto"
      >
        Votre brief a bien été envoyé. Je vais l'analyser avec soin et je reviendrai vers vous très prochainement pour discuter de votre projet.
      </motion.p>
    </div>
  );
}
