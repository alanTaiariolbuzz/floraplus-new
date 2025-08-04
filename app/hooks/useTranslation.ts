import { translations } from "../translations/reservation";

type Language = "en" | "es";

export const useTranslation = (language: Language) => {
  const t = (key: keyof typeof translations.en) => {
    return translations[language][key];
  };

  return { t };
};
