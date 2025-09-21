'use client';

import React from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Languages, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageSelectorProps {
  variant?: 'select' | 'dropdown' | 'button';
  className?: string;
  showFlag?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'dropdown',
  className = '',
  showFlag = true 
}) => {
  const { language, setLanguage, supportedLanguages } = useTranslation();

  const currentLanguage = supportedLanguages.find(lang => lang.code === language);

  const getFlag = (langCode: string): string => {
    const flags: Record<string, string> = {
      'en': '🇺🇸', // English
      'hi': '🇮🇳', // Hindi - India
      'bn': '🇮🇳', // Bengali - India
      'ta': '🇮🇳', // Tamil - India
      'te': '🇮🇳', // Telugu - India
      'ml': '🇮🇳', // Malayalam - India
      'kn': '🇮🇳', // Kannada - India
      'gu': '🇮🇳', // Gujarati - India
      'mr': '🇮🇳', // Marathi - India
      'or': '🇮🇳', // Odia - India
      'ur': '🇵🇰', // Urdu - Pakistan (also spoken in India)
      'pa': '🇮🇳', // Punjabi - India
      'as': '🇮🇳', // Assamese - India
      // Removed: kok (Konkani) and tcy (Tulu) - not supported by Google Translate API
    };
    return flags[langCode] || '🌐';
  };

  if (variant === 'select') {
    return (
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className={`w-auto min-w-[140px] ${className}`}>
          <div className="flex items-center gap-2">
            {showFlag && <span>{getFlag(language)}</span>}
            <SelectValue>
              {currentLanguage?.nativeName || currentLanguage?.name}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center gap-2">
                {showFlag && <span>{getFlag(lang.code)}</span>}
                <span>{lang.nativeName}</span>
                <span className="text-muted-foreground text-xs">({lang.name})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'button') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Globe className="h-4 w-4 mr-2" />
            {showFlag && <span className="mr-1">{getFlag(language)}</span>}
            <span className="hidden sm:inline">{currentLanguage?.nativeName}</span>
            <span className="sm:hidden">{getFlag(language)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {supportedLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className="flex items-center gap-2"
            >
              {showFlag && <span>{getFlag(lang.code)}</span>}
              <span>{lang.nativeName}</span>
              <span className="text-muted-foreground text-xs ml-auto">
                {lang.name}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`${className} flex items-center gap-2`}>
          <Languages className="h-4 w-4" />
          {showFlag && <span>{getFlag(language)}</span>}
          <span className="hidden md:inline">{currentLanguage?.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center gap-3"
          >
            {showFlag && <span className="text-lg">{getFlag(lang.code)}</span>}
            <div className="flex flex-col">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground">{lang.name}</span>
            </div>
            {lang.code === language && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
