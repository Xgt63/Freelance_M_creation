import { GoogleGenAI, Type } from "@google/genai";

export type AIAnalysis = {
  score: number;
  needsAnalysis: {
    realProjectType: string;
    complexityLevel: string;
    estimatedPositioning: string;
  };
  creativeProfile: {
    orientation: string;
    universe: string;
    tone: string;
    creativeRisk: string;
    dominantStyle: string;
  };
  strategicRecommendations: {
    artDirection: string;
    suggestedPalette: string[];
    recommendedTypography: string;
    advisedLayout: string;
    suggestedMoodboard: string;
  };
  finalSummary: string;
};

// Lazy initialization of Gemini
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // Try both GEMINI_API_KEY and API_KEY (some environments use one or the other)
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      throw new Error("La clé API Gemini n'est pas configurée. Veuillez vous assurer que GEMINI_API_KEY est défini dans les secrets de l'application.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function analyzeBrief(formData: any): Promise<AIAnalysis> {
  const ai = getAI();
  const prompt = `Tu es un directeur artistique senior et expert en stratégie de marque.
Analyse le brief client suivant et fournis une évaluation structurée pour le designer graphique qui va prendre en charge le projet.
Le but est de comprendre l'intention réelle du client, même s'il ne s'exprime pas parfaitement.

Voici les réponses du client au questionnaire :
- Nom de marque : ${formData.brandName}
- Slogan : ${formData.slogan}
- Description du projet : ${formData.description}
- Cible : ${formData.targetAudience}
- Deadline : ${formData.deadline}
- Type de service demandé : ${Array.isArray(formData.serviceType) ? formData.serviceType.join(", ") : formData.serviceType}
- Style graphique souhaité : ${Array.isArray(formData.graphicStyle) ? formData.graphicStyle.join(", ") : formData.graphicStyle}
- Couleurs : ${Array.isArray(formData.selectedColors) ? formData.selectedColors.join(", ") : formData.selectedColors} ${formData.customColors ? `(Précisions : ${formData.customColors})` : ''}
- Typographie : ${Array.isArray(formData.typography) ? formData.typography.join(", ") : formData.typography}
- Références visuelles : ${formData.references}

Génère une analyse détaillée au format JSON avec la structure suivante :
- score: Un score sur 100 évaluant la clarté et la cohérence du brief (ex: 82).
- needsAnalysis:
  - realProjectType: Le type réel de projet détecté (parfois différent de ce que le client demande).
  - complexityLevel: Le niveau de complexité estimé (Faible, Moyen, Élevé, Très Élevé).
  - estimatedPositioning: Le positionnement de marque estimé (ex: "Premium, accessible, B2B technique...").
- creativeProfile:
  - orientation: L'orientation créative globale (ex: "Branding premium minimaliste").
  - universe: L'univers visuel (ex: "Élégant, moderne, épuré").
  - tone: Le ton de la communication (ex: "Sérieux, professionnel").
  - creativeRisk: Le risque créatif à prendre (Faible, Moyen, Élevé).
  - dominantStyle: Le style dominant détecté.
- strategicRecommendations:
  - artDirection: La direction artistique conseillée.
  - suggestedPalette: Un tableau de 3 à 5 codes hexadécimaux suggérés (ex: ["#1A1A1A", "#FFFFFF", "#F27D26"]).
  - recommendedTypography: La typographie recommandée (familles ou noms précis).
  - advisedLayout: La mise en page conseillée.
  - suggestedMoodboard: Une description textuelle d'un moodboard suggéré.
- finalSummary: Un résumé clair et exploitable directement par le designer pour démarrer la création (environ 3-4 phrases).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          needsAnalysis: {
            type: Type.OBJECT,
            properties: {
              realProjectType: { type: Type.STRING },
              complexityLevel: { type: Type.STRING },
              estimatedPositioning: { type: Type.STRING },
            },
            required: ["realProjectType", "complexityLevel", "estimatedPositioning"],
          },
          creativeProfile: {
            type: Type.OBJECT,
            properties: {
              orientation: { type: Type.STRING },
              universe: { type: Type.STRING },
              tone: { type: Type.STRING },
              creativeRisk: { type: Type.STRING },
              dominantStyle: { type: Type.STRING },
            },
            required: ["orientation", "universe", "tone", "creativeRisk", "dominantStyle"],
          },
          strategicRecommendations: {
            type: Type.OBJECT,
            properties: {
              artDirection: { type: Type.STRING },
              suggestedPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedTypography: { type: Type.STRING },
              advisedLayout: { type: Type.STRING },
              suggestedMoodboard: { type: Type.STRING },
            },
            required: ["artDirection", "suggestedPalette", "recommendedTypography", "advisedLayout", "suggestedMoodboard"],
          },
          finalSummary: { type: Type.STRING },
        },
        required: ["score", "needsAnalysis", "creativeProfile", "strategicRecommendations", "finalSummary"],
      },
    },
  });

  const cleanText = (response.text || '{}').replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleanText);
}

export type AIInsights = {
  performanceSummary: string;
  alerts: string[];
  strategicAdvice: string[];
};

export async function getAIInsights(data: any): Promise<AIInsights> {
  if ((!data.clients || data.clients.length === 0) && 
      (!data.projects || data.projects.length === 0) && 
      (!data.transactions || data.transactions.length === 0)) {
    return {
      performanceSummary: "Vous n'avez pas encore assez de données pour générer des insights. Commencez par ajouter des clients ou enregistrer des projets !",
      alerts: ["Données insuffisantes"],
      strategicAdvice: ["Complétez votre profil et ajoutez vos premiers projets pour obtenir des conseils personnalisés."]
    };
  }

  const ai = getAI();
  const prompt = `Tu es un conseiller stratégique pour un designer graphique freelance.
Analyse les données suivantes de son activité et fournis des conseils stratégiques.
Données clients : ${JSON.stringify(data.clients || [])}
Données projets : ${JSON.stringify(data.projects || [])}
Données financières : ${JSON.stringify(data.transactions || [])}

Génère une analyse au format JSON avec la structure suivante :
- performanceSummary: Résumé des performances actuelles.
- alerts: Tableau de chaînes de caractères (ex: ["Baisse de CA ce mois", "Beaucoup de projets en attente"]).
- strategicAdvice: Tableau de conseils pour améliorer l'activité.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          performanceSummary: { type: Type.STRING },
          alerts: { type: Type.ARRAY, items: { type: Type.STRING } },
          strategicAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["performanceSummary", "alerts", "strategicAdvice"],
      },
    },
  });

  const cleanText = (response.text || '{}').replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleanText);
}
