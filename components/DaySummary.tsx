import type { DayForecast, WeatherResponse } from "@/lib/weather-types";
import {
  formatDateJa,
  relativeDayLabel,
  weatherStyle,
  windLabel,
} from "@/lib/weather-display";

type Props = {
  day: DayForecast;
  data: WeatherResponse;
};

/** 選んだ日の天気のまとめ */
export default function DaySummary({ day, data }: Props) {
  const style = weatherStyle(day.icon);
  const isToday = day.date === data.today;
  const rel = relativeDayLabel(day.date, data.today);

  return (
    <section
      aria-labelledby="summary-title"
      className={`rounded-2xl border-2 p-5 text-gray-900 ${style.className}`}
    >
      <h2 id="summary-title" className="text-lg font-bold">
        {data.location.name}
        {data.location.country && data.location.country !== "JP" && (
          <span className="ml-2 font-normal text-gray-600">({data.location.country})</span>
        )}
      </h2>
      <p className="text-base text-gray-700">
        {rel && <span className="font-bold">{rel}・</span>}
        {formatDateJa(day.date)}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <span className="text-6xl leading-none" aria-hidden="true">
          {style.emoji}
        </span>
        <div>
          <p className="text-2xl font-bold">{day.description}</p>
          {isToday && (
            <p className="text-base text-gray-700">
              いまの気温 <span className="text-xl font-bold">{data.current.temp}℃</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-6 text-base">
        <p>
          <span className="text-gray-700">最高 </span>
          <span className="text-2xl font-bold text-red-700">{day.tempMax}℃</span>
        </p>
        <p>
          <span className="text-gray-700">最低 </span>
          <span className="text-2xl font-bold text-blue-700">{day.tempMin}℃</span>
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-2 text-base min-[400px]:grid-cols-3">
        <Stat
          emoji="☂️"
          label="雨の降る確率"
          value={day.pop === null ? "—" : `${day.pop}%`}
        />
        <Stat emoji="💧" label="湿度" value={`${day.humidity}%`} />
        <Stat
          emoji="🍃"
          label="風"
          value={`${day.windSpeed} m/s`}
          note={windLabel(day.windSpeed)}
        />
      </dl>
    </section>
  );
}

function Stat({
  emoji,
  label,
  value,
  note,
}: {
  emoji: string;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2 min-[400px]:flex-col min-[400px]:items-start min-[400px]:justify-start">
      <dt className="text-gray-700">
        <span aria-hidden="true">{emoji} </span>
        {label}
      </dt>
      <dd className="font-bold">
        {value}
        {note && <span className="ml-1 font-normal text-gray-700">（{note}）</span>}
      </dd>
    </div>
  );
}
