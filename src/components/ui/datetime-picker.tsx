'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
        setDate(undefined);
        return;
    };
    
    const newDate = new Date(selectedDate);
    if (date) {
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
    } else {
        const now = new Date();
        newDate.setHours(now.getHours());
        newDate.setMinutes(now.getMinutes());
    }
    setDate(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const [hours, minutes] = value.split(':').map(Number);
    
    const newDate = date ? new Date(date) : new Date();

    if (!isNaN(hours)) newDate.setHours(hours);
    if (!isNaN(minutes)) newDate.setMinutes(minutes);

    setDate(newDate);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP p') : <span>Pick a date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={(d) => d < new Date('1900-01-01')}
        />
        <div className="p-3 border-t border-border flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Input
                type="time"
                className="w-full"
                value={date ? format(date, 'HH:mm') : ''}
                onChange={handleTimeChange}
            />
        </div>
      </PopoverContent>
    </Popover>
  );
}
