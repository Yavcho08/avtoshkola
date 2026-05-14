interface Props { className?: string }

export function Spinner({ className = 'h-6 w-6' }: Props) {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${className}`}
      role="status"
      aria-label="Зареждане…"
    />
  );
}
