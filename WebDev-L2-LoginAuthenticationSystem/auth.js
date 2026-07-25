const USERS_KEY = 'northstar-users';
const SESSION_KEY = 'northstar-session';

function loadUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function createSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const encodedPassword = new TextEncoder().encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedPassword);

  return Array.from(new Uint8Array(hashBuffer), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

function createUserId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setButtonBusy(button, busy, busyText) {
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.innerHTML;
  }

  button.disabled = busy;
  button.innerHTML = busy ? busyText : button.dataset.originalText;
}

function setupPasswordToggles() {
  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.querySelector(`#${button.dataset.passwordToggle}`);
      const showingPassword = input.type === 'text';

      input.type = showingPassword ? 'password' : 'text';
      button.textContent = showingPassword ? 'Show' : 'Hide';
      button.setAttribute('aria-label', showingPassword ? 'Show password' : 'Hide password');
    });
  });
}

function initializeRegistration() {
  const form = document.querySelector('#registerForm');
  const message = document.querySelector('#registerMessage');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    const username = form.username.value.trim();
    const email = normalize(form.email.value);
    const password = form.password.value;
    const confirmedPassword = form.confirmPassword.value;

    if (!username || !email || !password || !confirmedPassword) {
      message.textContent = 'Please complete every field.';
      return;
    }

    if (username.length < 3) {
      message.textContent = 'Username must contain at least 3 characters.';
      return;
    }

    if (!form.email.checkValidity()) {
      message.textContent = 'Please enter a valid email address.';
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      message.textContent = 'Password must be at least 8 characters and include a number.';
      return;
    }

    if (password !== confirmedPassword) {
      message.textContent = 'The two passwords do not match.';
      return;
    }

    const users = loadUsers();
    const usernameTaken = users.some((user) => normalize(user.username) === normalize(username));
    const emailTaken = users.some((user) => normalize(user.email) === email);

    if (usernameTaken || emailTaken) {
      message.textContent = 'An account with that username or email already exists.';
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    setButtonBusy(submitButton, true, 'Securing account…');

    try {
      const salt = createSalt();
      const passwordHash = await hashPassword(password, salt);

      users.push({
        id: createUserId(),
        username,
        email,
        salt,
        passwordHash,
        createdAt: new Date().toISOString()
      });

      saveUsers(users);
      window.location.replace('login.html?registered=1');
    } catch {
      message.textContent = 'Account creation is unavailable in this browser context.';
      setButtonBusy(submitButton, false);
    }
  });
}

function initializeLogin() {
  const form = document.querySelector('#loginForm');
  const message = document.querySelector('#loginMessage');
  const successMessage = document.querySelector('#registrationSuccess');
  const query = new URLSearchParams(window.location.search);

  successMessage.hidden = query.get('registered') !== '1';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    const identity = normalize(form.identity.value);
    const password = form.password.value;

    if (!identity || !password) {
      message.textContent = 'Please enter your username or email and password.';
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    setButtonBusy(submitButton, true, 'Checking account…');

    try {
      const user = loadUsers().find(
        (savedUser) =>
          normalize(savedUser.username) === identity ||
          normalize(savedUser.email) === identity
      );

      const passwordHash = user
        ? await hashPassword(password, user.salt)
        : null;

      if (!user || passwordHash !== user.passwordHash) {
        message.textContent = 'The username/email or password is incorrect.';
        setButtonBusy(submitButton, false);
        return;
      }

      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          userId: user.id,
          authenticatedAt: new Date().toISOString()
        })
      );

      window.location.replace('dashboard.html');
    } catch {
      message.textContent = 'Sign-in is unavailable in this browser context.';
      setButtonBusy(submitButton, false);
    }
  });
}

function getAuthenticatedUser() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!session || !session.userId) return null;

    return loadUsers().find((user) => user.id === session.userId) || null;
  } catch {
    return null;
  }
}

function initializeDashboard() {
  const user = getAuthenticatedUser();

  if (!user) {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace('login.html');
    return;
  }

  document.querySelector('#dashboardUsername').textContent = user.username;
  document.querySelector('#accountUsername').textContent = user.username;
  document.querySelector('#accountEmail').textContent = user.email;
  document.querySelector('#accountCreated').textContent = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'long'
  }).format(new Date(user.createdAt));

  document.querySelector('#logoutButton').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace('login.html');
  });
}

function initializeEntryPage() {
  window.location.replace(getAuthenticatedUser() ? 'dashboard.html' : 'login.html');
}

setupPasswordToggles();

const currentPage = document.documentElement.dataset.page;

if (currentPage === 'register') initializeRegistration();
if (currentPage === 'login') initializeLogin();
if (currentPage === 'dashboard') initializeDashboard();
if (currentPage === 'entry') initializeEntryPage();
