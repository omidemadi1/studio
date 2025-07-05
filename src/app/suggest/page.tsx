'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestSmartTasks } from '@/ai/flows/suggest-smart-tasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';

const formSchema = z.object({
  pastPerformance: z.string().min(10, 'Please describe your recent performance in more detail.'),
  currentSkills: z.string().min(10, 'Please describe your current skills in more detail.'),
  userPreferences: z.string().min(10, 'Please describe your preferences in more detail.'),
});

export default function SuggestPage() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pastPerformance: 'Completed most work tasks on time, but struggled with maintaining a consistent workout routine.',
      currentSkills: 'Strong in project management and coding. Weaker in public speaking and financial planning.',
      userPreferences: 'Looking for tasks that can boost my career and improve my health. I prefer shorter tasks during the week.',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setSuggestion('');
    try {
      const result = await suggestSmartTasks(values);
      setSuggestion(result.suggestedTasks);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setSuggestion('Sorry, I was unable to get suggestions at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Smart Suggestions</h1>
        <p className="text-muted-foreground">Let AI help you choose your next quest.</p>
      </header>
      
      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle>Get Quest Recommendations</CardTitle>
          <CardDescription>
            Tell the AI about your progress and preferences to get a list of suggested tasks tailored just for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="pastPerformance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Past Performance</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., I completed my work projects ahead of schedule..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Skills</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., I'm proficient in Python, but new to public speaking." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferences</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., I want to focus on health-related tasks this month." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Suggest Quests
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {suggestion && (
        <Card className="mt-6 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              Your New Quests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {suggestion}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
