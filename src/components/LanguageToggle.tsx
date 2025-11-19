'use client';

import { useState } from 'react';

type Language = 'eu' | 'es';

export default function LanguageToggle({ 
  onLanguageChange 
}: { 
  onLanguageChange: (lang: Language) => void 
}) {
  const [language, setLanguage] = useState<Language>('eu');

  const toggleLanguage = () => {
    const newLang = language === 'eu' ? 'es' : 'eu';
    setLanguage(newLang);
    onLanguageChange(newLang);
  };

  return (
    <div className="flex items-center justify-end mb-4">
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-2 bg-[#E63946] hover:bg-[#d62e3a] text-white px-4 py-2 rounded-full text-sm font-medium transition"
        aria-label="Cambiar idioma"
      >
        {language === 'eu' ? (
          <>
            <span>🇪🇺</span> Euskara
          </>
        ) : (
          <>
            <span>🇪🇸</span> Castellano
          </>
        )}
      </button>
    </div>
  );
}