// おでかけ日和ランキング：日ごとの点数（100点満点）と順位の計算

import type { DayForecast } from "./weather-types";

export type WeatherCategory = "sunny" | "cloudy" | "rainy" | "snowy" | "unknown";

/**
 * OpenWeatherMap のアイコンコードから、点数用の天気の区分と表示名を決める。
 * - 01 快晴・02 晴れ時々くもり → 晴れ
 * - 03・04 くもり、50 霧 → くもり（霧は表示名だけ「霧」）
 * - 09・10 雨、11 雷雨 → 雨、13 → 雪
 */
export function weatherCategory(icon: string): { category: WeatherCategory; label: string } {
  switch (icon.slice(0, 2)) {
    case "01":
    case "02":
      return { category: "sunny", label: "晴れ" };
    case "03":
    case "04":
      return { category: "cloudy", label: "くもり" };
    case "50":
      return { category: "cloudy", label: "霧" };
    case "09":
    case "10":
      return { category: "rainy", label: "雨" };
    case "11":
      return { category: "rainy", label: "雷雨" };
    case "13":
      return { category: "snowy", label: "雪" };
    default:
      return { category: "unknown", label: "不明" };
  }
}

const WEATHER_POINTS: Record<WeatherCategory, number> = {
  sunny: 40,
  cloudy: 25,
  rainy: 0,
  snowy: 0,
  unknown: 0,
};

/** 降水確率の点数（0〜40点）。0% で 40点、100% で 0点。データがないときは真ん中の 20点 */
export function popPoints(pop: number | null): number {
  if (pop === null) return 20;
  const p = Math.min(100, Math.max(0, pop));
  return Math.round((40 * (100 - p)) / 100);
}

/** 気温の点数（0〜20点）。最高気温 18〜25℃ で 20点、そこから 1℃ 外れるごとに 2点減点 */
export function tempPoints(tempMax: number): number {
  const off = tempMax < 18 ? 18 - tempMax : tempMax > 25 ? tempMax - 25 : 0;
  return Math.max(0, Math.round(20 - off * 2));
}

export type DayScore = {
  date: string;
  icon: string;
  weatherLabel: string;
  weather: number;
  pop: number;
  temp: number;
  /** 合計（0〜100点） */
  total: number;
};

export function scoreDay(day: DayForecast): DayScore {
  const { category, label } = weatherCategory(day.icon);
  const weather = WEATHER_POINTS[category];
  const pop = popPoints(day.pop);
  const temp = tempPoints(day.tempMax);
  return {
    date: day.date,
    icon: day.icon,
    weatherLabel: label,
    weather,
    pop,
    temp,
    total: Math.min(100, Math.max(0, weather + pop + temp)),
  };
}

export type RankedDay = DayScore & { rank: number };

/**
 * 点数の高い順に並べて順位を付ける。
 * 同じ点数の日は同じ順位（例：1位・1位・3位）にし、並びは日付の早い順。
 */
export function rankDays(days: DayForecast[]): RankedDay[] {
  const sorted = days
    .map(scoreDay)
    .sort((a, b) => b.total - a.total || a.date.localeCompare(b.date));
  return sorted.map((s) => ({
    ...s,
    rank: sorted.findIndex((o) => o.total === s.total) + 1,
  }));
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "YYYY-MM-DD" → { text: "11/28（土）", isHoliday: true }（土日を休日とする） */
export function shortDateJa(date: string): { text: string; isHoliday: boolean } {
  const [y, m, d] = date.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { text: `${m}/${d}（${WEEKDAYS[w]}）`, isHoliday: w === 0 || w === 6 };
}
