'use server';

/**
 * @fileOverview A smart task suggestion AI agent.
 *
 * - suggestSmartTasks - A function that suggests tasks based on past performance and current skills.
 * - SuggestSmartTasksInput - The input type for the suggestSmartTasks function.
 * - SuggestSmartTasksOutput - The return type for the suggestSmartTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSmartTasksInputSchema = z.object({
  pastPerformance: z
    .string()
    .describe('The past performance of the user in completing tasks.'),
  currentSkills: z.string().describe('The current skills of the user.'),
  userPreferences: z
    .string()
    .describe('The preferences of the user, such as area, project, etc.'),
});
export type SuggestSmartTasksInput = z.infer<typeof SuggestSmartTasksInputSchema>;

const SuggestSmartTasksOutputSchema = z.object({
  suggestedTasks: z
    .string()
    .describe(
      'A list of suggested tasks based on the past performance and current skills of the user.'
    ),
});
export type SuggestSmartTasksOutput = z.infer<typeof SuggestSmartTasksOutputSchema>;

export async function suggestSmartTasks(
  input: SuggestSmartTasksInput
): Promise<SuggestSmartTasksOutput> {
  return suggestSmartTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSmartTasksPrompt',
  input: {schema: SuggestSmartTasksInputSchema},
  output: {schema: SuggestSmartTasksOutputSchema},
  prompt: `You are an AI assistant that suggests tasks to users based on their past performance and current skills.

  Given the following information about the user, suggest a list of tasks that the user should focus on to improve their overall productivity.

  Past Performance: {{{pastPerformance}}}
  Current Skills: {{{currentSkills}}}
  User Preferences: {{{userPreferences}}}
  `,
});

const suggestSmartTasksFlow = ai.defineFlow(
  {
    name: 'suggestSmartTasksFlow',
    inputSchema: SuggestSmartTasksInputSchema,
    outputSchema: SuggestSmartTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
