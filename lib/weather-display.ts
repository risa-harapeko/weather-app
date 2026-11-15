// 天気の見た目（絵文字アイコン・色）と、日付・数値の表示用ヘルパー

type WeatherStyle = {
  emoji: string;
  /** カードの背景色など（色だけに頼らず、必ずアイコンと文字も一緒に出す） */
  className: string;
};

/**
 * OpenWeatherMap のアイコンコード（例: "01d", "10n"）から見た目を決める。
 * https://openweathermap.org/weather-conditions
 */
export function weatherStyle(icon: string): WeatherStyle {
  const code = icon.slice(0, 2);
  const isNight = icon.endsWith("n");
  switch (code) {
    case "01":
      return {
        emoji: isNight ? "🌙" : "☀️",
        className: "bg-amber-50 border-amber-300",
      };
    case "02":
      return {
        emoji: isNight ? "☁️" : "🌤️",
        className: "bg-amber-50 border-amber-200",
      };
    case "03":
    case "04":
      return { emoji: "☁️", className: "bg-slate-100 border-slate-300" };
    case "09":
      return { emoji: "🌧️", className: "bg-blue-50 border-blue-300" };
    case "10":
      return { emoji: "☔", className: "bg-blue-50 border-blue-300" };
    case "11":
      return { emoji: "⛈️", className: "bg-violet-50 border-violet-300" };
    case "13":
      return { emoji: "❄️", className: "bg-sky-50 border-sky-300" };
    case "50":
      return { emoji: "🌫️", className: "bg-gray-100 border-gray-300" };
    default:
      return { emoji: "🌡️", className: "bg-white border-gray-300" };
  }
}

/** 風速（m/s）を日常語に */
export function windLabel(speed: number): string {
  if (speed < 3) return "おだやか";
  if (speed < 8) return "やや強め";
  if (speed < 14) return "強い";
  return "とても強い";
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "YYYY-MM-DD" → "11月15日（日）" */
export function formatDateJa(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}月${d}日（${WEEKDAYS[w]}）`;
}

/** "YYYY-MM-DD" に日数を足す */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 今日を基準に「今日」「明日」「あさって」 */
export function relativeDayLabel(date: string, today: string): string | null {
  if (date === today) return "今日";
  if (date === addDays(today, 1)) return "明日";
  if (date === addDays(today, 2)) return "あさって";
  return null;
}
