<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Hello Worga!! </q-toolbar-title>

        <q-btn
          flat
          dense
          round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          @click="$q.dark.toggle()"
        >
          <q-tooltip>切換深色/淺色模式</q-tooltip>
        </q-btn>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <!-- <q-item-label header>  </q-item-label> -->

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <WeatherAnimation />
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';
import WeatherAnimation from 'components/WeatherAnimation.vue';

const linksList: EssentialLinkProps[] = [
  {
    title: 'E-mail',
    caption: '聯繫我',
    icon: 'mail',
    link: 'mailto:gagshuang1130@gmail.com',
  },
  {
    title: 'Github (MitsukoH)',
    caption: 'github.com/MitsukoH',
    icon: 'fa-brands fa-github',
    link: 'https://github.com/MitsukoH',
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
