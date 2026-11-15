/** エラーを分かりやすく伝える枠（色だけでなくアイコンと見出しでも伝える） */
export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-base text-red-900"
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        ⚠️
      </span>
      <div>
        <p className="font-bold">うまく表示できませんでした</p>
        <p className="mt-1">{message}</p>
      </div>
    </div>
  );
}
