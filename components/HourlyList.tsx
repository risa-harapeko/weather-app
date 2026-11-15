import type { HourForecast } from "@/lib/weather-types";
import { weatherStyle } from "@/lib/weather-display";

/** 選んだ日の 3 時間ごとの予報一覧 */
export default function HourlyList({ hours }: { hours: HourForecast[] }) {
  return (
    <section aria-labelledby="hourly-title">
      <h2 id="hourly-title" className="mb-2 text-lg font-bold text-gray-900">
        3時間ごとの予報
      </h2>
      {hours.length === 0 ? (
        <p className="rounded-xl border-2 border-gray-200 bg-white p-4 text-base text-gray-700">
          この日の残りの時間帯の予報はありません。明日以降の日付をえらんでください。
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border-2 border-gray-200 bg-white">
          {hours.map((h) => {
            const style = weatherStyle(h.icon);
            return (
              <li
                key={h.dt}
                className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-2 px-3 py-3 text-base text-gray-900"
              >
                <span className="font-bold tabular-nums">{h.time}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true" className="text-2xl leading-none">
                    {style.emoji}
                  </span>
                  <span className="min-w-0 break-words">{h.description}</span>
                </span>
                <span className="flex flex-col items-end tabular-nums sm:flex-row sm:gap-4">
                  <span className="font-bold">{h.temp}℃</span>
                  <span className="text-gray-700">
                    <span aria-hidden="true">☂️</span>
                    <span className="sr-only">雨の降る確率</span>
                    {h.pop}%
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
