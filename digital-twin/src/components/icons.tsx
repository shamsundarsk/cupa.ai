'use client'

/**
 * Inline SVG icons used across the digital-twin app — no extra dependencies.
 * Each component accepts size and className and passes stroke="currentColor"
 * so colors are controlled via Tailwind text-* classes.
 */

import type { SVGProps } from 'react'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number
}
export type { IconProps }

const base = (props: IconProps) => ({
  width: props.size ?? 18,
  height: props.size ?? 18,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export function GlobeIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20Z" />
    </svg>
  )
}

export function PlugZapIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m6 16 6-6" />
      <path d="m8 22 4-4" />
      <path d="M14 6V2" />
      <path d="M18 6V2" />
      <path d="M22 10h-4" />
      <path d="M22 14h-4" />
      <path d="M16 4h-4l4 12 1.5-3.5" />
    </svg>
  )
}

export function GaugeIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 14 4 6" />
      <path d="M12 2A10 10 0 1 0 22 12" />
      <path d="M22 12h-4" />
    </svg>
  )
}

export function CubeIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

export function ShieldIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export function CpuIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  )
}

export function SparkleIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function ClockIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function DollarIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

export function CalculatorIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="12" x2="8" y2="12" />
      <line x1="12" y1="12" x2="12" y2="12" />
      <line x1="16" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="12" y1="16" x2="12" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  )
}

export function LeafIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M11 20A7 7 0 0 1 4 13c0-5 3-9 9-9 5 0 9 4 9 9a7 7 0 0 1-7 7" />
      <path d="M2 22s2-8 8-10" />
    </svg>
  )
}

export function FilmIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 3v18M17 3v18M3 7h4M3 12h4M3 17h4M17 7h4M17 12h4M17 17h4" />
    </svg>
  )
}

export function FileTextIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

export function HistoryIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 3v5h5" />
      <path d="M3.05 13a9 9 0 1 0 .5-4.6" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}

export function AlertIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m21.7 16.5-9-15a1.7 1.7 0 0 0-3 0l-9 15A1.7 1.7 0 0 0 2.2 19h17.6a1.7 1.7 0 0 0 1.5-2.5z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  )
}

export function FlameIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-1-2.4-1.5-3.5C9 7.5 8.5 6 8.5 4.5c.7 1 1.5 2 2 3 .8 1.5 1 3 1 4.5 0 4-3 6-3 6s-3-2-3-6c0-1.5.5-3 1-4.5C7 6.5 7.5 5 7.5 3.5" />
      <path d="M9.4 22A6.4 6.4 0 0 1 3 15.6c0-2.5 1.5-4.6 3.5-6.5C8 12 11 13 11 15.5c0 .9-.5 1.7-1.6 2" />
      <path d="M14.6 22a6.4 6.4 0 0 0 6.4-6.4c0-1.7-.7-3.2-1.7-4.5C17 14 14 15 14 17c0 .9.5 1.7 1.6 2" />
    </svg>
  )
}

export function WindIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
      <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
    </svg>
  )
}

export function PlayIcon(p: IconProps) {
  return (
    <svg {...base(p)} fill="currentColor" stroke="none">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  )
}

export function PauseIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

export function CopyIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export function CheckIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function ArrowDownRightIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <line x1="7" y1="7" x2="17" y2="17" />
      <polyline points="17 7 17 17 7 17" />
    </svg>
  )
}

export function ArrowUpRightIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  )
}

export function ZapIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export function ThermoIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M14 14.76V3a2 2 0 1 0-4 0v11.76a4 4 0 1 0 4 0z" />
    </svg>
  )
}

export function ActivityIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

export function FactoryIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
      <path d="M17 18h1M12 18h1M7 18h1" />
    </svg>
  )
}

export function CircleIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}
