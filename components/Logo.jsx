/* Brand mark: Kubernetes heptagon inside an orbit, on a rounded square. */
export default function Logo({ size = 32, className = 'logo' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lgb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2b6cf0" /><stop offset="1" stopColor="#0a3a9e" /></linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lgb)" />
      <polygon points="16.00,9.20 21.63,11.91 23.02,18.00 19.12,22.89 12.88,22.89 8.98,18.00 10.37,11.91" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="16" cy="16.4" rx="13.2" ry="4.6" transform="rotate(-24 16 16.4)" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.3" />
      <circle cx="16" cy="16.4" r="1.9" fill="#fff" />
      <circle cx="24.80" cy="9.59" r="1.9" fill="#7fd1ff" stroke="#0a3a9e" strokeWidth=".8" />
    </svg>
  );
}
