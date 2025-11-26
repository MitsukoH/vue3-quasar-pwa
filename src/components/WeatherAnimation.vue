<template>
  <div class="column items-center q-pa-md">
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

// 天氣資料
interface WeatherData {
  temperature: number;
  windSpeed: number;
  humidity: number;
  time: string;
}

const weatherData = ref<WeatherData | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const locationName = ref('偵測位置中...');

// 使用 IP 定位 API 取得使用者位置
const getUserLocation = async () => {
  try {
    // 使用 ip-api.com (無 CORS 限制，免費額度較高)
    const response = await axios.get('http://ip-api.com/json/');
    return {
      latitude: response.data.lat,
      longitude: response.data.lon,
      city: response.data.city,
      country: response.data.country,
    };
  } catch (err) {
    console.error('Error fetching location:', err);
    // 如果失敗，回傳台北作為預設位置
    return {
      latitude: 25.033,
      longitude: 121.5654,
      city: '台北市',
      country: '台灣',
    };
  }
};

const fetchWeather = async () => {
  loading.value = true;
  error.value = null;

  try {
    // 先取得使用者位置
    const location = await getUserLocation();
    locationName.value = `${location.city}, ${location.country}`;

    // 使用取得的經緯度查詢天氣
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m&timezone=auto`,
    );

    const current = response.data.current;
    weatherData.value = {
      temperature: Math.round(current.temperature_2m * 10) / 10,
      windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
      humidity: current.relative_humidity_2m,
      time: new Date(current.time).toLocaleString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  } catch (err) {
    console.error('Error fetching weather data:', err);
    error.value = '無法取得天氣資料';
  } finally {
    loading.value = false;
  }
};

// 根據溫度返回對應的天氣圖示
const getWeatherIcon = (temp: number): string => {
  if (temp >= 30) return '☀️'; // 炎熱
  if (temp >= 20) return '🌤️'; // 溫暖
  if (temp >= 10) return '⛅'; // 涼爽
  return '❄️'; // 寒冷
};

onMounted(() => {
  void fetchWeather();
});
</script>
