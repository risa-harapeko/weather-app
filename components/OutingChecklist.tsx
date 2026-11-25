"use client";

import { useState } from "react";
import type { DayForecast } from "@/lib/weather-types";
import { buildChecklist, loadChecked, saveChecked } from "@/lib/outing-checklist";

/**
 * お出かけ前チェックリスト。
 * 日付が変わったら作り直すように、呼び出し側で key={day.date} を付けること。
 */
export default function OutingChecklist({ day }: { day: DayForecast }) {
  const items = buildChecklist(day);
  // 天気データは画面側で取得してから描画されるので、ここでは localStorage を直接読める
  const [checked, setChecked] = useState<string[]>(() => loadChecked(day.date));

  function toggle(id: string) {
    const next = checked.includes(id)
      ? checked.filter((c) => c !== id)
      : [...checked, id];
    setChecked(next);
    saveChecked(day.date, next);
  }

  const doneCount = items.filter((item) => checked.includes(item.id)).length;

  return (
    <section
      aria-labelledby="checklist-title"
      className="rounded-2xl border-2 border-gray-200 bg-white p-5 text-gray-900"
    >
      <h2 id="checklist-title" className="flex items-center gap-2 text-lg font-bold">
        <span aria-hidden="true">✅</span>
        お出かけ前チェックリスト
      </h2>
      <p className="text-base text-gray-700">
        {items.length}項目中 {doneCount}項目チェック済み
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => {
          const isChecked = checked.includes(item.id);
          const inputId = `checklist-${item.id}`;
          return (
            <li key={item.id}>
              <label
                htmlFor={inputId}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 border-gray-200 px-3 py-2 text-base hover:bg-gray-50 has-[:focus-visible]:border-blue-600"
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  className="size-6 shrink-0 cursor-pointer accent-blue-700"
                />
                <span aria-hidden="true" className="text-2xl leading-none">
                  {item.emoji}
                </span>
                <span className="min-w-0 flex-1 break-words">{item.label}</span>
                {isChecked && (
                  <span aria-hidden="true" className="shrink-0 font-bold text-gray-700">
                    済
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
