/** Leora's mark: an audio waveform, standing in for the voice-briefing product. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`mark ${className}`.trim()}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
        <path d="M7 15V9M12 17V7M17 15V10" />
      </svg>
    </span>
  );
}
