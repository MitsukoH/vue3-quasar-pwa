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

    <!-- ✅ 新增待辦事項按鈕 -->
    <div class="row justify-center q-mb-md">
      <q-btn
        color="primary"
        icon="add"
        label="新增待辦事項"
        @click="showAddTaskDialog = true"
      />
    </div>

    <!-- 📝 新增待辦事項對話框 -->
    <q-dialog v-model="showAddTaskDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">新增待辦事項</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="newTask"
            label="輸入要做的事"
            outlined
            autofocus
            @keyup.enter="addTask"
          />

          <div class="q-mt-md">
            <q-date v-model="newTaskDate" mask="YYYY-MM-DD" today-btn />
          </div>

          <div class="row q-gutter-sm q-mt-md">
            <q-select
              v-model="newTaskPriority"
              :options="priorityOptions"
              label="優先級"
              outlined
              class="col"
            />
            <q-btn
              flat
              round
              dense
              :icon="showReminderTime ? 'notifications_active' : 'notifications_off'"
              :color="showReminderTime ? 'primary' : 'grey'"
              @click="showReminderTime = !showReminderTime"
            >
              <q-tooltip>提醒我</q-tooltip>
            </q-btn>
          </div>

          <div v-if="showReminderTime" class="q-mt-md">
            <q-time
              v-model="newTaskReminderTime"
              format24h
              mask="HH:mm"
              now-btn
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn flat label="新增" color="primary" :disable="!newTask" @click="addTask" />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
              <q-icon v-if="task.reminderTime" name="notifications_active" color="primary" size="sm">
                <q-tooltip>提醒時間: {{ task.reminderTime }}</q-tooltip>
              </q-icon>
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
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from 'stores/user-store';
import { Notify, Platform } from 'quasar';

/** 一條待辦的型別 */
interface Task {
  id: number;
  title: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  date: string; // 格式: YYYY-MM-DD
  reminderTime?: string; // 格式: YYYY-MM-DD HH:MM，提醒时间
  reminderId?: number; // 存储通知ID，用于取消通知
}

// 👤 使用者名稱管理
const userStore = useUserStore();
const tempName = ref('');
const showNameDialog = ref(false);
const showAddTaskDialog = ref(false); // 控制新增待辦事項對話框

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
const showReminderTime = ref(false); // 是否顯示提醒時間選擇器
const newTaskReminderTime = ref(''); // 新任務提醒時間，格式: HH:mm

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
  let reminderTime: string | undefined = undefined;
  let reminderId: number | undefined = undefined;

  // 如果設置了提醒時間，則設置通知
  if (showReminderTime.value && newTaskReminderTime.value) {
    reminderTime = `${newTaskDate.value} ${newTaskReminderTime.value}`;

    // 計算提醒時間（提前一小時）
    const reminderDateTime = new Date(reminderTime);
    reminderDateTime.setHours(reminderDateTime.getHours() - 1);

    // 設置通知
    if (Platform.is.capacitor || Platform.is.cordova || ('Notification' in window)) {
      if ('Notification' in window && Notification.permission === 'granted') {
        reminderId = Date.now();
        const notificationTime = reminderDateTime.getTime() - Date.now();

        if (notificationTime > 0) {
          setTimeout(() => {
            if ('Notification' in window) {
              new Notification('待辦事項提醒', {
                body: `您有一個待辦事項「${title}」即將到期`,
                icon: 'icons/icon-128x128.png',
                tag: `task-${newId}`,
                requireInteraction: true
              });
            }
          }, notificationTime);
        }
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        // 如果尚未請求通知權限，則請求權限
        void Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            reminderId = Date.now();
            const notificationTime = reminderDateTime.getTime() - Date.now();

            if (notificationTime > 0) {
              setTimeout(() => {
                if ('Notification' in window) {
                  new Notification('待辦事項提醒', {
                    body: `您有一個待辦事項「${title}」即將到期`,
                    icon: 'icons/icon-128x128.png',
                    tag: `task-${newId}`,
                    requireInteraction: true
                  });
                }
              }, notificationTime);
            }
          }
        });
      }
    }
  }

  const newTaskData: Task = {
    id: newId,
    title,
    done: false,
    priority: newTaskPriority.value,
    date: newTaskDate.value
  };

  if (reminderTime !== undefined) {
    newTaskData.reminderTime = reminderTime;
  }

  if (reminderId !== undefined) {
    newTaskData.reminderId = reminderId;
  }

  tasks.value.push(newTaskData);

  newTask.value = '';
  newTaskPriority.value = 'medium'; // 重置為預設值
  newTaskDate.value = getTodayDate(); // 重置為今天
  newTaskReminderTime.value = ''; // 重置提醒時間
  showReminderTime.value = false; // 隱藏提醒時間選擇器
  showAddTaskDialog.value = false; // 關閉對話框
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

// 初始化通知权限
onMounted(() => {
  // 检查是否支持通知
  if (Platform.is.capacitor || Platform.is.cordova || ('Notification' in window)) {
    // 如果尚未请求通知权限，则请求权限
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          Notify.create({
            type: 'positive',
            message: '通知权限已开启，您将收到待办事项提醒',
            position: 'top',
            timeout: 2000
          });
        } else if (permission === 'denied') {
          Notify.create({
            type: 'negative',
            message: '您已拒绝通知权限，将无法收到待办事项提醒',
            position: 'top',
            timeout: 3000
          });
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      // 如果已经授权，显示提示信息
      Notify.create({
        type: 'positive',
        message: '通知权限已开启，您将收到待办事项提醒',
        position: 'top',
        timeout: 2000
      });
    }
  } else {
    // 浏览器不支持通知
    Notify.create({
      type: 'warning',
      message: '您的浏览器不支持通知功能',
      position: 'top',
      timeout: 3000
    });
  }
});
</script>
