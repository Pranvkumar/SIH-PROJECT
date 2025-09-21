'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

export function useTranslatedText(text: string): string {
  const { language, translate } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedText(text);
      return;
    }

    const translateText = async () => {
      try {
        const translated = await translate(text);
        setTranslatedText(translated);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedText(text); // Fallback to original text
      }
    };

    translateText();
  }, [text, language, translate]);

  return translatedText;
}

// Hook for translating multiple texts at once
export function useTranslatedTexts(texts: string[]): string[] {
  const { language, translate } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState(texts);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedTexts(texts);
      return;
    }

    const translateTexts = async () => {
      try {
        const promises = texts.map(text => translate(text));
        const results = await Promise.all(promises);
        setTranslatedTexts(results);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedTexts(texts); // Fallback to original texts
      }
    };

    translateTexts();
  }, [texts, language, translate]);

  return translatedTexts;
}

// Simple component for translating inline text
interface TranslatedProps {
  text: string;
  className?: string;
}

export function Translated({ text, className }: TranslatedProps) {
  const translatedText = useTranslatedText(text);
  return <span className={className}>{translatedText}</span>;
}
