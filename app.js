const STORAGE_KEY = "rent-tracker-v1";
const weekdayFormatter = new Intl.DateTimeFormat("zh-TW", { weekday: "short" });

const state = {
  viewDate: new Date(),
  dailyRate: 0,
  months: {}
};

const els = {
  currentMonth: document.getElementById("current-month"),
  prevMonth: document.getElementById("prev-month"),
  nextMonth: document.getElementById("next-month"),
  dailyRate: document.getElementById("daily-rate"),
  paymentStatus: document.getElementById("payment-status"),
  monthNote: document.getElementById("month-note"),
  stayDays: document.getElementById("stay-days"),
  monthTotal: document.getElementById("month-total"),
  weeklyAverage: document.getElementById("weekly-average"),
  calendarGrid: document.getElementById("calendar-grid"),
  selectWeekdays: document.getElementById("select-weekdays"),
  clearMonth: document.getElementById("clear-month")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.dailyRate = Number(parsed.dailyRate) || 0;
    state.months = parsed.months && typeof parsed.months === "object" ? parsed.months : {};
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      dailyRate: state.dailyRate,
      months: state.months
    })
  );
}

function getMonthKey(date = state.viewDate) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthData() {
  const key = getMonthKey();

  if (!state.months[key]) {
    state.months[key] = {
      selectedDays: [],
      paymentStatus: "unpaid",
      note: ""
    };
  }

  return state.months[key];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatMonthLabel() {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long"
  }).format(state.viewDate);
}

function isToday(day) {
  const now = new Date();

  return (
    now.getFullYear() === state.viewDate.getFullYear() &&
    now.getMonth() === state.viewDate.getMonth() &&
    now.getDate() === day
  );
}

function updateSummary() {
  const monthData = getMonthData();
  const days = monthData.selectedDays.length;
  const total = days * state.dailyRate;
  const daysInMonth = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 0).getDate();
  const weeklyAverage = daysInMonth > 0 ? (days / daysInMonth) * 7 : 0;

  els.stayDays.textContent = `${days} 天`;
  els.monthTotal.textContent = formatCurrency(total);
  els.weeklyAverage.textContent = `${weeklyAverage.toFixed(1)} 天`;
}

function renderCalendar() {
  const monthData = getMonthData();
  const selected = new Set(monthData.selectedDays);
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  els.currentMonth.textContent = formatMonthLabel();
  els.dailyRate.value = state.dailyRate || "";
  els.paymentStatus.value = monthData.paymentStatus;
  els.monthNote.value = monthData.note;
  els.calendarGrid.innerHTML = "";

  for (let i = 0; i < firstWeekday; i += 1) {
    const spacer = document.createElement("div");
    spacer.className = "day-spacer";
    els.calendarGrid.append(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const button = document.createElement("button");
    const selectedText = selected.has(day) ? "已選取" : "未選取";

    button.type = "button";
    button.className = "day-button";
    button.textContent = String(day);
    button.setAttribute(
      "aria-label",
      `${month + 1} 月 ${day} 日，${weekdayFormatter.format(date)}，${selectedText}`
    );
    button.setAttribute("aria-pressed", selected.has(day) ? "true" : "false");

    if (selected.has(day)) {
      button.classList.add("is-selected");
    }

    if (isToday(day)) {
      button.classList.add("is-today");
    }

    button.addEventListener("click", () => toggleDay(day));
    els.calendarGrid.append(button);
  }

  updateSummary();
}

function toggleDay(day) {
  const monthData = getMonthData();
  const existingIndex = monthData.selectedDays.indexOf(day);

  if (existingIndex >= 0) {
    monthData.selectedDays.splice(existingIndex, 1);
  } else {
    monthData.selectedDays.push(day);
    monthData.selectedDays.sort((a, b) => a - b);
  }

  saveState();
  renderCalendar();
}

function changeMonth(offset) {
  state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + offset, 1);
  renderCalendar();
}

function selectWeekdays() {
  const monthData = getMonthData();
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const weekday = new Date(year, month, day).getDay();

    if (weekday !== 0 && weekday !== 6) {
      weekdays.push(day);
    }
  }

  monthData.selectedDays = weekdays;
  saveState();
  renderCalendar();
}

function clearMonth() {
  const monthData = getMonthData();

  monthData.selectedDays = [];
  saveState();
  renderCalendar();
}

function bindEvents() {
  els.prevMonth.addEventListener("click", () => changeMonth(-1));
  els.nextMonth.addEventListener("click", () => changeMonth(1));
  els.selectWeekdays.addEventListener("click", selectWeekdays);
  els.clearMonth.addEventListener("click", clearMonth);

  els.dailyRate.addEventListener("input", (event) => {
    state.dailyRate = Math.max(0, Number(event.target.value) || 0);
    saveState();
    updateSummary();
  });

  els.paymentStatus.addEventListener("change", (event) => {
    getMonthData().paymentStatus = event.target.value;
    saveState();
  });

  els.monthNote.addEventListener("input", (event) => {
    getMonthData().note = event.target.value;
    saveState();
  });
}

loadState();
bindEvents();
renderCalendar();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
