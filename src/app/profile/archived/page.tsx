
import 'server-only';

import { getArchivedAreas } from '@/lib/data';
import ArchivedAreasClient from './archived-areas-client';


export default async function ArchivedAreasPage() {
    const archivedAreas = getArchivedAreas();
    return <ArchivedAreasClient areas={archivedAreas} />;
}

    