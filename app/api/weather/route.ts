// サーバー側で OpenWeatherMap と通信する自作 API。
// API キーはここ（サーバー）でだけ読み、ブラウザには一切渡さない。
//
// 使い方:
//   GET /api/weather?city=東京
//   GET /api/weather?lat=35.68&lon=139.76

import type { NextRequest } from "next/server";
import type {
  DayForecast,
  HourForecast,
  WeatherErrorResponse,
  WeatherResponse,
} from "@/lib/weather-types";
import { addDays } from "@/lib/weather-display";

const OWM_BASE = "https://api.openweathermap.org";
/** 同じ地点への問い合わせは 10 分間キャッシュして、無料枠の消費を抑える */
const REVALIDATE_SECONDS = 600;
const FORECAST_DAYS = 5;

// ---- OpenWeatherMap のレスポンス型（使う項目だけ） ----

type OwmGeo = {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
};

type OwmWeather = { icon: string; description: string };

type OwmCurrent = {
  dt: number;
  timezone: number;
  name: string;
  sys: { country?: string };
  main: { temp: number; humidity: number };
  wind: { speed: number };
  weather: OwmWeather[];
};

type OwmForecastItem = {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  wind: { speed: number };
  weather: OwmWeather[];
  pop?: number;
};

type OwmForecast = {
  list: OwmForecastItem[];
  city: { timezone: number };
};

/** 画面にそのまま見せられる日本語メッセージ付きのエラー */
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message } satisfies WeatherErrorResponse, {
    status,
  });
}

async function owmFetch<T>(
  path: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<T> {
  const url = new URL(path, OWM_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("appid", apiKey);

  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  } catch {
    throw new ApiError(
      "天気サービスにつながりませんでした。時間をおいてもう一度お試しください。",
      502,
    );
  }

  if (res.status === 401) {
    throw new ApiError(
      "天気サービスの API キーが正しくないか、まだ有効になっていません（キー発行から有効になるまで数時間かかることがあります）。",
      500,
    );
  }
  if (res.status === 404) {
    throw new ApiError("その場所の天気が見つかりませんでした。", 404);
  }
  if (res.status === 429) {
    throw new ApiError(
      "アクセスが集中しています。少し時間をおいてからお試しください。",
      429,
    );
  }
  if (!res.ok) {
    throw new ApiError(
      "天気情報を取得できませんでした。時間をおいてもう一度お試しください。",
      502,
    );
  }
  return (await res.json()) as T;
}

/** UNIX 時刻 + タイムゾーン差（秒）から、現地の "YYYY-MM-DD" と "HH:MM" を作る */
function localParts(dt: number, tzOffset: number) {
  const iso = new Date((dt + tzOffset) * 1000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16), hour: Number(iso.slice(11, 13)) };
}

const round = (n: number) => Math.round(n);

