export function ErrorBanner({ message }: { message?: string | string[] }) {
  const text = Array.isArray(message) ? message[0] : message;
  if (!text) return null;

  return (
    <p
      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      role="alert"
    >
      {text}
    </p>
  );
}
