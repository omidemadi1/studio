
'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Settings, Pencil, Lightbulb, PlusCircle, Upload, Library, Wallet } from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuestData } from '@/context/quest-context';
import { iconMap } from '@/lib/icon-map';
import { cn } from '@/lib/utils';

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required.'),
  icon: z.string().min(1, 'An icon is required.'),
});

const defaultAvatars = [
    'https://placehold.co/100x100.png?text=Elf+Ranger',
    'https://placehold.co/100x100.png?text=Dwarf+Knight',
    'https://placehold.co/100x100.png?text=Human+Sorcerer',
    'https://placehold.co/100x100.png?text=Orc+Barbarian',
    'https://placehold.co/100x100.png?text=Gnome+Artificer',
    'https://placehold.co/100x100.png?text=Undead+Warlock',
];

export default function ProfilePage() {
  const { user, skills, updateUser, addSkill } = useQuestData();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
  const [addSkillOpen, setAddSkillOpen] = useState(false);

  const skillForm = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: '', icon: '' },
  });

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
    setEditProfileOpen(false);
  };

  const onAddSkill = (data: z.infer<typeof skillSchema>) => {
    addSkill(data.name, data.icon);
    skillForm.reset();
    setAddSkillOpen(false);
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
                <AvatarImage
                  src={user.avatarUrl}
                  alt={user.name}
                  data-ai-hint="avatar"
                />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 w-full">
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h2 className="text-2xl font-bold font-headline">
                      {user.name}
                    </h2>
                    <Dialog open={editProfileOpen} onOpenChange={(open) => {
                      setEditProfileOpen(open);
                      if (open) {
                        setName(user.name);
                        setAvatarPreview(user.avatarUrl);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit Profile</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                          <DialogDescription>
                            Customize your adventurer's appearance and name.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col md:flex-row gap-6 py-4">
                            <div className="w-full md:w-1/3 flex flex-col items-center gap-4">
                                <Label htmlFor="name">Profile Preview</Label>
                                <Avatar className="h-32 w-32 border-4 border-primary">
                                    <AvatarImage src={avatarPreview} alt="Avatar Preview" />
                                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="text-center text-lg font-bold"
                                />
                            </div>
                            <div className="w-full md:w-2/3">
                                <Tabs defaultValue="upload">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2" />Upload</TabsTrigger>
                                    <TabsTrigger value="default"><Library className="h-4 w-4 mr-2" />Defaults</TabsTrigger>
                                    <TabsTrigger value="nft"><Wallet className="h-4 w-4 mr-2" />NFT</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload" className="mt-4">
                                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
                                        <Upload className="h-12 w-12 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">Drop an image or click to select</p>
                                        <Input
                                            id="picture"
                                            type="file"
                                            onChange={handleAvatarChange}
                                            className="mt-4"
                                            accept="image/*"
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="default" className="mt-4">
                                    <div className="grid grid-cols-3 gap-4 max-h-48 overflow-y-auto p-2">
                                        {defaultAvatars.map((src, index) => (
                                            <div key={index} className="relative aspect-square cursor-pointer" onClick={() => setAvatarPreview(src)}>
                                                <Image
                                                    src={src}
                                                    alt={`Default avatar ${index + 1}`}
                                                    layout="fill"
                                                    className={cn("rounded-md object-cover hover:ring-2 hover:ring-primary", avatarPreview === src && "ring-2 ring-primary")}
                                                    data-ai-hint="fantasy character"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                                <TabsContent value="nft" className="mt-4">
                                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
                                        <Wallet className="h-12 w-12 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">Connect your wallet to select an NFT.</p>
                                        <Button className="mt-4" disabled>Connect Wallet (Coming Soon)</Button>
                                    </div>
                                </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="ghost">Cancel</Button>
                          </DialogClose>
                          <Button type="button" onClick={handleSaveChanges}>
                            Save changes
                          </Button>
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
                  <Progress
                    value={xpProgress}
                    aria-label={`${xpProgress}% towards next level`}
                  />
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
            <div className="text-3xl font-bold text-primary">
              {user.tokens.toLocaleString()}
            </div>
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-headline font-semibold">
            Skill Details
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAddSkillOpen(true)}
          >
            <PlusCircle className="h-6 w-6 text-primary" />
            <span className="sr-only">Add Skill</span>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => {
            const SkillIcon = iconMap[skill.icon] || Lightbulb;
            return (
              <Card key={skill.id} className="bg-card/80">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <SkillIcon className="h-6 w-6 text-accent" />
                      <span className="font-headline font-semibold">
                        {skill.name} - Lvl {skill.level}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {skill.points} / {skill.maxPoints}
                    </span>
                  </div>
                  <Progress
                    value={(skill.points / skill.maxPoints) * 100}
                    className="h-2"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Skill</DialogTitle>
            <DialogDescription>
              Skills help you track progress in different areas of your life.
            </DialogDescription>
          </DialogHeader>
          <Form {...skillForm}>
            <form
              onSubmit={skillForm.handleSubmit(onAddSkill)}
              className="space-y-4 py-4"
            >
              <FormField
                control={skillForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Programming" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={skillForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(iconMap).map((iconName) => {
                          const IconComponent = iconMap[iconName];
                          return (
                            <SelectItem key={iconName} value={iconName}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                <span>{iconName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Create Skill</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    