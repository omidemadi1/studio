
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

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
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [includeTime, setIncludeTime] = React.useState(!!date && (date.getHours() !== 0 || date.getMinutes() !== 0));
  const [formattedDate, setFormattedDate] = React.useState('');

  React.useEffect(() => {
    // When date is set from outside and has time, enable the switch
    if (date) {
      setIncludeTime(date.getHours() !== 0 || date.getMinutes() !== 0);
      setFormattedDate(format(date, includeTime ? 'PPP p' : 'PPP'));
    } else {
      setFormattedDate('');
    }
  }, [date, includeTime]);


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
    setIncludeTime(false);
    setOpen(false);
  }

  const hours = date ? date.getHours() : 0;
  const minutes = date ? date.getMinutes() : 0;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'ghost'}
          className={cn(
            'w-full justify-start text-left font-normal h-10 px-2',
            !date && 'text-muted-foreground'
          )}
        >
          {date ? (
            <div className='flex flex-col items-start'>
                <span className='text-sm leading-tight'>{formattedDate}</span>
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
          <Separator />
          <Button variant="ghost" onClick={handleClear} className="w-full justify-center">
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
