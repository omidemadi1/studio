'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from 'recharts';
import { skills } from '@/lib/mock-data';

const chartData = skills.map((skill) => ({
  subject: skill.name,
  A: skill.level,
  fullMark: 10,
}));

export default function SkillRadar() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
        <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
            </linearGradient>
        </defs>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
        <Radar
          name="Skills"
          dataKey="A"
          stroke="hsl(var(--primary))"
          fill="url(#colorUv)"
          fillOpacity={0.6}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
