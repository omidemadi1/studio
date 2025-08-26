
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Bell, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from './switch';
import { Label } from './label';
import { Separator } from './separator';

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  reminder?: number;
  setReminder?: (reminder: number | undefined) => void;
}

export function DateTimePicker({ date, setDate, reminder, setReminder }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [includeTime, setIncludeTime] = React.useState(!!date && (date.getHours() !== 0 || date.getMinutes() !== 0));

  React.useEffect(() => {
    // When date is set from outside and has time, enable the switch
    if (date) {
      setIncludeTime(date.getHours() !== 0 || date.getMinutes() !== 0);
    }
  }, [date]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      return;
    }
    
    const newDate = new Date(selectedDate);
    if (date && includeTime) {
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
    } else {
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
    }
    setDate(newDate);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', value: string) => {
    const newDate = date ? new Date(date) : new Date();
    const numericValue = parseInt(value, 10);

    if (isNaN(numericValue)) return;
    
    if (type === 'hours') {
        newDate.setHours(numericValue);
    } else {
        newDate.setMinutes(numericValue);
    }
    setDate(newDate);
  }

  const handleClear = () => {
    setDate(undefined);
    setReminder?.(undefined);
    setIncludeTime(false);
    setOpen(false);
  }

  const hours = date ? date.getHours() : 0;
  const minutes = date ? date.getMinutes() : 0;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal h-10',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <div className='flex flex-col items-start'>
                <span className='text-sm leading-tight'>{format(date, includeTime ? 'PPP p' : 'PPP')}</span>
                {reminder !== undefined && (
                  <span className='text-xs text-muted-foreground leading-tight'>
                    <Bell className="inline-block h-3 w-3 mr-1" />
                    {reminder === 0 ? 'On time' : ` ${reminder}m before`}
                  </span>
                )}
            </div>
          )
          : (<span>Pick a date</span>)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={(d) => d < new Date('1900-01-01')}
          initialFocus
        />
        <div className="p-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="include-time" className="text-sm font-normal">Include time</Label>
            <Switch
              id="include-time"
              checked={includeTime}
              onCheckedChange={(checked) => {
                setIncludeTime(checked);
                if (checked && !date) {
                  // If enabling time on a new date, set to now
                  const now = new Date();
                  const newDate = new Date();
                  newDate.setHours(now.getHours());
                  newDate.setMinutes(now.getMinutes());
                  setDate(newDate);
                } else if (checked && date) {
                  // If enabling time on existing date, set to current time
                  const now = new Date();
                  const newDate = new Date(date);
                  newDate.setHours(now.getHours());
                  newDate.setMinutes(now.getMinutes());
                  setDate(newDate)
                }
              }}
            />
          </div>
          {includeTime && (
            <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <div className="flex items-center gap-1">
                <Select
                    value={String(hours).padStart(2, '0')}
                    onValueChange={(value) => handleTimeChange('hours', value)}
                >
                    <SelectTrigger className="w-[60px] h-8 text-xs">
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i).padStart(2, '0')} className="text-xs">
                        {String(i).padStart(2, '0')}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <span>:</span>
                <Select
                    value={String(minutes).padStart(2, '0')}
                    onValueChange={(value) => handleTimeChange('minutes', value)}
                >
                    <SelectTrigger className="w-[60px] h-8 text-xs">
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    {Array.from({ length: 60 }, (_, i) => (
                        <SelectItem key={i} value={String(i).padStart(2, '0')} className="text-xs">
                        {String(i).padStart(2, '0')}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            </div>
          )}
          {setReminder && date && (
            <>
              <Separator />
              <div className="flex items-center justify-center gap-2">
                <Bell className="h-4 w-4" />
                <div className="flex items-center gap-1 w-full">
                    <Select
                      value={reminder !== undefined ? String(reminder) : 'none'}
                      onValueChange={(value) => setReminder(value === 'none' ? undefined : Number(value))}
                    >
                        <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="No reminder" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none" className="text-xs">No reminder</SelectItem>
                            <SelectItem value="0" className="text-xs">On time of event</SelectItem>
                            <SelectItem value="5" className="text-xs">5 minutes before</SelectItem>
                            <SelectItem value="15" className="text-xs">15 minutes before</SelectItem>
                            <SelectItem value="30" className="text-xs">30 minutes before</SelectItem>
                            <SelectItem value="60" className="text-xs">1 hour before</SelectItem>
                            <SelectItem value="1440" className="text-xs">1 day before</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
            </>
          )}
          <Separator />
          <Button variant="ghost" onClick={handleClear} className="w-full justify-center">
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
