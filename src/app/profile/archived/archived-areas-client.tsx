
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArchiveRestore, ArchiveX, Briefcase } from 'lucide-react';
import type { Area } from '@/lib/types';
import { iconMap } from '@/lib/icon-map';
import { useQuestData } from '@/context/quest-context';
import { useRouter } from 'next/navigation';

interface ArchivedAreasClientProps {
    areas: Area[];
}

export default function ArchivedAreasClient({ areas }: ArchivedAreasClientProps) {
    const { archiveArea } = useQuestData();
    const router = useRouter();

    const handleUnarchive = async (areaId: string) => {
        await archiveArea(areaId, false);
        router.refresh();
    };

    return (
        <div className="container mx-auto max-w-4xl p-4 sm:p-6">
            <header className="mb-6 flex items-center justify-between gap-4">
                <div className='flex items-center gap-4'>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/profile">
                            <ArrowLeft />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-headline font-bold">Archived Areas</h1>
                </div>
            </header>

            {areas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {areas.map((area) => {
                        const AreaIcon = iconMap[area.icon] || Briefcase;
                        return (
                            <Card key={area.id} className="bg-card/80">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <AreaIcon className="w-6 h-6 text-accent" />
                                        <span>{area.name}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" variant="outline" onClick={() => handleUnarchive(area.id)}>
                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                        Unarchive
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="w-full bg-card/80">
                    <CardContent className="p-10 text-center">
                        <div className="flex justify-center mb-4">
                             <ArchiveX className="h-16 w-16 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-headline font-semibold">No Archived Areas</h2>
                        <p className="text-muted-foreground mt-2">
                            You haven't archived any areas yet.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
    