
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Github, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { checkEmailAvailability } from '@/ai/flows/email-availability-check';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  role: z.enum(['citizen', 'official', 'analyst'], {
    required_error: 'You need to select a role.',
  }),
});

interface SignUpFormProps {
    onSignUpSuccess: () => void;
}

export function SignUpForm({ onSignUpSuccess }: SignUpFormProps) {
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', password: '', role: 'citizen' },
    mode: 'onTouched',
  });

  const { trigger, formState: { errors } } = form;

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    await trigger('email');
    const emailValue = e.target.value;
    if (!errors.email && emailValue) {
      startTransition(async () => {
        const { isAvailable } = await checkEmailAvailability({ email: emailValue });
        if (!isAvailable) {
          form.setError('email', { type: 'manual', message: 'This email is already in use.' });
        }
      });
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        const { isAvailable } = await checkEmailAvailability({ email: values.email });
        if (!isAvailable) {
            form.setError('email', { type: 'manual', message: 'This email is already taken.' });
            setLoading(false);
            return;
        }

      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: values.name,
        email: values.email,
        role: values.role,
      });

      toast({
        title: "Sign up successful!",
        description: `Welcome, ${values.name}! Your account has been created as a ${values.role}.`,
      });
      onSignUpSuccess();

    } catch (error: unknown) {
        console.error('Sign up error:', error);
        
        // Handle Firebase auth/email-already-in-use error
        if (error instanceof Error && error.message.includes('auth/email-already-in-use')) {
            form.setError('email', { 
                type: 'manual', 
                message: 'This email address is already registered. Please try logging in instead.' 
            });
            toast({
                variant: "destructive",
                title: "Email already registered",
                description: "This email address is already in use. Please use a different email or try logging in.",
            });
        } else {
            // Handle other errors
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during sign-up.";
            toast({
                variant: "destructive",
                title: "Sign up failed",
                description: errorMessage,
            });
        }
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
            <div className="space-y-4 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">Create Account</h1>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" size="icon" aria-label="Sign up with Google">
                  <GoogleIcon className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" aria-label="Sign up with GitHub">
                  <Github className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" aria-label="Sign up with LinkedIn">
                  <LinkedinIcon className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">or use your email for registration</p>
              <div className="space-y-4 text-left">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Email</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input type="email" placeholder="Email" {...field} onBlur={handleEmailBlur} disabled={loading} />
                        </FormControl>
                         {isPending && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
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
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Select your role</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex justify-around"
                          disabled={loading}
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="citizen" id="citizen" />
                            </FormControl>
                            <Label htmlFor="citizen" className="font-normal">Citizen</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="official" id="official" />
                            </FormControl>
                            <Label htmlFor="official" className="font-normal">Official</Label>
                          </FormItem>
                           <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="analyst" id="analyst" />
                            </FormControl>
                            <Label htmlFor="analyst" className="font-normal">Analyst</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full uppercase tracking-wider font-bold bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                 {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</> : 'Sign Up'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
