
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Megaphone, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { createReport } from '@/app/actions/create-report-action';


const formSchema = z.object({
    eventType: z.string({ required_error: 'Please select an event type.' }),
    description: z.string().min(10, {
        message: 'Description must be at least 10 characters.',
    }),
    photo: z.instanceof(File).refine((file) => file.size > 0, 'Photo is required.'),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
    }).refine((loc) => loc.lat !== 0 && loc.lng !== 0, {message: 'Location is required.'}),
});

type FormData = z.infer<typeof formSchema>;

interface ReportIncidentProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function ReportIncident({ isOpen, onOpenChange }: ReportIncidentProps = {}) {
    const [loading, setLoading] = useState(false);
    const [internalOpen, setInternalOpen] = useState(false);
    const { toast } = useToast();

    // Use external control if provided, otherwise use internal state
    const open = isOpen !== undefined ? isOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: '',
            location: { lat: 0, lng: 0 },
        },
    });

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    form.setValue('location', { lat: latitude, lng: longitude });
                     toast({
                        title: 'Location Acquired',
                        description: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    toast({
                        variant: 'destructive',
                        title: 'Location Error',
                        description: 'Could not get your location. Please enable location services.',
                    });
                }
            );
        } else {
             toast({
                variant: 'destructive',
                title: 'Location Error',
                description: 'Geolocation is not supported by your browser.',
            });
        }
    };

    const fileToDataUri = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    const onSubmit = async (values: FormData) => {
        setLoading(true);
        const user = auth.currentUser;

        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Not Authenticated',
                description: 'You must be logged in to submit a report.',
            });
            setLoading(false);
            return;
        }

        try {
            const photoDataUri = await fileToDataUri(values.photo);
            
            const result = await createReport({
                userId: user.uid,
                eventType: values.eventType,
                description: values.description,
                location: values.location,
                photoDataUri: photoDataUri,
            });


            if (result.success) {
                toast({
                    title: 'Report Submitted',
                    description: 'Thank you for your contribution to community safety!',
                });
                form.reset();
                setOpen(false);
            } else {
                 throw new Error(result.error || 'An unknown error occurred.');
            }
        } catch (error: unknown) {
            console.error('Report submission error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                    <Megaphone className="mr-2" />
                    Report an Incident
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Report an Incident</DialogTitle>
                    <DialogDescription>
                        Fill out the form below to report a hazard. Your submission is vital for community safety.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="eventType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a hazard type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unusual-tides">Unusual Tides</SelectItem>
                                            <SelectItem value="flooding">Flooding</SelectItem>
                                            <SelectItem value="coastal-damage">Coastal Damage</SelectItem>
                                            <SelectItem value="high-waves">High Waves</SelectItem>
                                            <SelectItem value="swell-surge">Swell Surge</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe what you are observing..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="photo"
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            render={({ field: { onChange, value, ...rest }}) => (
                                <FormItem>
                                    <FormLabel>Photo Evidence</FormLabel>
                                    <FormControl>
                                       <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                            {...rest}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormItem>
                             <FormLabel>Location</FormLabel>
                             <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" onClick={handleGetLocation} className="w-full">
                                    <MapPin className="mr-2" />
                                    Get Current Location
                                </Button>
                             </div>
                              {form.formState.errors.location && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.location.message}</p>
                             )}
                        </FormItem>


                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={loading}>
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 animate-spin" />}
                                Submit Report
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
