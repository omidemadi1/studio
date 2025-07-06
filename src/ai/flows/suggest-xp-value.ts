'use server';
/**
 * @fileOverview An AI agent to suggest a fair XP value for a task.
 *
 * - suggestXpValue - A function that suggests an XP value for a given task.
 * - SuggestXpValueInput - The input type for the suggestXpValue function.
 * - SuggestXpValueOutput - The return type for the suggestXpValue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestXpValueInputSchema = z.object({
  title: z.string().describe('The title or name of the task.'),
  projectContext: z
    .string()
    .describe(
      'The name of the project this task belongs to, providing context.'
    )
    .optional(),
});
export type SuggestXpValueInput = z.infer<typeof SuggestXpValueInputSchema>;

const SuggestXpValueOutputSchema = z.object({
  xp: z
    .number()
    .describe('The suggested numerical XP value for the task, between 10 and 150.'),
});
export type SuggestXpValueOutput = z.infer<typeof SuggestXpValueOutputSchema>;

export async function suggestXpValue(
  input: SuggestXpValueInput
): Promise<SuggestXpValueOutput> {
  return suggestXpValueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestXpValuePrompt',
  input: {schema: SuggestXpValueInputSchema},
  output: {schema: SuggestXpValueOutputSchema},
  prompt: `You are a game balance designer for a productivity RPG app. Your job is to assign an experience point (XP) value to a user-submitted task. Analyze the task title and its project context to determine a fair XP value based on its likely complexity, time commitment, and effort.

Use the following scale:
- 10-20 XP: Very simple, quick tasks (e.g., "Reply to one email", "Drink a glass of water").
- 25-50 XP: Standard, single-step tasks (e.g., "Go for a 30-minute walk", "Read one chapter of a book").
- 55-80 XP: Moderately complex tasks requiring more focus (e.g., "Write a blog post draft", "Complete a coding exercise").
- 85-150 XP: Complex, multi-step, or time-consuming tasks (e.g., "Develop a new feature prototype", "Prepare a presentation for a meeting").

Task Title: {{{title}}}
{{#if projectContext}}
Project Context: {{{projectContext}}}
{{/if}}

Based on this, determine a fair XP value and provide your response in the requested format.`,
});

const suggestXpValueFlow = ai.defineFlow(
  {
    name: 'suggestXpValueFlow',
    inputSchema: SuggestXpValueInputSchema,
    outputSchema: SuggestXpValueOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
