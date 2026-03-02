<template>
  <div class="row items-center q-pa-md">
    <!-- 天氣圖示 -->
    <div v-if="!loading && weatherData" class="text-h1 q-mb-md">
      {{ getWeatherIcon(weatherData.temperature) }}
    </div>

    <div v-if="loading" class="text-subtitle1 q-mt-sm">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-sm">載入中...</div>
    </div>

    <div v-else-if="error" class="text-negative q-mt-sm">{{ error }}</div>

    <div v-else-if="weatherData" class="q-mt-sm text-center">
      <div class="text-h6">{{ locationName }}</div>
      <div class="text-h4 q-mt-sm">{{ weatherData.temperature }}°C</div>
      <div class="text-subtitle1 q-mt-xs">風速: {{ weatherData.windSpeed }} km/h</div>
      <div class="text-subtitle2">相對濕度: {{ weatherData.humidity }}%</div>
      <div class="text-caption q-mt-xs text-grey">更新時間: {{ weatherData.time }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import axios from 'axios';

/**
 * 這是畫面上要用的整理後天氣資料
 */
interface WeatherData {
  temperature: number; // 氣溫 (°C)
  windSpeed: number; // 顯示用風速 (km/h)
  humidity: number; // 相對濕度 (%)
  time: string; // 觀測時間 (已格式化成好讀字串)
}

/**
 * ====== 1️⃣ 畫面用到的狀態 ======
 */
const weatherData = ref<WeatherData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const locationName = ref('讀取中...');

/**
 * ====== 2️⃣ 中央氣象署 API 設定 ======
 */
const CWA_API_KEY = import.meta.env.VITE_CWA_API_KEY;

/**
 * 氣象署 O-A0001-001 回傳資料的型別（簡化版，只抓我們會用到的欄位）
 * 🚩 注意：這裡加上 Coordinates，才能用經緯度算距離
 */
interface CwaStation {
  StationName: string;
  ObsTime: {
    DateTime: string;
  };
  GeoInfo: {
    CountyName: string; // 縣市，例如：臺中市
    TownName: string; // 鄉鎮，例如：西區
    Coordinates?: {
      Coordinate?: {
        StationLatitude: string;
        StationLongitude: string;
      }[];
    };
  };
  WeatherElement: {
    AirTemperature: string; // 氣溫（字串形式，要自己轉 number）
    WindSpeed: string; // 平均風速（m/s）
    RelativeHumidity: string; // 相對濕度
  };
}

interface CwaApiResponse {
  records: {
    Station: CwaStation[];
  };
}

/**
 * ====== 3️⃣ 位置取得：GPS 優先，失敗才用 IP ======
 */

interface GpsLocation {
  lat: number;
  lon: number;
}

// ✅ 3-1. 瀏覽器 GPS
const getBrowserLocation = (): Promise<GpsLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('瀏覽器不支援定位'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        console.log('📍 使用 GPS 定位：', loc);
        resolve(loc);
      },
      (err) => {
        console.warn('⚠️ GPS 失敗：', err);
        reject(new Error(err.message || 'GPS 定位失敗'));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  });
};

// ✅ 3-2. IP 定位（使用 https://ipwho.is/，支援 HTTPS + CORS）
interface IpLocation {
  lat: number;
  lon: number;
  city: string;
  region: string;
  country: string;
}

const getIpLocation = async (): Promise<IpLocation> => {
  const res = await axios.get('https://ipwho.is/');
  const data = res.data;

  const loc: IpLocation = {
    lat: data.latitude,
    lon: data.longitude,
    city: data.city ?? '',
    region: data.region ?? '',
    country: data.country ?? '',
  };

  console.log('🌏 使用 IP 定位（ipwho.is）：', loc);

  return loc;
};

// ✅ 3-3. 智慧定位：GPS → 失敗才用 IP
const getUserLocationSmart = async (): Promise<GpsLocation> => {
  try {
    return await getBrowserLocation();
  } catch {
    const ipLoc = await getIpLocation();
    return { lat: ipLoc.lat, lon: ipLoc.lon };
  }
};

/**
 * ====== 4️⃣ 計算兩點距離（公里）=====
 * 使用 Haversine formula
 */
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // 地球半徑 (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * ====== 5️⃣ 從中央氣象署抓即時天氣 ======
 * ✨ 新版：先取得使用者位置 → 從全部測站中找「最近測站」
 */
const fetchWeather = async () => {
  loading.value = true;
  error.value = null;

  try {
    // ✅ 先取得使用者位置（GPS → IP）
    const userLoc = await getUserLocationSmart();
    console.log('🧭 使用者座標：', userLoc);

    // ✅ 呼叫 O-A0001-001 自動氣象站-氣象觀測資料
    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${CWA_API_KEY}`;
    const response = await axios.get<CwaApiResponse>(url);

    const stations = response.data.records.Station;

    if (!stations || stations.length === 0) {
      throw new Error('找不到任何測站資料');
    }

    // ✅ 用座標找「最近測站」
    let nearest: CwaStation | null = null;
    let minDistance = Infinity;

    stations.forEach((station) => {
      const coordList = station.GeoInfo.Coordinates?.Coordinate;
      if (!coordList || coordList.length === 0) return;

      const coord = coordList[0];
      if (!coord) return;

      const lat = Number(coord.StationLatitude);
      const lon = Number(coord.StationLongitude);

      if (Number.isNaN(lat) || Number.isNaN(lon)) return;

      const dist = getDistanceKm(userLoc.lat, userLoc.lon, lat, lon);

      if (dist < minDistance) {
        minDistance = dist;
        nearest = station;
      }
    });

    // 如果真的一個都有問題，就退而求其次找臺中市的測站
    if (!nearest) {
      console.warn('⚠️ 找不到有座標的測站，改用臺中市測站作為預設');
      const fallbackStation = stations[0];
      if (!fallbackStation) {
        throw new Error('無法取得可用的測站資料');
      }
      nearest = stations.find((s) => s.GeoInfo.CountyName === '臺中市') ?? fallbackStation;
    }

    // 這裡一定要再檢查一下
    if (!nearest) {
      throw new Error('無法取得可用的測站資料');
    }

    // 更新顯示用地點文字
    locationName.value = `${nearest.GeoInfo.CountyName} ${nearest.GeoInfo.TownName}（${nearest.StationName}）`;

    // 把字串轉成數字
    const temp = parseFloat(nearest.WeatherElement.AirTemperature);
    const windMs = parseFloat(nearest.WeatherElement.WindSpeed); // m/s
    const humd = parseFloat(nearest.WeatherElement.RelativeHumidity);

    // 轉成 km/h（比較符合日常閱讀）
    const windKm = windMs * 3.6;

    weatherData.value = {
      temperature: Math.round(temp * 10) / 10,
      windSpeed: Math.round(windKm * 10) / 10,
      humidity: Math.round(humd),
      time: new Date(nearest.ObsTime.DateTime).toLocaleString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  } catch (err) {
    console.error('Error fetching CWA weather data:', err);
    error.value = '無法取得中央氣象署天氣資料';
  } finally {
    loading.value = false;
  }
};

/**
 * ====== 6️⃣ 溫度 → Emoji 圖示 ======
 */
const getWeatherIcon = (temp: number): string => {
  if (temp >= 30) return '☀️'; // 炎熱
  if (temp >= 20) return '🌤️'; // 溫暖
  if (temp >= 10) return '⛅'; // 涼爽
  return '❄️'; // 寒冷
};

/**
 * ====== 7️⃣ 元件掛載時就去抓資料 ======
 */
onMounted(() => {
  void fetchWeather();
});
</script>
