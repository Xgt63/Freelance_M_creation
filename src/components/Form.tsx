import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Upload, Link } from 'lucide-react';
import { FormData } from '../types';

interface FormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const SERVICE_TYPES = ['Logo', 'Affiche', 'Flyer', 'Identité visuelle', 'Réseaux sociaux', 'Autre'];

const TYPOGRAPHIES = [
  { id: 'Serif', label: 'Serif', desc: 'Classique, Élégant', class: 'font-["Playfair_Display",_serif]' },
  { id: 'Sans serif', label: 'Sans serif', desc: 'Moderne, Épuré', class: 'font-sans' },
  { id: 'Script', label: 'Script', desc: 'Manuscrit, Créatif', class: 'font-["Pacifico",_cursive]' },
  { id: 'Display', label: 'Display', desc: 'Impactant, Original', class: 'font-["Bebas_Neue",_sans-serif] tracking-wider' },
  { id: 'Aucune préférence', label: 'Aucune', desc: 'Laissez le designer choisir', class: 'font-sans text-gray-300' },
];

const PREDEFINED_COLORS = [
  { id: 'Rouge', hex: '#EF4444' },
  { id: 'Bleu', hex: '#3B82F6' },
  { id: 'Vert', hex: '#10B981' },
  { id: 'Jaune', hex: '#F59E0B' },
  { id: 'Violet', hex: '#8B5CF6' },
  { id: 'Rose', hex: '#EC4899' },
  { id: 'Noir', hex: '#171717' },
  { id: 'Blanc', hex: '#FFFFFF', border: true },
  { id: 'Or', hex: '#D4AF37' },
];

export function BriefForm({ formData, setFormData, onSubmit, isSubmitting }: FormProps) {
  const [step, setStep] = useState(1);
  const [graphicStyles, setGraphicStyles] = useState<{ id: string, label: string, image: string }[]>([]);
  const totalSteps = 3;

  React.useEffect(() => {
    fetch('/api/graphic-styles')
      .then(res => res.json())
      .then(data => {
        setGraphicStyles(data.map((s: any) => ({
          id: s.name,
          label: s.name,
          image: s.image_url
        })));
      })
      .catch(err => console.error('Error fetching styles:', err));
  }, []);

  const handleNext = () => setStep((s) => Math.min(s + 1, totalSteps));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
          <span>Étape {step} sur {totalSteps}</span>
          <span>{step === 1 ? 'Le Projet' : step === 2 ? 'Le Style' : 'Validation'}</span>
        </div>
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-black"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Vos Coordonnées</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Votre Nom / Entreprise *</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  placeholder="Ex: jean@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Numéro de téléphone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  placeholder="Ex: +261 34 00 000 00"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Autre moyen de contact</label>
                <input
                  type="text"
                  name="otherContact"
                  value={formData.otherContact}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  placeholder="Ex: WhatsApp, Telegram, Skype..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Adresse complète</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none"
                placeholder="Votre adresse physique ou celle de l'entreprise"
              />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-6 mt-10">Parlez-moi de votre projet</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nom de la marque / du projet *</label>
                <input
                  type="text"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  placeholder="Ex: Studio Nova"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Slogan (optionnel)</label>
                <input
                  type="text"
                  name="slogan"
                  value={formData.slogan}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  placeholder="Ex: L'art de la simplicité"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description du projet *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none"
                placeholder="Décrivez votre besoin en quelques phrases..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Cible (Qui sont vos clients ?)</label>
              <input
                type="text"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                placeholder="Ex: Jeunes actifs 25-35 ans, urbains"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Deadline souhaitée</label>
              <input
                type="text"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                placeholder="Ex: Fin du mois prochain"
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Direction Artistique</h2>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Type de service (plusieurs choix possibles)</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleMultiSelect('serviceType', type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.serviceType.includes(type)
                        ? 'bg-black text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Style graphique recherché</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {graphicStyles.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => handleMultiSelect('graphicStyle', style.id)}
                    className={`relative group overflow-hidden rounded-xl border-2 text-left transition-all ${
                      formData.graphicStyle.includes(style.id)
                        ? 'border-black ring-2 ring-black/20'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full relative">
                      <img src={style.image} alt={style.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{style.label}</span>
                        {formData.graphicStyle.includes(style.id) && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Typographie préférée</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {TYPOGRAPHIES.map((typo) => (
                  <button
                    key={typo.id}
                    type="button"
                    onClick={() => handleMultiSelect('typography', typo.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center justify-center gap-3 ${
                      formData.typography.includes(typo.id)
                        ? 'border-black bg-gray-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`text-4xl ${typo.class}`}>Aa</div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">{typo.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{typo.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Couleurs</label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {PREDEFINED_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => handleMultiSelect('selectedColors', color.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                        color.border ? 'border border-gray-200' : ''
                      } ${formData.selectedColors.includes(color.id) ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                      style={{ backgroundColor: color.hex }}
                      title={color.id}
                    >
                      {formData.selectedColors.includes(color.id) && (
                        <CheckCircle2 className={`w-5 h-5 ${color.id === 'Blanc' || color.id === 'Jaune' ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  name="customColors"
                  value={formData.customColors}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm"
                  placeholder="Une autre couleur en tête ? (ex: Bleu canard, Vert pastel...)"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Derniers détails</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Références visuelles (Liens vers Pinterest, Drive, etc.)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="references"
                  value={formData.references}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  placeholder="https://..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Collez ici les liens vers vos inspirations ou moodboards.</p>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 mt-8">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-indigo-900 mb-1">Analyse IA de votre brief</h3>
                  <p className="text-sm text-indigo-700/80 leading-relaxed">
                    En soumettant ce formulaire, notre intelligence artificielle va analyser vos réponses pour structurer votre demande et proposer une direction créative optimale à notre designer.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 1 || isSubmitting}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            step === 1 || isSubmitting ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={step === 1 && (!formData.brandName || !formData.description)}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyse en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Soumettre le brief</span>
                    </>
                  )}
                </button>
        )}
      </div>
    </div>
  );
}
