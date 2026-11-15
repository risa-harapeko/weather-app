// 自作 API（/api/weather）と画面の間でやり取りするデータの型

export type HourForecast = {
  /** UNIX 時刻（秒） */
  dt: number;
  /** 現地時刻 "HH:MM" */
  time: string;
  temp: number;
  icon: string;
  description: string;
  /** 降水確率（0〜100 の %） */
  pop: number;
};

export type DayForecast = {
  /** 現地の日付 "YYYY-MM-DD" */
  date: string;
  tempMax: number;
  tempMin: number;
  /** 降水確率（%）。データがないときは null */
  pop: number | null;
  humidity: number;
  windSpeed: number;
  icon: string;
  description: string;
  hours: HourForecast[];
};

export type WeatherResponse = {
  location: {
    name: string;
    country: string;
  };
  /** 現在の気温など */
  current: {
    temp: number;
    icon: string;
    description: string;
  };
  /** 現地の今日 "YYYY-MM-DD" */
  today: string;
  /** 今日から 5 日分 */
  days: DayForecast[];
};

export type WeatherErrorResponse = {
  error: string;
};
