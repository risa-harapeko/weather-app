// お出かけ前チェックリスト：選んだ日の天気から項目を決めるルールと、チェック状態の保存

import type { DayForecast } from "./weather-types";

export type ChecklistItem = {
  /** 保存用の ID（項目の内容が変われば ID も変わる） */
  id: string;
  emoji: string;
  label: string;
};

/**
 * ルール
 * - 降水確率 50% 以上 →「傘を持った？」
 * - 最高気温 15℃ 未満 →「上着がいるかも」
 * - 降水確率 30% 未満かつ湿度 70% 未満 →「洗濯物は外干しOK」、それ以外は「部屋干しがおすすめ」
 * 降水確率のデータがない（null）ときは、傘は出さず、洗濯物は安全側の「部屋干し」にする。
 */
export function buildChecklist(day: DayForecast): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  if (day.pop !== null && day.pop >= 50) {
    items.push({ id: "umbrella", emoji: "☂️", label: "傘を持った？" });
  }
  if (day.tempMax < 15) {
    items.push({ id: "jacket", emoji: "🧥", label: "上着がいるかも" });
  }
  if (day.pop !== null && day.pop < 30 && day.humidity < 70) {
    items.push({ id: "laundry-outside", emoji: "👕", label: "洗濯物は外干しOK" });
  } else {
    items.push({ id: "laundry-inside", emoji: "🏠", label: "部屋干しがおすすめ" });
  }
  return items;
}

const STORAGE_PREFIX = "outing-checklist:";

/** その日にチェックを付けた項目 ID を読み出す（使えない環境・壊れたデータなら空） */
export function loadChecked(date: string): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + date);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * その日のチェック状態を保存し、ついでに today より前の日付のデータを削除する
 * （保存できなくても画面の操作は続けられる）
 */
export function saveChecked(date: string, ids: string[], today: string): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + date, JSON.stringify(ids));
  } catch {
    // プライベートモードなどで保存できないときは何もしない
  }
  removeOldEntries(today);
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** today（"YYYY-MM-DD"）より前の日付のチェック状態を localStorage から消す */
export function removeOldEntries(today: string): void {
  try {
    const storage = window.localStorage;
    const oldKeys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const date = key.slice(STORAGE_PREFIX.length);
      // "YYYY-MM-DD" は文字列比較で前後が分かる
      if (DATE_PATTERN.test(date) && date < today) oldKeys.push(key);
    }
    // ループ中に消すと番号がずれるので、集めてからまとめて消す
    for (const key of oldKeys) storage.removeItem(key);
  } catch {
    // localStorage が使えないときは何もしない
  }
}
