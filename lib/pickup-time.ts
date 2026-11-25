// お迎え時間スライダー：日本時間への変換、初期位置の決め方、時刻の保存

const JST_OFFSET_SECONDS = 9 * 60 * 60;
const STORAGE_KEY = "pickup-time";
/** 保存した時刻がないときの基準 */
export const DEFAULT_PICKUP_TIME = "18:00";
/** これ以上なら傘をすすめる降水確率（%） */
export const RAIN_THRESHOLD = 50;

/** UNIX 時刻（秒）→ 日本時間の { date: "YYYY-MM-DD", time: "HH:MM" } */
export function toJst(dt: number): { date: string; time: string } {
  const iso = new Date((dt + JST_OFFSET_SECONDS) * 1000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** "HH:MM" → 0時からの分数。形が正しくなければ null */
function toMinutes(time: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/**
 * 日本時間の時刻の並び（times）から、target にいちばん近いものの位置を返す。
 * 同じだけ離れているときは遅いほうの時刻を選ぶ。times が空なら -1。
 */
export function nearestIndex(times: string[], target: string): number {
  const t = toMinutes(target) ?? toMinutes(DEFAULT_PICKUP_TIME)!;
  let best = -1;
  let bestDiff = Infinity;
  let bestMin = -1;
  times.forEach((time, i) => {
    const m = toMinutes(time);
    if (m === null) return;
    const diff = Math.abs(m - t);
    if (diff < bestDiff || (diff === bestDiff && m > bestMin)) {
      best = i;
      bestDiff = diff;
      bestMin = m;
    }
  });
  return best;
}

/** 降水確率に応じたお迎え時のメッセージ */
export function rainMessage(pop: number): { rainy: boolean; emoji: string; text: string } {
  return pop >= RAIN_THRESHOLD
    ? { rainy: true, emoji: "☂️", text: "お迎えの時間は雨の可能性があります。傘を用意しよう" }
    : { rainy: false, emoji: "🙆", text: "お迎えの時間は雨の心配は少なそうです" };
}

/** 最後に選んだ時刻（日本時間 "HH:MM"）。なければ 18:00 */
export function loadPickupTime(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && toMinutes(saved) !== null ? saved : DEFAULT_PICKUP_TIME;
  } catch {
    return DEFAULT_PICKUP_TIME;
  }
}

export function savePickupTime(time: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, time);
  } catch {
    // 保存できない環境でも操作は続けられる
  }
}
