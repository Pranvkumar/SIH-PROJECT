
'use client';

import React, { useState } from 'react';
import { SignUpForm } from './sign-up-form';
import { SignInForm } from './sign-in-form';
import { Button } from '@/components/ui/button';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';

interface AuthFormProps {
  onLoginSuccess: () => void;
  onSignUpSuccess: () => void;
}


export function AuthForm({ onLoginSuccess, onSignUpSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-4xl">
      {/* Mobile/Tablet Vertical Layout (sm and below) */}
      <div className="lg:hidden">
        <div className="bg-card rounded-xl shadow-xl relative overflow-hidden w-full min-h-[500px]">
          {!isSignUp ? (
            <div className="p-6 auth-slide-in-left">
              <SignInForm onLoginSuccess={onLoginSuccess} />
            </div>
          ) : (
            <div className="p-6 auth-slide-in-right">
              <SignUpForm onSignUpSuccess={onSignUpSuccess} />
            </div>
          )}
          
          {/* Mobile Toggle Section */}
          <div className="border-t bg-muted/30 p-4 text-center">
            {isSignUp ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  <TranslatedText text="Already have an account?" />
                </p>
                <Button 
                  variant="outline" 
                  className="w-full transition-all duration-200 hover:scale-[1.02]" 
                  onClick={() => setIsSignUp(false)}
                >
                  <TranslatedText text="Sign In" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  <TranslatedText text="Don't have an account?" />
                </p>
                <Button 
                  variant="outline" 
                  className="w-full transition-all duration-200 hover:scale-[1.02]" 
                  onClick={() => setIsSignUp(true)}
                >
                  <TranslatedText text="Sign Up" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Horizontal Layout (lg and above) */}
      <div 
        className={`hidden lg:block bg-card rounded-2xl shadow-2xl relative overflow-hidden w-full min-h-[550px] ${
          isSignUp ? 'right-panel-active' : ''
        }`}
      >
        <div className="form-container-base sign-up-container">
          <SignUpForm onSignUpSuccess={onSignUpSuccess} />
        </div>
        <div className="form-container-base sign-in-container">
          <SignInForm onLoginSuccess={onLoginSuccess} />
        </div>
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="text-3xl font-bold font-headline">
                <TranslatedText text="Welcome Back!" />
              </h1>
              <p className="text-sm font-extralight leading-snug mt-5 mb-8">
                <TranslatedText text="Sign in to access your dashboard and view real-time ocean hazard data." />
              </p>
              <Button
                variant="outline"
                className="bg-transparent border-primary-foreground hover:bg-primary-foreground/10 text-primary-foreground uppercase tracking-wider font-bold transition-all duration-200 hover:scale-105"
                onClick={() => setIsSignUp(false)}
              >
                <TranslatedText text="Sign In" />
              </Button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="text-3xl font-bold font-headline">
                <TranslatedText text="Join CORSAIR!" />
              </h1>
              <p className="text-sm font-extralight leading-snug mt-5 mb-8">
                <TranslatedText text="Create an account to report incidents and help protect our coastlines." />
              </p>
              <Button
                variant="outline"
                className="bg-transparent border-primary-foreground hover:bg-primary-foreground/10 text-primary-foreground uppercase tracking-wider font-bold transition-all duration-200 hover:scale-105"
                onClick={() => setIsSignUp(true)}
              >
                <TranslatedText text="Sign Up" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
