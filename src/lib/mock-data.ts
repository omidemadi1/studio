import type { User, Skill, Area, MarketItem } from './types';
import { Briefcase, Heart, Dumbbell, Wallet, BookOpen, Lightbulb } from 'lucide-react';

export const user: User = {
  name: 'Hero Gamer',
  level: 5,
  xp: 1250,
  nextLevelXp: 2000,
  tokens: 420,
  avatarUrl: 'https://placehold.co/100x100.png',
};

export const skills: Skill[] = [
  { id: 'strength', name: 'Strength', level: 4, points: 300, maxPoints: 1000, icon: Dumbbell },
  { id: 'intellect', name: 'Intellect', level: 6, points: 750, maxPoints: 1000, icon: Lightbulb },
  { id: 'health', name: 'Health', level: 5, points: 500, maxPoints: 1000, icon: Heart },
  { id: 'finance', name: 'Finance', level: 3, points: 200, maxPoints: 1000, icon: Wallet },
  { id: 'career', name: 'Career', level: 5, points: 600, maxPoints: 1000, icon: Briefcase },
  { id: 'knowledge', name: 'Knowledge', level: 7, points: 850, maxPoints: 1000, icon: BookOpen },
];

export const initialAreas: Area[] = [
  {
    id: 'work',
    name: 'Work',
    icon: Briefcase,
    projects: [
      {
        id: 'proj1',
        name: 'Q2 Roadmap',
        tasks: [
          { id: 't1', title: 'Finalize project specs', completed: true, xp: 50, description: 'Write up the final specifications for the Q2 roadmap.', notes: 'Check with marketing before finalizing.', links: 'https://docs.google.com/document/d/...', difficulty: 'Medium', dueDate: '2025-01-28', skillId: 'career' },
          { id: 't2', title: 'Develop prototype', completed: false, xp: 150, difficulty: 'Hard', dueDate: '2025-02-15', skillId: 'career', startDate: new Date('2024-01-27T18:30:00').getTime(), endDate: new Date('2024-01-27T21:18:00').getTime() },
          { id: 't3', title: 'User testing session', completed: false, xp: 100, difficulty: 'Medium', dueDate: '2025-02-20', skillId: 'intellect' },
        ],
      },
      {
        id: 'proj2',
        name: 'Website Redesign',
        tasks: [
          { id: 't4', title: 'Create wireframes', completed: true, xp: 75, difficulty: 'Easy', dueDate: '2025-01-10', skillId: 'career' },
          { id: 't5', title: 'Design mockups', completed: false, xp: 100, difficulty: 'Medium', dueDate: '2025-01-25', skillId: 'career' },
        ],
      },
    ],
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    icon: Heart,
    projects: [
      {
        id: 'proj3',
        name: 'Workout Routine',
        tasks: [
          { id: 't6', title: 'Morning run (5km)', completed: true, xp: 40, difficulty: 'Easy', skillId: 'health' },
          { id: 't7', title: 'Strength training', completed: false, xp: 50, difficulty: 'Medium', skillId: 'strength' },
          { id: 't8', title: 'Yoga session', completed: false, xp: 30, difficulty: 'Easy', skillId: 'health' },
        ],
      },
      {
        id: 'proj4',
        name: 'Meal Plan',
        tasks: [
            { id: 't9', title: 'Plan weekly meals', completed: true, xp: 25, difficulty: 'Easy', skillId: 'health' },
            { id: 't10', title: 'Go grocery shopping', completed: false, xp: 20, difficulty: 'Easy', skillId: 'health' },
        ],
      }
    ],
  },
  {
    id: 'finances',
    name: 'Finances',
    icon: Wallet,
    projects: [
      {
        id: 'proj5',
        name: 'Monthly Budget',
        tasks: [
          { id: 't11', title: 'Review monthly spending', completed: false, xp: 30, difficulty: 'Medium', skillId: 'finance' },
          { id: 't12', title: 'Allocate savings', completed: false, xp: 35, difficulty: 'Medium', skillId: 'finance' },
        ],
      },
    ],
  },
];

export const marketItems: MarketItem[] = [
  {
    id: 'item1',
    name: 'Health Potion',
    price: 50,
    imageUrl: 'https://placehold.co/200x200.png',
    description: 'Recovers 50 health points instantly.',
  },
  {
    id: 'item2',
    name: 'XP Booster (1hr)',
    price: 100,
    imageUrl: 'https://placehold.co/200x200.png',
    description: 'Doubles XP gain from all quests for one hour.',
  },
  {
    id: 'item3',
    name: 'Golden Key',
    price: 250,
    imageUrl: 'https://placehold.co/200x200.png',
    description: 'Unlocks a special legendary quest line.',
  },
  {
    id: 'item4',
    name: 'Ancient Scroll',
    price: 80,
    imageUrl: 'https://placehold.co/200x200.png',
    description: 'Reveals a hint for a difficult quest.',
  },
    {
    id: 'item5',
    name: 'Mystic Orb',
    price: 150,
    imageUrl: 'https://placehold.co/200x200.png',
    description: 'Increases Intellect skill points by 100.',
  },
  {
    id: 'item6',
    name: 'Premium Theme',
    price: 500,
    imageUrl: 'https://placehold.co/200x200.png',
    description: 'Unlock a new exclusive theme for the app.',
  },
];
