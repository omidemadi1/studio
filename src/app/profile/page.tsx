
'use client';
import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Pencil, Lightbulb, PlusCircle, Upload, Library, Wallet, Check, Settings, LogOut, Trash2, Bell, ChevronRight, ChevronDown, Archive } from 'lucide-react';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuestData } from '@/context/quest-context';
import { iconMap } from '@/lib/icon-map';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import type { Skill } from '@/lib/types';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required.'),
  icon: z.string().min(1, 'An icon is required.'),
});

const defaultAvatars = [
    '/assets/avatars/archer.png',
    '/assets/avatars/default.png',
    '/assets/avatars/knight.png',
    '/assets/avatars/mage.png',
    '/assets/avatars/paladin.png',
    '/assets/avatars/rogue.png',
    '/assets/avatars/warrior.png',
    '/assets/avatars/wizard.png',
];

export default function ProfilePage() {
  const { user, skills, updateUser, addSkill, resetDatabase, updateSkill, deleteSkill, tasks } = useQuestData();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [editSkillState, setEditSkillState] = useState<{ open: boolean, skill: Skill | null }>({ open: false, skill: null });
  const [deleteSkillState, setDeleteSkillState] = useState<{ open: boolean, skill: Skill | null }>({ open: false, skill: null });

  const skillForm = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: '', icon: '' },
  });
  
  const notifications = tasks.filter(task => task.reminder !== undefined && task.dueDate);


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

  const onEditSkill = (data: z.infer<typeof skillSchema>) => {
    if (!editSkillState.skill) return;
    updateSkill(editSkillState.skill.id, data.name, data.icon);
    setEditSkillState({ open: false, skill: null });
  };

  const handleDeleteSkill = () => {
    if (!deleteSkillState.skill) return;
    deleteSkill(deleteSkillState.skill.id);
    setDeleteSkillState({ open: false, skill: null });
  };

  const handleEditClick = (skill: Skill) => {
    skillForm.reset({ name: skill.name, icon: skill.icon });
    setEditSkillState({ open: true, skill });
  };

  const handleDeleteClick = (skill: Skill) => {
    setDeleteSkillState({ open: true, skill });
  };

  const handleDeleteData = () => {
    setDeleteDataOpen(false);
    resetDatabase();
  };

  const xpProgress = (user.xp / user.nextLevelXp) * 100;

  return (
    <>
    <div className="container mx-auto max-w-4xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold">Profile & Skills</h1>
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-6 w-6" />
                        <span className="sr-only">Notifications</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length > 0 ? (
                        notifications.map(task => (
                            <DropdownMenuItem key={task.id}>
                                <div className="flex flex-col">
                                    <span className="font-medium">{task.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                        Reminder for {new Date(task.dueDate!).toLocaleString()}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <DropdownMenuItem disabled>You have not any notification</DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Settings className="h-6 w-6" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild className="focus:bg-transparent">
                       <ThemeToggle />
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/profile/archived">
                            <Archive className="mr-2 h-4 w-4" />
                            <span>Archived Areas</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log Out</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setDeleteDataOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete All Data</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2 bg-card/80">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary shrink-0">
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.name}
                    data-ai-hint="avatar"
                  />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <div className="text-xs font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                        Lvl {user.level}
                    </div>
                </div>
              </div>

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
                                <Tabs defaultValue="default">
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
                                                    width={100}
                                                    height={100}
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
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next Level</span>
                    <span className="font-medium">
                      {user.xp} / {user.nextLevelXp} XP
                    </span>
                  </div>
                  <Progress
                    value={xpProgress}
                    aria-label={`${xpProgress}% towards next level`}
                    className="h-2"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => {
            const SkillIcon = iconMap[skill.icon] || Lightbulb;
            const progress = (skill.points / skill.maxPoints) * 100;
            const circumference = 2 * Math.PI * 45; // 2 * pi * radius
            const strokeDashoffset = circumference - (progress / 100) * circumference;

            return (
              <ContextMenu key={skill.id}>
                <ContextMenuTrigger>
                  <Card className="bg-card/80 overflow-hidden h-full flex items-center justify-center">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <Link href={`/skills/${skill.id}`} className="relative w-40 h-40">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle
                                  className="text-muted/20"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="transparent"
                              />
                              <circle
                                  className="text-primary"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="transparent"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  transform="rotate(-90 50 50)"
                              />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                              <div className="relative mb-2">
                                  <SkillIcon className="h-8 w-8 text-accent" />
                                  <div className="absolute -top-1 -right-2 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold border-2 border-card">
                                      {skill.level}
                                  </div>
                              </div>
                              <p className="font-headline font-semibold mt-1 text-sm">{skill.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{skill.points} / {skill.maxPoints} XP</p>
                          </div>
                      </Link>
                    </CardContent>
                  </Card>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => handleEditClick(skill)}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit Skill
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => handleDeleteClick(skill)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Skill
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
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
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant="outline" className="w-full justify-start" type="button">
                                    {field.value ? (
                                        <>
                                            {React.createElement(iconMap[field.value], { className: 'h-4 w-4 mr-2' })}
                                            {field.value}
                                        </>
                                    ) : 'Select an icon'}
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 max-w-[240px] max-h-[200px] overflow-y-auto">
                            <div className="grid grid-cols-6 gap-1">
                                {Object.keys(iconMap).map((iconName) => {
                                    const IconComponent = iconMap[iconName];
                                    return (
                                        <Button
                                            key={iconName}
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => field.onChange(iconName)}
                                            className={cn("relative", field.value === iconName && "bg-accent text-accent-foreground")}
                                        >
                                            <IconComponent className="h-5 w-5" />
                                            {field.value === iconName && <Check className="absolute bottom-0 right-0 h-3 w-3 text-white bg-green-500 rounded-full p-0.5" />}
                                        </Button>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
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
    <AlertDialog open={deleteDataOpen} onOpenChange={setDeleteDataOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your data,
                    including quests, skills, and progress.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteData}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

     <Dialog open={editSkillState.open} onOpenChange={(open) => setEditSkillState({ open, skill: open ? editSkillState.skill : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Update the details of your skill.
            </DialogDescription>
          </DialogHeader>
          <Form {...skillForm}>
            <form
              onSubmit={skillForm.handleSubmit(onEditSkill)}
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
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant="outline" className="w-full justify-start" type="button">
                                    {field.value ? (
                                        <>
                                            {React.createElement(iconMap[field.value], { className: 'h-4 w-4 mr-2' })}
                                            {field.value}
                                        </>
                                    ) : 'Select an icon'}
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 max-w-[240px] max-h-[200px] overflow-y-auto">
                            <div className="grid grid-cols-6 gap-1">
                                {Object.keys(iconMap).map((iconName) => {
                                    const IconComponent = iconMap[iconName];
                                    return (
                                        <Button
                                            key={iconName}
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => field.onChange(iconName)}
                                            className={cn("relative", field.value === iconName && "bg-accent text-accent-foreground")}
                                        >
                                            <IconComponent className="h-5 w-5" />
                                            {field.value === iconName && <Check className="absolute bottom-0 right-0 h-3 w-3 text-white bg-green-500 rounded-full p-0.5" />}
                                        </Button>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                 <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    <AlertDialog open={deleteSkillState.open} onOpenChange={(open) => setDeleteSkillState({ open, skill: open ? deleteSkillState.skill : null })}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the 
                <span className="font-bold"> {deleteSkillState.skill?.name}</span> skill and all of its sub-skills.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteSkillState({open: false, skill: null})}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSkill}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

    

    
    