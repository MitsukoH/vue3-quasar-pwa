<template>
  <!-- 整頁容器，灰底看起來比較不那麼陽春 -->
  <q-page padding :class="$q.dark.isActive ? 'bg-gray-9' : 'bg-grey-2'">
    <!-- 🌅 問候區 -->
    <div class="row items-center q-mb-xs">
      <div class="text-h5">嗨，{{ userStore.userName }} 👋</div>
      <q-btn
        flat
        dense
        round
        icon="edit"
        size="sm"
        class="q-ml-sm"
        @click="showNameDialog = true"
      />
    </div>
    <div class="text-caption text-grey-7 q-mb-md">
      今天是 {{ todayText }}，一起把日子過得漂亮一點 ✨
    </div>

    <!-- 📝 編輯名稱對話框 -->
    <q-dialog v-model="showNameDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">設定你的名稱</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="tempName" label="輸入你的名稱" autofocus @keyup.enter="saveName" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn flat label="儲存" color="primary" @click="saveName" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ✅ 待辦清單輸入區 -->
    <q-card class="q-pa-md q-mb-md">
      <div class="text-subtitle2 q-mb-sm">新增待辦事項</div>

      <!-- 輸入 + 日期 + 優先級 + 新增按鈕 -->
      <div class="row q-gutter-sm q-mb-sm">
        <q-input
          v-model="newTask"
          label="輸入要做的事"
          dense
          outlined
          class="col"
          @keyup.enter="addTask"
        />
        <q-date v-model="newTaskDate" minimal mask="YYYY-MM-DD" today-btn />
      </div>
      <div class="row q-gutter-sm">
        <q-select
          v-model="newTaskPriority"
          :options="priorityOptions"
          label="優先級"
          dense
          outlined
          style="min-width: 100px"
        />
        <q-btn round icon="add" color="primary" :disable="!newTask" @click="addTask" />
      </div>
    </q-card>

    <!-- 🎯 重點待辦卡片輪播 -->
    <q-card class="q-pa-md q-mb-md">
      <div class="text-subtitle2 q-mb-sm">今日重點待辦</div>

      <!-- 輪播式卡片 - 一頁顯示三個任務 -->
      <div v-if="tasks.length" class="q-mt-md">
        <q-carousel
          v-model="slide"
          transition-prev="slide-right"
          transition-next="slide-left"
          swipeable
          animated
          control-color="primary"
          navigation
          padding
          arrows
          height="220px"
          class="rounded-borders"
        >
          <q-carousel-slide
            v-for="(page, pageIndex) in taskPages"
            :key="pageIndex"
            :name="pageIndex.toString()"
          >
            <div class="row q-gutter-md full-height">
              <div v-for="task in page" :key="task.id" class="col">
                <q-card
                  flat
                  bordered
                  class="full-height"
                  :class="getPriorityCardClass(task.priority)"
                >
                  <q-card-section class="column justify-between full-height">
                    <div>
                      <div class="row items-center no-wrap">
                        <div class="col">
                          <div class="text-body1" :class="{ 'text-strike': task.done }">
                            {{ task.title }}
                          </div>
                        </div>
                        <div class="col-auto">
                          <q-btn
                            flat
                            round
                            dense
                            size="sm"
                            :icon="task.done ? 'check_circle' : 'radio_button_unchecked'"
                            :color="task.done ? 'positive' : 'grey'"
                            @click="task.done = !task.done"
                          />
                        </div>
                      </div>
                      <div class="row items-center q-mt-sm q-gutter-sm">
                        <q-icon
                          size="sm"
                          :name="getPriorityIcon(task.priority)"
                          :color="getPriorityColor(task.priority)"
                        />
                        <q-badge
                          :color="getPriorityColor(task.priority)"
                          :label="getPriorityLabel(task.priority)"
                        />
                        <span class="text-caption">{{ task.done ? '已完成' : '進行中' }}</span>
                      </div>
                    </div>
                    <div class="row justify-end">
                      <q-btn
                        flat
                        round
                        dense
                        size="sm"
                        icon="delete"
                        color="negative"
                        @click="removeTask(task.id)"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-carousel-slide>
        </q-carousel>
      </div>

      <!-- 沒任務時的提示 -->
      <div v-else class="text-grey text-caption q-pa-sm text-center">
        今天還沒有安排任務，先寫一件小小的也可以喔 🌱
      </div>
    </q-card>

    <!-- 📝 所有待辦清單 -->
    <q-card class="q-pa-md">
      <div class="text-subtitle2 q-mb-sm">所有待辦事項</div>

      <!-- 列表 -->
      <q-list separator bordered class="rounded-borders">
        <q-item v-for="task in tasks" :key="task.id">
          <!-- 左側 checkbox：控制完成狀態 -->
          <q-item-section avatar>
            <q-checkbox v-model="task.done" />
          </q-item-section>

          <!-- 中間：標題＋狀態＋日期＋優先級 -->
          <q-item-section>
            <q-item-label :class="{ 'text-strike': task.done }">
              {{ task.title }}
            </q-item-label>
            <q-item-label caption class="row items-center q-gutter-xs">
              <span>{{ task.done ? '已完成' : '進行中' }}</span>
              <span class="text-grey-7">{{ task.date }}</span>
              <q-badge
                :color="getPriorityColor(task.priority)"
                :label="getPriorityLabel(task.priority)"
              />
            </q-item-label>
          </q-item-section>

          <!-- 右側：刪除按鈕 -->
          <q-item-section side>
            <q-btn flat round dense icon="delete" color="negative" @click="removeTask(task.id)" />
          </q-item-section>
        </q-item>

        <!-- 沒任務時的提示 -->
        <div v-if="!tasks.length" class="text-grey text-caption q-pa-sm">目前沒有任何待辦事項</div>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from 'stores/user-store';

