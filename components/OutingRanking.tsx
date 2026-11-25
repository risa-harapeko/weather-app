"use client";

import type { DayForecast } from "@/lib/weather-types";
import { weatherStyle } from "@/lib/weather-display";
import { rankDays, shortDateJa } from "@/lib/outing-ranking";

type Props = {
  days: DayForecast[];
  /** いま表示している日 "YYYY-MM-DD" */
  selectedDate: string;
  onSelect: (date: string) => void;
};

/** 予報の日ごとに点数を付け、おでかけに向いている順に並べる */
export default function OutingRanking({ days, selectedDate, onSelect }: Props) {
  const ranked = rankDays(days);

  return (
    <section
      aria-labelledby="ranking-title"
      className="rounded-2xl border-2 border-gray-200 bg-white p-5 text-gray-900"
    >
      <h2 id="ranking-title" className="flex items-center gap-2 text-lg font-bold">
        <span aria-hidden="true">🏆</span>
        おでかけ日和ランキング
      </h2>
      <p className="text-base text-gray-700">
        {ranked.length}日分の予報を、天気・雨の降る確率・気温から100点満点で点数にしました。押すとその日の予報を表示します。
      </p>

      {ranked.length === 0 ? (
        <p className="mt-3 text-base text-gray-700">ランキングを出せる予報がありません。</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {ranked.map((r) => {
            const { text, isHoliday } = shortDateJa(r.date);
            const isSelected = r.date === selectedDate;
            return (
              <li key={r.date}>
                <button
                  type="button"
                  onClick={() => onSelect(r.date)}
                  aria-current={isSelected ? "date" : undefined}
                  aria-label={`${r.rank}位 ${text}${isHoliday ? " 休日" : ""} ${r.weatherLabel} ${r.total}点${isSelected ? "（表示中）" : ""}`}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left text-base hover:bg-gray-50 focus-visible:border-blue-600 focus-visible:outline-none ${
                    isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <span className="w-10 shrink-0 font-bold tabular-nums">{r.rank}位</span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-bold tabular-nums">{text}</span>
                    {isHoliday && (
                      <span className="rounded-md border-2 border-rose-700 px-1.5 text-base font-bold leading-tight text-rose-800">
                        休日
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span aria-hidden="true" className="text-2xl leading-none">
                        {weatherStyle(r.icon).emoji}
                      </span>
                      {r.weatherLabel}
                    </span>
                    {isSelected && <span className="text-gray-700">（表示中）</span>}
                  </span>
                  <span className="shrink-0 text-xl font-bold tabular-nums">
                    {r.total}
                    <span className="text-base">点</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-3 text-base text-gray-600">
        点数の内訳：天気（晴れ40点・くもり25点・雨や雪0点）＋雨の降る確率（低いほど高く、最大40点）＋気温（最高気温18〜25℃で20点、1℃外れるごとに2点減点）
      </p>
    </section>
  );
}
