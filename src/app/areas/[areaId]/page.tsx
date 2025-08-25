
'use client';

import { useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuestData } from '@/context/quest-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { iconMap } from '@/lib/icon-map';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  ArrowLeft,
  LayoutGrid,
  TrendingUp,
  CheckCircle,
  Target,
  PlusCircle,
} from 'lucide-react';
import type { Task } from '@/lib/types';

export default function AreaDetailPage() {
  const { areaId } = useParams();
  const { getAreaById, getTasksByAreaId } = useQuestData();

  const area = useMemo(() => getAreaById(areaId as string), [areaId, getAreaById]);
  const tasks = useMemo(() => getTasksByAreaId(areaId as string), [areaId, getTasksByAreaId]);

  if (!area) {
    notFound();
  }

  const AreaIcon = iconMap[area.icon] || Briefcase;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalXp = tasks.reduce((sum, task) => sum + task.xp, 0);
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <AreaIcon className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-headline font-bold">{area.name}</h1>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} of {totalTasks} quests done
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP Gained</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all quests in this area</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{area.projects.length}</div>
            <p className="text-xs text-muted-foreground">Active projects in this area</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-headline font-semibold mb-4">Projects</h2>
        <div className="space-y-4">
          {area.projects.map((project) => {
            const projectTasks = project.tasks;
            const completedProjectTasks = projectTasks.filter(t => t.completed).length;
            const projectCompletion = projectTasks.length > 0 ? (completedProjectTasks / projectTasks.length) * 100 : 0;
            return (
              <Card key={project.id} className="bg-card/80 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-bold font-headline">{project.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{completedProjectTasks} / {projectTasks.length} Done</span>
                    <Progress value={projectCompletion} className="w-24 h-2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {projectTasks.slice(0, 5).map((task: Task) => (
                      <li key={task.id} className="flex items-center gap-3">
                        <CheckCircle className={`h-4 w-4 ${task.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                        <span className="text-xs font-bold text-primary">+{task.xp} XP</span>
                      </li>
                    ))}
                    {projectTasks.length > 5 && (
                        <li className="text-center text-sm text-muted-foreground pt-2">...and {projectTasks.length - 5} more.</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
           {area.projects.length === 0 && (
              <Card className="bg-card/80 border-2 border-dashed">
                <CardContent className="p-10 text-center">
                    <p className="text-muted-foreground mb-4">No projects here yet. Ready to start a new quest line?</p>
                    <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button>
                </CardContent>
              </Card>
           )}
        </div>
      </section>
    </div>
  );
}
