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

    <q-card class="q-mb-md">
      <WeatherAnimate />
    </q-card>

    <!-- ✅ 待辦清單卡片 -->
    <q-card class="q-pa-md">
      <div class="text-subtitle2 q-mb-sm">今天的待辦清單</div>

      <!-- 輸入 + 優先級 + 新增按鈕 -->
      <div class="row q-gutter-sm">
        <q-input
          v-model="newTask"
          label="輸入要做的事"
          dense
          outlined
          class="col"
          @keyup.enter="addTask"
        />
        <q-select
          v-model="newTaskPriority"
          :options="priorityOptions"
          label="優先級"
          dense
          outlined
          style="min-width: 100px"
        />
        <q-btn round dense icon="add" color="primary" :disable="!newTask" @click="addTask" />
      </div>

      <!-- 列表 -->
      <q-list separator bordered class="q-mt-md rounded-borders">
        <q-item v-for="task in tasks" :key="task.id" clickable @click="openTask(task)">
          <!-- 左側 checkbox：控制完成狀態 -->
          <q-item-section avatar>
            <q-checkbox v-model="task.done" @click.stop />
          </q-item-section>

          <!-- 中間：標題＋狀態＋優先級 -->
          <q-item-section>
            <q-item-label :class="{ 'text-strike': task.done }">
              {{ task.title }}
            </q-item-label>
            <q-item-label caption class="row items-center q-gutter-xs">
              <span>{{ task.done ? '已完成' : '進行中' }}</span>
              <q-badge
                :color="getPriorityColor(task.priority)"
                :label="getPriorityLabel(task.priority)"
              />
            </q-item-label>
          </q-item-section>

          <!-- 右側：刪除按鈕 -->
          <q-item-section side>
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              @click.stop="removeTask(task.id)"
            />
          </q-item-section>
        </q-item>

        <!-- 沒任務時的提示 -->
        <div v-if="!tasks.length" class="text-grey text-caption q-pa-sm">
          今天還沒有安排任務，先寫一件小小的也可以喔 🌱
        </div>
      </q-list>
    </q-card>

    <!-- 📌 任務細節 Dialog -->
    <q-dialog v-model="showDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">任務細節</div>
        </q-card-section>

        <q-card-section v-if="activeTask">
          <div class="q-mb-sm">標題：{{ activeTask.title }}</div>
          <div class="q-mb-sm">狀態：{{ activeTask.done ? '已完成' : '進行中' }}</div>
          <div class="q-mb-sm">
            優先級：
            <q-badge
              :color="getPriorityColor(activeTask.priority)"
              :label="getPriorityLabel(activeTask.priority)"
            />
          </div>
          <q-select
            v-model="activeTask.priority"
            :options="priorityOptions"
            label="修改優先級"
            dense
            outlined
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="關閉" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
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

const priorityOptions: Array<{ label: string; value: Task['priority'] }> = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const tasks = ref<Task[]>([
  // 初始兩條 demo 待辦
  { id: 1, title: '好好吃早餐', done: false, priority: 'high' },
  { id: 2, title: '午餐吃什麼', done: false, priority: 'medium' },
]);

const showDialog = ref(false); // 控制 Dialog 開關
const activeTask = ref<Task | null>(null); // 被點到的那一條待辦

// 新增待辦
function addTask() {
  const title = newTask.value.trim();
  if (!title) return;

  tasks.value.push({
    id: Date.now(), // 用時間戳當簡單 id
    title,
    done: false,
    priority: newTaskPriority.value,
  });

  newTask.value = '';
  newTaskPriority.value = 'medium'; // 重置為預設值
  sortTasks();
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

// 刪除待辦
function removeTask(id: number) {
  tasks.value = tasks.value.filter((task) => task.id !== id);
}

// 打開細節 Dialog
function openTask(task: Task) {
  activeTask.value = task;
  showDialog.value = true;
}
</script>
