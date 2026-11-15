"use client";

import { addDays } from "@/lib/weather-display";

type Props = {
  value: string;
  /** 選べる最初の日（今日） "YYYY-MM-DD" */
  min: string;
  /** 選べる最後の日 "YYYY-MM-DD" */
  max: string;
  onChange: (date: string) => void;
};

const navButton =
  "flex min-h-11 min-w-11 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-xl text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";

/** カレンダーで日付を選ぶ（min〜max の範囲外は選べない） */
export default function DateSelector({ value, min, max, onChange }: Props) {
  function select(date: string) {
    // 手入力などで範囲外・空の日付が来たら無視する（"YYYY-MM-DD" は文字列比較で前後が分かる）
    if (!date || date < min || date > max) return;
    onChange(date);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="forecast-date" className="text-base font-bold text-gray-800">
        日付をえらぶ
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={navButton}
          onClick={() => select(addDays(value, -1))}
          disabled={value <= min}
          aria-label="前の日"
        >
          ‹
        </button>
        <input
          id="forecast-date"
          type="date"
          value={value}
          min={min}
          max={max}
          required
          onChange={(e) => select(e.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded-lg border-2 border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-blue-600 focus:outline-none"
        />
        <button
          type="button"
          className={navButton}
          onClick={() => select(addDays(value, 1))}
          disabled={value >= max}
          aria-label="次の日"
        >
          ›
        </button>
      </div>
      <p className="text-base text-gray-600">今日から5日先まで選べます</p>
    </div>
  );
}
