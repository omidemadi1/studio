'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { skills } from '@/lib/mock-data';
import { Settings, Pencil } from 'lucide-react';
import SkillRadar from '@/components/skill-radar';
import { GemIcon } from '@/components/icons/gem-icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuestData } from '@/context/quest-context';

export default function ProfilePage() {
  const { user, updateUser } = useQuestData();
  const [name, setName] = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveChanges = () => {
    updateUser({ name, avatarUrl: avatarPreview });
  };

  const xpProgress = (user.xp / user.nextLevelXp) * 100;

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold">Profile & Skills</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Settings</span>
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2 bg-card/80">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary shrink-0">
                <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar" />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 w-full">
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h2 className="text-2xl font-bold font-headline">{user.name}</h2>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Pencil className="h-4 w-4" />
                          <span className='sr-only'>Edit Profile</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                          <DialogDescription>
                            Make changes to your profile here. Click save when you're done.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Name
                            </Label>
                            <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="picture" className="text-right">
                              Avatar
                            </Label>
                            <Input id="picture" type="file" onChange={handleAvatarChange} className="col-span-3" accept="image/*" />
                          </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                             <div className="col-start-2 col-span-3">
                               <Avatar className="h-24 w-24">
                                  <AvatarImage src={avatarPreview} alt="Avatar Preview" />
                                  <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                </Avatar>
                             </div>
                           </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" onClick={handleSaveChanges}>Save changes</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <p className="text-muted-foreground">Level {user.level}</p>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">XP</span>
                    <span className="text-sm font-medium">
                      {user.xp} / {user.nextLevelXp}
                    </span>
                  </div>
                  <Progress value={xpProgress} aria-label={`${xpProgress}% towards next level`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-headline">
              <GemIcon className="h-5 w-5 text-primary" />
              Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{user.tokens.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Tokens to spend</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-card/80 mb-6">
        <CardHeader>
          <CardTitle className="font-headline">Skill Radar</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] md:h-[300px]">
          <SkillRadar />
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-headline font-semibold mb-4">Skill Details</h2>
        <div className="space-y-4">
          {skills.map((skill) => (
            <Card key={skill.id} className="bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className='flex items-center gap-3'>
                    <skill.icon className="h-6 w-6 text-accent" />
                    <span className="font-headline font-semibold">
                      {skill.name} - Lvl {skill.level}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {skill.points} / {skill.maxPoints}
                  </span>
                </div>
                <Progress value={(skill.points / skill.maxPoints) * 100} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
