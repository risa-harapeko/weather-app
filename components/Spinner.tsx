/** 読み込み中のくるくるマーク */
export default function Spinner({ label = "読み込み中…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-12 text-base text-gray-700"
    >
      <span
        aria-hidden="true"
        className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"
      />
      <span>{label}</span>
    </div>
  );
}
