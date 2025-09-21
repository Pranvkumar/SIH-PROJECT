
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Github } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GoogleIcon } from '../icons/google-icon';
import { LinkedinIcon } from '../icons/linkedin-icon';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
});

interface SignInFormProps {
    onLoginSuccess: () => void;
}

export function SignInForm({ onLoginSuccess }: SignInFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        toast({
            title: "Sign in successful!",
            description: `Welcome back, ${userData.name}!`,
        });
        onLoginSuccess();
      } else {
        throw new Error("User data not found in database.");
      }
    } catch (error: unknown) {
        console.error('Sign in error:', error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during sign-in.";
        toast({
            variant: "destructive",
            title: "Sign in failed",
            description: errorMessage,
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="bg-card h-full flex items-center justify-center p-0">
      <div className="w-full max-w-sm">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col justify-center h-full"
          >
            <div className="space-y-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">Sign In</h1>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" size="icon" aria-label="Sign in with Google">
                  <GoogleIcon className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" aria-label="Sign in with GitHub">
                  <Github className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" aria-label="Sign in with LinkedIn">
                  <LinkedinIcon className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">or use your email for login</p>
              <div className="space-y-4 text-left">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Password" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                variant="link"
                className="px-0 text-xs text-muted-foreground"
              >
                Forgot your password?
              </Button>
              <Button type="submit" className="w-full uppercase tracking-wider font-bold bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</> : 'Sign In'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
