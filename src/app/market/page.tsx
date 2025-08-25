import 'server-only';
import { getMarketItems } from '@/lib/data';
import MarketPageClient from './market-page-client';

export default async function MarketPage() {
  const marketItems = getMarketItems();
  return <MarketPageClient marketItems={marketItems} />;
}
