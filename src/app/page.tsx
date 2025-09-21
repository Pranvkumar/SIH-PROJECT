
'use client';

import { AuthForm } from '@/components/auth/auth-form';
import { useRouter } from 'next/navigation';
import { Waves } from 'lucide-react';
import { LanguageSelector } from '@/components/language-selector';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';

export default function Home() {
  const router = useRouter();

  const handleAuthSuccess = () => {
    router.push(`/dashboard`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8 font-body">
      {/* Language Selector in top right */}
      <div className="absolute top-4 right-4">
        <LanguageSelector variant="button" />
      </div>
      
       <div className="flex items-center mb-6 md:mb-8">
        <Waves className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
        <h1 className="ml-2 sm:ml-3 md:ml-4 text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-center text-primary">
          CORSAIR
        </h1>
      </div>
      <p className="text-center text-muted-foreground mb-6 md:mb-8 max-w-xs sm:max-w-sm md:max-w-md text-sm sm:text-base px-2">
        <TranslatedText text="A unified platform for reporting and monitoring ocean hazards in real-time." />
      </p>
      <AuthForm onLoginSuccess={handleAuthSuccess} onSignUpSuccess={handleAuthSuccess} />
    </main>
  );
}
