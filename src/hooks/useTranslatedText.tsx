'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

interface UseTranslatedTextReturn {
  translatedText: string;
  isLoading: boolean;
  error: string | null;
}

export const useTranslatedText = (text: string): UseTranslatedTextReturn => {
  const { translate, language } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const translateText = async () => {
      if (language === 'en' || !text.trim()) {
        setTranslatedText(text);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await translate(text);
        setTranslatedText(result);
      } catch (err) {
        setError('Translation failed');
        setTranslatedText(text); // Fallback to original text
      } finally {
        setIsLoading(false);
      }
    };

    translateText();
  }, [text, language, translate]);

  return { translatedText, isLoading, error };
};

// Component wrapper for easy translation
interface TranslatedTextProps {
  children: string;
  className?: string;
  fallback?: string;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  children, 
  className,
  fallback 
}) => {
  const { translatedText, isLoading } = useTranslatedText(children);

  if (isLoading && fallback) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{translatedText}</span>;
};
