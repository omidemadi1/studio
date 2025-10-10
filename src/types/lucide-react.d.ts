// Minimal ambient declaration for `lucide-react` used by the app.
// This file exists to satisfy TypeScript when the package's typings
// aren't available in the environment (e.g. before running npm install).
// It intentionally keeps types loose (any) to be low-risk.

declare module 'lucide-react' {
  import * as React from 'react';

  // A lightweight type for icon components (SVG React components)
  export type LucideIcon = React.FC<React.SVGProps<SVGSVGElement>>;

  // Export the icons that `icon-map.ts` uses. Keep as `any` to avoid
  // depending on the package's exact typings in this shim.
  export const Briefcase: LucideIcon | any;
  export const Heart: LucideIcon | any;
  export const Dumbbell: LucideIcon | any;
  export const Wallet: LucideIcon | any;
  export const BookOpen: LucideIcon | any;
  export const Lightbulb: LucideIcon | any;
  export const BrainCircuit: LucideIcon | any;
  export const Target: LucideIcon | any;
  export const PencilRuler: LucideIcon | any;
  export const LineChart: LucideIcon | any;
  export const Code: LucideIcon | any;
  export const Palette: LucideIcon | any;
  export const Music: LucideIcon | any;
  export const Clapperboard: LucideIcon | any;
  export const Gamepad2: LucideIcon | any;
  export const Plane: LucideIcon | any;
  export const Utensils: LucideIcon | any;
  export const MessageCircle: LucideIcon | any;
  export const Users: LucideIcon | any;
  export const GitBranch: LucideIcon | any;
  export const Archive: LucideIcon | any;
  export const Map: LucideIcon | any;
  export const GraduationCap: LucideIcon | any;
  export const Home: LucideIcon | any;
  export const Hammer: LucideIcon | any;
  export const Sprout: LucideIcon | any;
  export const Star: LucideIcon | any;
  export const Award: LucideIcon | any;
  export const Flag: LucideIcon | any;
  export const Component: LucideIcon | any;
  export const ClipboardList: LucideIcon | any;
  export const Settings: LucideIcon | any;
  export const Shield: LucideIcon | any;
  export const Trophy: LucideIcon | any;
  export const Bike: LucideIcon | any;
  export const Car: LucideIcon | any;
  export const FileText: LucideIcon | any;
  export const Camera: LucideIcon | any;
  export const Search: LucideIcon | any;

  // Re-export everything as a fallback so consumers can import other icons.
  const _default: { [key: string]: any };
  export default _default;
}