function buildResponse(
  current: OwmCurrent,
  forecast: OwmForecast,
  locationName: string,
  country: string,
): WeatherResponse {
  const tz = forecast.city.timezone ?? current.timezone;
  const today = localParts(current.dt, tz).date;
  const currentWeather = current.weather[0] ?? { icon: "", description: "" };

  // 3 時間ごとの予報を現地の日付ごとにまとめる
  const byDate = new Map<string, { item: OwmForecastItem; hour: number; time: string }[]>();
  for (const item of forecast.list) {
    const { date, time, hour } = localParts(item.dt, tz);
    const arr = byDate.get(date) ?? [];
    arr.push({ item, hour, time });
    byDate.set(date, arr);
  }

  const days: DayForecast[] = [];
  for (let i = 0; i < FORECAST_DAYS; i++) {
    const date = addDays(today, i);
    const entries = byDate.get(date) ?? [];

    const hours: HourForecast[] = entries.map(({ item, time }) => ({
      dt: item.dt,
      time,
      temp: round(item.main.temp),
      icon: item.weather[0]?.icon ?? "",
      description: item.weather[0]?.description ?? "",
      pop: round((item.pop ?? 0) * 100),
    }));

    if (i === 0) {
      // 今日：現在の天気を代表にし、最高・最低には現在の気温も含める
      const temps = [current.main.temp, ...entries.map((e) => e.item.main.temp)];
      days.push({
        date,
        tempMax: round(Math.max(...temps)),
        tempMin: round(Math.min(...temps)),
        pop: hours.length > 0 ? Math.max(...hours.map((h) => h.pop)) : null,
        humidity: round(current.main.humidity),
        windSpeed: Math.round(current.wind.speed * 10) / 10,
        icon: currentWeather.icon,
        description: currentWeather.description,
        hours,
      });
      continue;
    }

    if (entries.length === 0) continue;

    // 代表の天気は、お昼 12 時にいちばん近い時間帯のもの
    const noon = entries.reduce((best, e) =>
      Math.abs(e.hour - 12) < Math.abs(best.hour - 12) ? e : best,
    );
    const items = entries.map((e) => e.item);
    days.push({
      date,
      tempMax: round(Math.max(...items.map((it) => it.main.temp_max))),
      tempMin: round(Math.min(...items.map((it) => it.main.temp_min))),
      pop: Math.max(...hours.map((h) => h.pop)),
      humidity: round(items.reduce((s, it) => s + it.main.humidity, 0) / items.length),
      windSpeed: Math.round(Math.max(...items.map((it) => it.wind.speed)) * 10) / 10,
      icon: noon.item.weather[0]?.icon ?? "",
      description: noon.item.weather[0]?.description ?? "",
      hours,
    });
  }

  return {
    location: { name: locationName, country },
    current: {
      temp: round(current.main.temp),
      icon: currentWeather.icon,
      description: currentWeather.description,
    },
    today,
    days,
  };
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return errorResponse(
      "サーバーに API キーが設定されていません。.env.local に OPENWEATHER_API_KEY を設定して、サーバーを再起動してください。",
      500,
    );
  }

  const params = request.nextUrl.searchParams;
  const city = params.get("city")?.trim() ?? "";
  const latParam = params.get("lat");
  const lonParam = params.get("lon");

  try {
    let lat: number;
    let lon: number;
    let name: string | undefined;
    let country = "";

    if (latParam !== null && lonParam !== null) {
      lat = Number(latParam);
      lon = Number(lonParam);
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180
      ) {
        return errorResponse("位置情報の値が正しくありません。", 400);
      }
      // 地名を日本語で表示するため、逆ジオコーディングで名前を調べる（失敗しても続行）
      try {
        const geo = await owmFetch<OwmGeo[]>(
          "/geo/1.0/reverse",
          { lat: String(lat), lon: String(lon), limit: "1" },
          apiKey,
        );
        if (geo[0]) {
          name = geo[0].local_names?.ja ?? geo[0].name;
          country = geo[0].country;
        }
      } catch {
        // 名前が取れなくても天気は出せるので無視
      }
    } else if (city) {
      if (city.length > 100) {
        return errorResponse("都市名が長すぎます。", 400);
      }
      // 都市名 → 緯度経度（日本語の都市名にも対応）
      const geo = await owmFetch<OwmGeo[]>(
        "/geo/1.0/direct",
        { q: city, limit: "1" },
        apiKey,
      );
      if (!geo[0]) {
        return errorResponse(
          `「${city}」という都市が見つかりませんでした。漢字・ひらがな・ローマ字（例：Osaka）など、書き方を変えてお試しください。`,
          404,
        );
      }
      lat = geo[0].lat;
      lon = geo[0].lon;
      name = geo[0].local_names?.ja ?? geo[0].name;
      country = geo[0].country;
    } else {
      return errorResponse("都市名を入力してください。", 400);
    }

    const common = { lat: String(lat), lon: String(lon), units: "metric", lang: "ja" };
    const [current, forecast] = await Promise.all([
      owmFetch<OwmCurrent>("/data/2.5/weather", common, apiKey),
      owmFetch<OwmForecast>("/data/2.5/forecast", common, apiKey),
    ]);

    return Response.json(
      buildResponse(
        current,
        forecast,
        name ?? current.name ?? "現在地",
        country || current.sys.country || "",
      ) satisfies WeatherResponse,
    );
  } catch (e) {
    if (e instanceof ApiError) return errorResponse(e.message, e.status);
    console.error(e);
    return errorResponse(
      "思わぬエラーが起きました。時間をおいてもう一度お試しください。",
      500,
    );
  }
}
