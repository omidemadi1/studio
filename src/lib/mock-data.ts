import type { MarketItem } from './types';

// Keep market items "mocked" as they are static
export const marketItems: MarketItem[] = [
    { id: 'item1', name: 'Health Potion', price: 50, imageUrl: 'https://placehold.co/200x200.png', description: 'Recovers 50 health points instantly.'},
    { id: 'item2', name: 'XP Booster (1hr)', price: 100, imageUrl: 'https://placehold.co/200x200.png', description: 'Doubles XP gain from all quests for one hour.'},
    { id: 'item3', name: 'Golden Key', price: 250, imageUrl: 'https://placehold.co/200x200.png', description: 'Unlocks a special legendary quest line.'},
    { id: 'item4', name: 'Ancient Scroll', price: 80, imageUrl: 'https://placehold.co/200x200.png', description: 'Reveals a hint for a difficult quest.'},
    { id: 'item5', name: 'Mystic Orb', price: 150, imageUrl: 'https://placehold.co/200x200.png', description: 'Increases Intellect skill points by 100.'},
    { id: 'item6', name: 'Premium Theme', price: 500, imageUrl: 'https://placehold.co/200x200.png', description: 'Unlock a new exclusive theme for the app.'},
];
