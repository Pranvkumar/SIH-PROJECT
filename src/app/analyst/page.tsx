'use client';

import AnalystDashboard from '@/components/analyst-dashboard';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';

export default function AnalystPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          <TranslatedText text="Coastal Hazard Analysis Center" />
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          <TranslatedText text="Review approved reports, assess threats, and issue emergency alerts to coastal communities." />
        </p>
      </div>
      
      <AnalystDashboard />
    </div>
  );
}
