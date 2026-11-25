"use client";

import { useState } from "react";
import type { HourForecast } from "@/lib/weather-types";
import { weatherStyle } from "@/lib/weather-display";
import {
  loadPickupTime,
  nearestIndex,
  rainMessage,
  savePickupTime,
  toJst,
} from "@/lib/pickup-time";

type Props = {
  /** 選んだ日の 3 時間ごとの予報（予報がある時間帯だけ） */
  hours: HourForecast[];
  /** 選んだ日（現地） "YYYY-MM-DD" */
  date: string;
};

/** お迎えの時間帯をスライダーで選び、その時間の天気を見る */
export default function PickupSlider({ hours, date }: Props) {
  // 選んでいる時刻（日本時間 "HH:MM"）。日付や都市が変わっても、この時刻にいちばん近い時間帯を選ぶ。
  // 天気データは画面側で取得してから描画されるので、ここでは localStorage を直接読める
  const [pickupTime, setPickupTime] = useState(loadPickupTime);

  const slots = [...hours]
    .sort((a, b) => a.dt - b.dt)
    .map((h) => ({ ...h, jst: toJst(h.dt) }));
  const index = nearestIndex(
    slots.map((s) => s.jst.time),
    pickupTime,
  );

  function handleChange(i: number) {
    const slot = slots[i];
    if (!slot) return;
    setPickupTime(slot.jst.time);
    savePickupTime(slot.jst.time);
  }

  return (
    <section
      aria-labelledby="pickup-title"
      className="rounded-2xl border-2 border-gray-200 bg-white p-5 text-gray-900"
    >
      <h2 id="pickup-title" className="flex items-center gap-2 text-lg font-bold">
        <span aria-hidden="true">🚸</span>
        お迎え時間スライダー
      </h2>

      {index < 0 ? (
        <p className="mt-2 text-base text-gray-700">
          この日の残りの時間帯の予報はありません。明日以降の日付をえらんでください。
        </p>
      ) : (
        <SliderBody slots={slots} index={index} date={date} onChange={handleChange} />
      )}
    </section>
  );
}

type Slot = HourForecast & { jst: { date: string; time: string } };

function SliderBody({
  slots,
  index,
  date,
  onChange,
}: {
  slots: Slot[];
  index: number;
  date: string;
  onChange: (i: number) => void;
}) {
  const slot = slots[index];
  const style = weatherStyle(slot.icon);
  const rain = rainMessage(slot.pop);
  const last = slots.length - 1;
  // 海外の都市では日本時間と現地時間がずれるので、両方出す
  const showLocal = slot.time !== slot.jst.time;
  const [, jm, jd] = slot.jst.date.split("-").map(Number);

  return (
    <>
      <p className="mt-2 text-base text-gray-700">
        スライダーでお迎えの時間をえらぶと、その時間の天気を表示します。
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-1">
        <p>
          <span className="block text-base text-gray-700">
            日本時間
            {slot.jst.date !== date && `（${jm}/${jd}）`}
          </span>
          <span className="text-5xl font-bold tabular-nums leading-tight">{slot.jst.time}</span>
        </p>
        {showLocal && (
          <p className="text-base text-gray-700">
            現地時間 <span className="font-bold tabular-nums">{slot.time}</span>
          </p>
        )}
      </div>

      <div className="mt-3">
        <label htmlFor="pickup-slider" className="sr-only">
          お迎えの時間（日本時間）
        </label>
        <input
          id="pickup-slider"
          type="range"
          min={0}
          max={last}
          step={1}
          value={index}
          disabled={last === 0}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={`日本時間 ${slot.jst.time}、${slot.description}、${slot.temp}℃、雨の降る確率${slot.pop}%`}
          className="pickup-slider"
        />
        {/* 目盛り：予報がある時間帯の位置だけに付ける（つまみの中心と合うよう左右 22px 内側） */}
        <div aria-hidden="true" className="relative mx-[22px] h-2">
          {slots.map((s, i) => (
            <span
              key={s.dt}
              className="absolute top-0 h-2 w-0.5 -translate-x-1/2 bg-gray-500"
              style={{ left: last === 0 ? "0%" : `${(i / last) * 100}%` }}
            />
          ))}
        </div>
        <div aria-hidden="true" className="mt-1 flex justify-between text-base text-gray-700 tabular-nums">
          <span>{slots[0].jst.time}</span>
          {last > 0 && <span>{slots[last].jst.time}</span>}
        </div>
        {last === 0 && (
          <p className="mt-1 text-base text-gray-700">この日に選べる時間帯はこの1つだけです。</p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-2 text-base min-[400px]:grid-cols-3">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 min-[400px]:flex-col min-[400px]:items-start">
          <dt className="text-gray-700">天気</dt>
          <dd className="flex items-center gap-1 font-bold">
            <span aria-hidden="true" className="text-2xl leading-none">
              {style.emoji}
            </span>
            {slot.description}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 min-[400px]:flex-col min-[400px]:items-start">
          <dt className="text-gray-700">気温</dt>
          <dd className="font-bold tabular-nums">{slot.temp}℃</dd>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 min-[400px]:flex-col min-[400px]:items-start">
          <dt className="text-gray-700">
            <span aria-hidden="true">☂️ </span>雨の降る確率
          </dt>
          <dd className="font-bold tabular-nums">{slot.pop}%</dd>
        </div>
      </dl>

      <p
        aria-live="polite"
        className={`mt-4 flex items-start gap-2 rounded-xl border-2 px-3 py-3 text-base font-bold ${
          rain.rainy ? "border-blue-700 bg-blue-50 text-blue-900" : "border-gray-300 bg-gray-50 text-gray-900"
        }`}
      >
        <span aria-hidden="true" className="text-2xl leading-none">
          {rain.emoji}
        </span>
        <span>{rain.text}</span>
      </p>
    </>
  );
}
