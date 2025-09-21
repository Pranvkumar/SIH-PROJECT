'use client';

import { Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportIncident from '@/components/report-incident';
import { useState } from 'react';

export default function FloatingReportButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Floating Action Button */}
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
                <div className="relative">
                    {/* Pulse animation ring */}
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
                    
                    <Button
                        onClick={() => setOpen(true)}
                        className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                        size="lg"
                    >
                        <Megaphone className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                </div>
            </div>

            {/* Report Incident Dialog */}
            <ReportIncident 
                isOpen={open} 
                onOpenChange={setOpen}
            />
        </>
    );
}
