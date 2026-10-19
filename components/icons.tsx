import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const KeyIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L19 4m-4 4 2 2m2-5 2 2" />
  </svg>
);

export const HouseIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6" />
  </svg>
);

export const HomeIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />
  </svg>
);

export const HeartIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 21c-5.5-3.6-9-7.1-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 3.9-3.5 7.4-9 11z" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const FilterIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 5h16M7 12h10m-7 7h4" />
  </svg>
);

export const EyeIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M3 3l18 18M10.6 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.7 3.6M6.6 6.6A16.5 16.5 0 0 0 2 12s3.5 7 10 7c1.8 0 3.4-.4 4.8-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

export const CloudUploadIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M16 16l-4-4-4 4m4-4v12" />
    <path d="M20.4 18.4A5 5 0 0 0 18 8h-1.3A7 7 0 1 0 4 15.3" />
  </svg>
);

export const InfoIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6m0-9.5v.01" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="m4 12.5 5 5L20 6.5" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const LinkIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M10 14a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 10a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...p}>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
  </svg>
);

export const GoogleLogo = (p: P) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path
      fill="#4285F4"
      d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.8z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.09A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l4-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.76c1.76 0 3.34.6 4.59 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l4 3.09c.94-2.84 3.59-4.95 6.71-4.95z"
    />
  </svg>
);

export const AppleLogo = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-.99-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.1 2.95 3.6 2.89 1.45-.06 2-.93 3.74-.93s2.24.93 3.77.9c1.56-.03 2.55-1.41 3.5-2.81 1.1-1.61 1.56-3.17 1.58-3.25-.03-.02-3.04-1.17-3.07-4.61zM14.16 4.06c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.55.77-3.38 1.74-.74.86-1.39 2.23-1.22 3.55 1.29.1 2.6-.65 3.41-1.63z" />
  </svg>
);

export const CalendarIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4m8-4v4M3 10h18" />
  </svg>
);

export const GuestsIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c1-3.2 3.5-4.5 6.5-4.5s5.5 1.3 6.5 4.5" />
    <path d="M16 5a3.5 3.5 0 0 1 0 6.8M18.5 15.7c1.7.8 2.7 2.1 3 4.3" />
  </svg>
);
