'use server';

/**
 * @fileOverview An AI agent to generate weekly missions for the user.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWeeklyMissionsInputSchema = z.object({
  currentSkills: z.string().describe("A comma-separated list of the user's current skills and their levels."),
  userLevel: z.number().describe("The user's current overall level."),
});
export type SuggestWeeklyMissionsInput = z.infer<typeof SuggestWeeklyMissionsInputSchema>;

const MissionSchema = z.object({
    title: z.string().describe("The short, catchy title of the mission."),
    description: z.string().describe("A one-sentence description of what the mission entails."),
    xp: z.number().describe("The experience points awarded for completing the mission. Should be between 50 and 300."),
    tokens: z.number().describe("The number of tokens (in-game currency) awarded. Should be between 10 and 100."),
});

const SuggestWeeklyMissionsOutputSchema = z.object({
  missions: z.array(MissionSchema).length(7).describe('A list of exactly 7 weekly missions.'),
});
export type SuggestWeeklyMissionsOutput = z.infer<typeof SuggestWeeklyMissionsOutputSchema>;


export async function suggestWeeklyMissions(
  input: SuggestWeeklyMissionsInput
): Promise<SuggestWeeklyMissionsOutput> {
  return suggestWeeklyMissionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWeeklyMissionsPrompt',
  input: {schema: SuggestWeeklyMissionsInputSchema},
  output: {schema: SuggestWeeklyMissionsOutputSchema},
  prompt: `You are a game master for a productivity RPG app called Questify. Your goal is to create a set of 7 engaging and challenging weekly missions for a user.

These missions should be a mix of activities related to personal growth, productivity, health, and finance. They should be generic enough to apply to most users but specific enough to be actionable.

The difficulty and rewards (XP and Tokens) should be scaled based on the user's overall level and their skill levels. A higher-level user should receive more challenging tasks with greater rewards.

Here is the user's data:
- User Level: {{{userLevel}}}
- Current Skills: {{{currentSkills}}}

Generate a list of exactly 7 unique missions. Here are some examples of good missions:
- "The Explorer": Try a new recipe or a new restaurant this week.
- "The Scholar": Read for 3 hours outside of your work/studies.
- "The Strategist": Plan your top 3 priorities for every day this week.
- "The Socialite": Reach out to a friend you haven't spoken to in a while.
- "The Optimizer": Dedicate 90 minutes to decluttering a room in your house.

Do not create tasks that are too simple, like "drink water" or "take a walk". The missions should feel like special weekly challenges.
`,
});

const suggestWeeklyMissionsFlow = ai.defineFlow(
  {
    name: 'suggestWeeklyMissionsFlow',
    inputSchema: SuggestWeeklyMissionsInputSchema,
    outputSchema: SuggestWeeklyMissionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