/** 一條待辦的型別 */
interface Task {
  id: number;
  title: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  date: string; // 格式: YYYY-MM-DD
}

// 👤 使用者名稱管理
const userStore = useUserStore();
const tempName = ref('');
const showNameDialog = ref(false);

// 儲存名稱到 store
function saveName() {
  const name = tempName.value.trim();
  if (name) {
    userStore.setUserName(name);
  }
  showNameDialog.value = false;
  tempName.value = '';
}

// 🗓️ 今天日期 → 顯示在畫面上
const today = new Date();

const todayText = computed(() => {
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()];

  return `${y}/${m}/${d}（${weekday}）`;
});

// ✅ 待辦相關狀態
const newTask = ref(''); // 輸入框
const newTaskPriority = ref<Task['priority']>('medium'); // 新任務優先級
const newTaskDate = ref(getTodayDate()); // 新任務日期，默認為今天
const slide = ref('0'); // 輪播當前頁面，從0開始表示第一頁

// 獲取今天的日期，格式為 YYYY-MM-DD
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const priorityOptions: Array<{ label: string; value: Task['priority'] }> = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const tasks = ref<Task[]>([
  // 初始兩條 demo 待辦
  { id: 1, title: '好好吃早餐', done: false, priority: 'high', date: getTodayDate() },
  { id: 2, title: '午餐吃什麼', done: false, priority: 'medium', date: getTodayDate() },
]);

// 將今日任務分組，每頁最多3個任務
const taskPages = computed(() => {
  const pages = [];
  const today = getTodayDate();
  const todayTasks = tasks.value.filter((task) => task.date === today);
  const sortedTasks = [...todayTasks].sort((a, b) => {
    // 未完成的任務排在前面
    if (a.done !== b.done) return a.done ? 1 : -1;
    // 同樣完成狀態下，按優先級排序
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  for (let i = 0; i < sortedTasks.length; i += 3) {
    pages.push(sortedTasks.slice(i, i + 3));
  }
  return pages;
});

// 新增待辦
function addTask() {
  const title = newTask.value.trim();
  if (!title) return;

  const newId = Date.now(); // 用時間戳當簡單 id
  tasks.value.push({
    id: newId,
    title,
    done: false,
    priority: newTaskPriority.value,
    date: newTaskDate.value,
  });

  newTask.value = '';
  newTaskPriority.value = 'medium'; // 重置為預設值
  newTaskDate.value = getTodayDate(); // 重置為今天
  sortTasks();

  // 如果新增的是今天的任務，自動切換到包含新任務的頁面
  if (newTaskDate.value === getTodayDate()) {
    setTimeout(() => {
      const pageIndex = taskPages.value.findIndex((page) => page.some((task) => task.id === newId));
      if (pageIndex !== -1) {
        slide.value = pageIndex.toString();
      }
    }, 0);
  }
}

// 根據優先級排序任務
function sortTasks() {
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  tasks.value.sort((a, b) => {
    // 未完成的任務排在前面
    if (a.done !== b.done) return a.done ? 1 : -1;
    // 同樣完成狀態下，按優先級排序
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// 取得優先級顏色
function getPriorityColor(priority: Task['priority']): string {
  const colors = {
    high: 'red',
    medium: 'orange',
    low: 'blue',
  };
  return colors[priority];
}

// 取得優先級標籤
function getPriorityLabel(priority: Task['priority']): string {
  const labels = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return labels[priority];
}

// 取得優先級卡片樣式
function getPriorityCardClass(priority: Task['priority']): string {
  const classes = {
    high: 'bg-red-1',
    medium: 'bg-orange-1',
    low: 'bg-blue-1',
  };
  return classes[priority];
}

// 取得優先級圖標
function getPriorityIcon(priority: Task['priority']): string {
  const icons = {
    high: 'priority_high',
    medium: 'remove',
    low: 'arrow_downward',
  };
  return icons[priority];
}

// 刪除待辦
function removeTask(id: number) {
  const currentSlideIndex = parseInt(slide.value);
  const currentPage = taskPages.value[currentSlideIndex];
  const wasInCurrentPage = currentPage && currentPage.some((task) => task.id === id);

  tasks.value = tasks.value.filter((task) => task.id !== id);

  // 如果刪除的是當前頁的任務，且該頁現在沒有任務了，則切換到前一頁
  setTimeout(() => {
    if (wasInCurrentPage && taskPages.value.length > 0) {
      // 如果當前頁索引超出了新的頁數範圍，則切換到最後一頁
      if (currentSlideIndex >= taskPages.value.length) {
        slide.value = (taskPages.value.length - 1).toString();
      }
      // 否則保持在當前頁
    }
  }, 0);
}
</script>
