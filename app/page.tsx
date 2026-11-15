import WeatherApp from "@/components/WeatherApp";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <h1 className="mb-5 flex items-center gap-2 text-2xl font-bold text-gray-900">
        <span aria-hidden="true">🌦️</span>
        天気予報
      </h1>
      <WeatherApp />
      <footer className="mt-10 text-base text-gray-600">
        天気データ：
        <a
          href="https://openweathermap.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center underline"
        >
          OpenWeatherMap
        </a>
      </footer>
    </main>
  );
}
