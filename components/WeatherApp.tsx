"use client";

import { useEffect, useRef, useState } from "react";
import type { WeatherErrorResponse, WeatherResponse } from "@/lib/weather-types";
import SearchBar from "./SearchBar";
import DateSelector from "./DateSelector";
import DaySummary from "./DaySummary";
import HourlyList from "./HourlyList";
import OutingChecklist from "./OutingChecklist";
import Spinner from "./Spinner";
import ErrorMessage from "./ErrorMessage";

const DEFAULT_CITY = "東京";

type Query = { city: string } | { lat: number; lon: number };

type Result = { ok: true; data: WeatherResponse } | { ok: false; error: string };

/** 自作 API（/api/weather）から天気を取ってくる。OpenWeatherMap には直接つながない */
async function fetchWeather(query: Query): Promise<Result> {
  const params = new URLSearchParams(
    "city" in query
      ? { city: query.city }
      : { lat: String(query.lat), lon: String(query.lon) },
  );
  try {
    const res = await fetch(`/api/weather?${params}`);
    const body = (await res.json()) as WeatherResponse | WeatherErrorResponse;
    if (!res.ok || "error" in body) {
      return {
        ok: false,
        error: "error" in body ? body.error : "天気情報を取得できませんでした。",
      };
    }
    return { ok: true, data: body };
  } catch {
    return {
      ok: false,
      error: "通信できませんでした。インターネット接続を確認して、もう一度お試しください。",
    };
  }
}

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "位置情報の利用が許可されていません。ブラウザの設定で位置情報を許可するか、都市名で検索してください。";
    case err.POSITION_UNAVAILABLE:
      return "現在地を特定できませんでした。電波の良い場所でもう一度お試しいただくか、都市名で検索してください。";
    case err.TIMEOUT:
      return "現在地の取得に時間がかかりすぎました。もう一度お試しいただくか、都市名で検索してください。";
    default:
      return "現在地を取得できませんでした。都市名で検索してください。";
  }
}

export default function WeatherApp() {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingLabel, setLoadingLabel] = useState("天気を読み込み中…");
  const [error, setError] = useState<string | null>(null);
  // 古いリクエストの結果で新しい結果を上書きしないための番号
  const requestId = useRef(0);

  function applyResult(id: number, result: Result) {
    if (id !== requestId.current) return;
    setLoading(false);
    if (result.ok) {
      setData(result.data);
      setSelectedDate(result.data.today);
      setError(null);
    } else {
      setError(result.error);
    }
  }

  async function load(query: Query) {
    const id = ++requestId.current;
    setLoading(true);
    setLoadingLabel("天気を読み込み中…");
    setError(null);
    applyResult(id, await fetchWeather(query));
  }

  // 初期表示は東京
  useEffect(() => {
    const id = ++requestId.current;
    fetchWeather({ city: DEFAULT_CITY }).then((result) => applyResult(id, result));
  }, []);

  function handleCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setError("お使いのブラウザは位置情報に対応していません。都市名で検索してください。");
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setLoadingLabel("現在地を調べています…");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (id !== requestId.current) return;
        void load({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        if (id !== requestId.current) return;
        setLoading(false);
        setError(geolocationErrorMessage(err));
      },
      { timeout: 15000, maximumAge: 10 * 60 * 1000 },
    );
  }

  const day = data?.days.find((d) => d.date === selectedDate) ?? data?.days[0];
  const lastDate = data?.days.at(-1)?.date ?? "";

  return (
    <div className="flex flex-col gap-5">
      <SearchBar
        onSearch={(city) => void load({ city })}
        onCurrentLocation={handleCurrentLocation}
        disabled={loading}
      />

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <Spinner label={loadingLabel} />
      ) : (
        data &&
        day && (
          <>
            <DateSelector
              value={day.date}
              min={data.today}
              max={lastDate}
              onChange={setSelectedDate}
            />
            <DaySummary day={day} data={data} />
            <OutingChecklist key={day.date} day={day} today={data.today} />
            <HourlyList hours={day.hours} />
          </>
        )
      )}
    </div>
  );
}
