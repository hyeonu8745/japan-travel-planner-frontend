const paths = {
  history: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/><path d="M12 6v6l4 3"/></>,
  luggage: <><rect x="5" y="6" width="14" height="15" rx="2"/><path d="M9 6V3h6v3M9 10v7m6-7v7M8 21v1m8-1v1"/></>,
  bed: <><path d="M3 4v17m18-9v9M3 17h18M3 12h18v5M9 12V8h9a3 3 0 0 1 3 3v1"/><circle cx="6" cy="9" r="2"/></>,
  heart: <path d="M12 21 3.5 12.5a5.7 5.7 0 0 1 8.5-7.6 5.7 5.7 0 0 1 8.5 7.6Z"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/></>,

  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></>,
  moon: <path d="M20 14A9 9 0 0 1 10 3a9 9 0 1 0 10 11Z"/>,
  leaf: <><path d="M20 3C8 2 2 8 5 16c7 5 15-1 15-13ZM5 20 16 8"/></>,
  coffee: <><path d="M3 7h13v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Zm13 0h2a3 3 0 0 1 0 6h-2M5 3v1m5-1v1m5-1v1"/></>,
  wine: <><path d="M8 3h8l1 6a5 5 0 0 1-10 0Zm-1 6h10M12 14v7m-4 0h8"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 5 3 2 5-4"/></>,
  people: <><circle cx="9" cy="7" r="3"/><circle cx="18" cy="9" r="2"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-6a4 4 0 0 1 5 4v2"/></>,
  bag: <><path d="M5 8h14l2 13H3ZM8 8V6a4 4 0 0 1 8 0v2"/></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 3" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  WALK: <><circle cx="13" cy="4" r="2" /><path d="m8 11 3-4 4 4 4 1M12 8l-2 7-4 6m4-6 5 2 2 4" /></>,
  DRIVE: <><path d="m4 10 2-5h12l2 5v9H4Zm0 1h16M7 15h1m8 0h1M6 19v2m12-2v2" /></>,
  TRANSIT: <><rect x="5" y="3" width="14" height="16" rx="3" /><path d="M5 11h14M12 3v8M8 19l-2 3m10-3 2 3M8 15h1m6 0h1" /></>,
  food: <><path d="M5 3v6m3-6v6M2 3v6a3 3 0 0 0 6 0M5 12v9M19 3c-3 2-4 6-4 9h4m0-9v18" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h3" /></>,
  check: <path d="m5 12 4 4L19 6" />,
};

export default function PanelIcon({ name, className = "" }) {
  return <svg className={`panel-icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.check}</svg>;
}
