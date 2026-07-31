const STORAGE_KEY = 'daymark-tasks';

const taskForm = document.querySelector('#taskForm');
const taskInput = document.querySelector('#taskInput');
const formMessage = document.querySelector('#formMessage');
const pendingList = document.querySelector('#pendingList');
const completedList = document.querySelector('#completedList');
const pendingCount = document.querySelector('#pendingCount');
const completedCount = document.querySelector('#completedCount');
const pendingEmpty = document.querySelector('#pendingEmpty');
const completedEmpty = document.querySelector('#completedEmpty');
const taskTemplate = document.querySelector('#taskTemplate');

let tasks = loadTasks();

function loadTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(storedTasks) ? storedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTaskId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTime(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString));
}

function setToday() {
  const today = new Date();
  document.querySelector('#dayName').textContent = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short'
  }).format(today);
  document.querySelector('#dayNumber').textContent = today.getDate();
  document.querySelector('#monthName').textContent = new Intl.DateTimeFormat('en-IN', {
    month: 'short'
  }).format(today);
}

function updateCounts(pendingTasks, completedTasks) {
  pendingCount.textContent = `${pendingTasks.length} pending`;
  completedCount.textContent = `${completedTasks.length} completed`;
  pendingEmpty.hidden = pendingTasks.length > 0;
  completedEmpty.hidden = completedTasks.length > 0;
}

function startEditing(taskItem, task) {
  const taskText = taskItem.querySelector('.task-text');
  const taskTime = taskItem.querySelector('.task-time');
  const editForm = taskItem.querySelector('.edit-form');
  const editInput = taskItem.querySelector('.edit-input');
  const editButton = taskItem.querySelector('.edit-button');

  taskText.hidden = true;
  taskTime.hidden = true;
  editButton.hidden = true;
  editForm.hidden = false;
  editInput.value = task.text;
  editInput.focus();
  editInput.select();
}

function stopEditing(taskItem) {
  taskItem.querySelector('.task-text').hidden = false;
  taskItem.querySelector('.task-time').hidden = false;
  taskItem.querySelector('.edit-button').hidden = false;
  taskItem.querySelector('.edit-form').hidden = true;
}

function createTaskElement(task) {
  const taskItem = taskTemplate.content.firstElementChild.cloneNode(true);
  const toggle = taskItem.querySelector('.task-toggle');
  const toggleLabel = taskItem.querySelector('.complete-control');
  const taskText = taskItem.querySelector('.task-text');
  const taskTime = taskItem.querySelector('.task-time');
  const editButton = taskItem.querySelector('.edit-button');
  const deleteButton = taskItem.querySelector('.delete-button');
  const editForm = taskItem.querySelector('.edit-form');
  const editInput = taskItem.querySelector('.edit-input');
  const cancelButton = taskItem.querySelector('.cancel-button');

  taskItem.dataset.taskId = task.id;
  taskText.textContent = task.text;
  toggle.checked = task.completed;
  toggleLabel.querySelector('.visually-hidden').textContent = task.completed
    ? `Move ${task.text} back to pending`
    : `Mark ${task.text} complete`;

  taskTime.textContent = task.completed
    ? `Completed ${formatTime(task.completedAt)}`
    : `Added ${formatTime(task.createdAt)}`;

  toggle.addEventListener('change', () => {
    task.completed = toggle.checked;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    saveTasks();
    renderTasks();
  });

  editButton.addEventListener('click', () => {
    startEditing(taskItem, task);
  });

  cancelButton.addEventListener('click', () => {
    stopEditing(taskItem);
  });

  editForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const editedText = editInput.value.trim();

    if (!editedText) {
      editInput.focus();
      return;
    }

    task.text = editedText;
    saveTasks();
    renderTasks();
  });

  deleteButton.addEventListener('click', () => {
    tasks = tasks.filter((savedTask) => savedTask.id !== task.id);
    saveTasks();
    renderTasks();
  });

  return taskItem;
}

function renderTasks() {
  pendingList.replaceChildren();
  completedList.replaceChildren();

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  pendingTasks.forEach((task) => {
    pendingList.append(createTaskElement(task));
  });

  completedTasks.forEach((task) => {
    completedList.append(createTaskElement(task));
  });

  updateCounts(pendingTasks, completedTasks);
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const taskText = taskInput.value.trim();

  if (!taskText) {
    formMessage.textContent = 'Please enter a task before adding it.';
    taskInput.focus();
    return;
  }

  tasks.unshift({
    id: createTaskId(),
    text: taskText,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  });

  saveTasks();
  renderTasks();
  taskForm.reset();
  formMessage.textContent = 'Task added to your pending list.';
  taskInput.focus();

  window.setTimeout(() => {
    formMessage.textContent = '';
  }, 1800);
});

setToday();
renderTasks();
