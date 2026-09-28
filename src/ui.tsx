import type { ReactNode, SVGProps } from 'react'

export function cx(...xs: (string | false | undefined | null)[]): string {
  return xs.filter(Boolean).join(' ')
}

type IP = SVGProps<SVGSVGElement> & { children?: ReactNode }

function base(p: IP) {
  return {
    width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    ...p
  }
}

export const IHome = (p: IP) => (
  <svg {...base(p)}><path d="M4 11.5 12 4l8 7.5" /><path d="M6.5 10.5V20h11v-9.5" /><path d="M10 20v-5h4v5" /></svg>
)
export const IBook = (p: IP) => (
  <svg {...base(p)}><path d="M5 4.5h6.5a2 2 0 0 1 2 2V20a1.6 1.6 0 0 0-1.6-1.6H5z" /><path d="M19 4.5h-5.5a2 2 0 0 0-2 2V20a1.6 1.6 0 0 1 1.6-1.6H19z" /></svg>
)
export const ICards = (p: IP) => (
  <svg {...base(p)}><rect x="3.5" y="7" width="13" height="14" rx="2" /><path d="M8 4h10.5A2.5 2.5 0 0 1 21 6.5V17" /></svg>
)
export const IRepeat = (p: IP) => (
  <svg {...base(p)}><path d="M4 9.5A5.5 5.5 0 0 1 9.5 4H18l-2.5-2.5M20 14.5A5.5 5.5 0 0 1 14.5 20H6l2.5 2.5" /><path d="M18 4l-2.5 2.5M6 20l2.5-2.5" /></svg>
)
export const ISentence = (p: IP) => (
  <svg {...base(p)}><path d="M4 5h16M4 10h13M4 15h16M4 20h9" /></svg>
)
export const ITutor = (p: IP) => (
  <svg {...base(p)}><path d="M12 3.5a7 7 0 0 1 7 7v4a7 7 0 0 1-14 0v-4a7 7 0 0 1 7-7z" /><path d="M9 10.5h.01M15 10.5h.01" /><path d="M9.5 14.5c.7.7 1.6 1 2.5 1s1.8-.3 2.5-1" /><path d="M2.5 11.5v3M21.5 11.5v3" /></svg>
)
export const IRes = (p: IP) => (
  <svg {...base(p)}><path d="M10 14.5 20 4.5" /><path d="M14 4.5h6v6" /><path d="M18.5 13.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5h5.5" /></svg>
)
export const IGear = (p: IP) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" /></svg>
)
export const ISearch = (p: IP) => (
  <svg {...base(p)}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
)
export const IStar = (p: IP) => (
  <svg {...base(p)}><path d="m12 3.5 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z" /></svg>
)
export const IVideo = (p: IP) => (
  <svg {...base(p)}><rect x="3" y="6" width="12.5" height="12" rx="2.5" /><path d="m15.5 10.5 5.5-3v9l-5.5-3" /></svg>
)
export const IX = (p: IP) => (
  <svg {...base(p)}><path d="m6 6 12 12M18 6 6 18" /></svg>
)
export const IPlus = (p: IP) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const ICheck = (p: IP) => (
  <svg {...base(p)}><path d="m4.5 12.5 5 5 10-11" /></svg>
)
export const IFlame = (p: IP) => (
  <svg {...base(p)}><path d="M12 3c1 3-3 4.5-3 8a3.5 3.5 0 0 0 7 .3c1.2 1 1.8 2.2 1.8 3.7A5.8 5.8 0 0 1 12 20.8 5.9 5.9 0 0 1 6.2 15C6.2 9.5 11 8.5 12 3z" /></svg>
)
export const IDice = (p: IP) => (
  <svg {...base(p)}><rect x="4" y="4" width="16" height="16" rx="3.5" /><path d="M9 9h.01M15 15h.01M15 9h.01M9 15h.01" /></svg>
)
export const IUpload = (p: IP) => (
  <svg {...base(p)}><path d="M12 15.5v-11M7.5 8.5 12 4l4.5 4.5" /><path d="M4.5 15.5v3A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-3" /></svg>
)
export const IDownload = (p: IP) => (
  <svg {...base(p)}><path d="M12 4.5v11M7.5 11.5 12 16l4.5-4.5" /><path d="M4.5 15.5v3A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-3" /></svg>
)

/** 标题下的手绘波浪线 */
export function Squiggle({ color = 'var(--peach)', width = 92 }: { color?: string; width?: number }) {
  return (
    <svg width={width} height="10" viewBox="0 0 92 10" fill="none" aria-hidden>
      <path d="M2 6.5c7-5 12 5 19 0s12 5 19 0 12 5 19 0 12 5 19 0 10-4 12-3"
        stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
