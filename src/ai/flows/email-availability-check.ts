
'use server';

/**
 * @fileOverview This flow checks the availability of an email address.
 *
 * - checkEmailAvailability - A function that checks if an email is available.
 * - CheckEmailAvailabilityInput - The input type for the checkEmailAvailability function.
 * - CheckEmailAvailabilityOutput - The return type for the checkEmailAvailability function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getAuth, fetchSignInMethodsForEmail } from "firebase/auth";
import { app } from '@/ai/genkit'; // Import the initialized app

// Get Auth instance from the centralized app
const auth = getAuth(app);


const CheckEmailAvailabilityInputSchema = z.object({
  email: z.string().email().describe('The email address to check.'),
});
export type CheckEmailAvailabilityInput = z.infer<
  typeof CheckEmailAvailabilityInputSchema
>;

const CheckEmailAvailabilityOutputSchema = z.object({
  isAvailable: z
    .boolean()
    .describe(
      'Whether the email is available (not associated with an existing account).'
    ),
});
export type CheckEmailAvailabilityOutput = z.infer<
  typeof CheckEmailAvailabilityOutputSchema
>;

export async function checkEmailAvailability(
  input: CheckEmailAvailabilityInput
): Promise<CheckEmailAvailabilityOutput> {
  return checkEmailAvailabilityFlow(input);
}

const checkEmailAvailabilityFlow = ai.defineFlow(
  {
    name: 'checkEmailAvailabilityFlow',
    inputSchema: CheckEmailAvailabilityInputSchema,
    outputSchema: CheckEmailAvailabilityOutputSchema,
  },
  async ({email}) => {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        return { isAvailable: methods.length === 0 };
    } catch (error) {
        console.error("Error checking email availability in flow: ", error);
        // Default to unavailable on error to prevent issues, or handle as needed
        return { isAvailable: false };
    }
  }
);
