import React from 'react';
import { motion } from 'motion/react';
import { Download, Sparkles, Target, Palette, Layout, FileText, Briefcase, AlertTriangle, CheckCircle } from 'lucide-react';
import { AIAnalysis } from '../services/ai';
import { FormData } from '../types';

interface ResultProps {
  analysis: AIAnalysis;
  formData: FormData;
  onReset: () => void;
  hideActions?: boolean;
}

export function ResultView({ analysis, formData, onReset, hideActions = false }: ResultProps) {
  if (!analysis || !analysis.needsAnalysis || !analysis.creativeProfile || !analysis.strategicRecommendations) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Analyse indisponible</h3>
        <p className="text-gray-500">Les données d'analyse IA pour ce projet sont incomplètes ou absentes.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 print:space-y-4">
      {/* Header Actions */}
      {!hideActions && (
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={onReset}
            className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            ← Nouveau brief
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exporter en PDF
          </button>
        </div>
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none"
      >
        {/* Header Banner */}
        <div className="bg-zinc-900 p-6 md:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 hidden sm:block">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] md:text-xs font-medium tracking-wider uppercase backdrop-blur-sm">
                  Analyse IA
                </span>
                <span className="text-zinc-400 text-xs md:text-sm">{new Date().toLocaleDateString('fr-FR')}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
                {formData.brandName}
              </h1>
              <p className="text-zinc-400 text-base md:text-lg max-w-xl line-clamp-3 md:line-clamp-none">
                {analysis.finalSummary}
              </p>
            </div>
            
            {/* Score Badge */}
            <div className={`flex flex-row md:flex-col items-center justify-center gap-3 md:gap-1 p-4 rounded-2xl border ${getScoreColor(analysis.score)} print:border-gray-300 print:text-black print:bg-white shrink-0`}>
              <span className="text-2xl md:text-3xl font-bold">{analysis.score}%</span>
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider opacity-80">Score de clarté</span>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {/* Left Column: Needs Analysis */}
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Analyse du besoin</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Type de projet réel</span>
                  <span className="text-gray-900 font-medium">{analysis.needsAnalysis.realProjectType}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Positionnement estimé</span>
                  <span className="text-gray-900 font-medium">{analysis.needsAnalysis.estimatedPositioning}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Complexité</span>
                  <span className="text-gray-900 font-medium">{analysis.needsAnalysis.complexityLevel}</span>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">Profil Créatif</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Orientation</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{analysis.creativeProfile.orientation}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Univers</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{analysis.creativeProfile.universe}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Ton</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{analysis.creativeProfile.tone}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Risque créatif</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{analysis.creativeProfile.creativeRisk}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Style dominant</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{analysis.creativeProfile.dominantStyle}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Strategic Recommendations */}
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-rose-600" />
                <h2 className="text-xl font-semibold text-gray-900">Recommandations Stratégiques</h2>
              </div>
              
              <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 mb-6">
                <h3 className="text-sm font-semibold text-rose-900 mb-2">Direction Artistique</h3>
                <p className="text-sm text-rose-800 leading-relaxed">
                  {analysis.strategicRecommendations.artDirection}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Palette suggérée</h3>
                  <div className="flex gap-3">
                    {analysis.strategicRecommendations.suggestedPalette.map((color, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div 
                          className="w-12 h-12 rounded-full shadow-inner border border-gray-200/50"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-mono text-gray-500">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Typographie recommandée</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {analysis.strategicRecommendations.recommendedTypography}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Mise en page conseillée</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {analysis.strategicRecommendations.advisedLayout}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Moodboard suggéré</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                    "{analysis.strategicRecommendations.suggestedMoodboard}"
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
