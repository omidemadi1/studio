import type { SVGProps } from "react";

export function GemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M12 22V9" />
      <path d="m3.5 8.5 17 0" />
      <path d="m2 9 4-6" />
      <path d="m22 9-4-6" />
    </svg>
  );
}
