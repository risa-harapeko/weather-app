"use client";

import { useState, type FormEvent } from "react";

type Props = {
  onSearch: (city: string) => void;
  onCurrentLocation: () => void;
  disabled: boolean;
};

/** 都市名の検索欄と「現在地」ボタン */
export default function SearchBar({ onSearch, onCurrentLocation, disabled }: Props) {
  const [city, setCity] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = city.trim();
    if (value) onSearch(value);
  }

  return (
    <div className="flex flex-col gap-3">
      <form role="search" onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="city" className="sr-only">
          都市名
        </label>
        <input
          id="city"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="都市名（例：大阪、札幌、London）"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded-lg border-2 border-gray-300 bg-white px-3 text-base text-gray-900 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled || city.trim() === ""}
          className="min-h-11 min-w-11 shrink-0 rounded-lg bg-blue-600 px-4 text-base font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          検索
        </button>
      </form>
      <button
        type="button"
        onClick={onCurrentLocation}
        disabled={disabled}
        className="flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border-2 border-blue-600 bg-white px-4 text-base font-bold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-500"
      >
        <span aria-hidden="true">📍</span>
        現在地の天気
      </button>
    </div>
  );
}
