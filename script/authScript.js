class AuthService {
  constructor(baseUrl = "http://localhost:3000/api") {
    this.baseUrl = baseUrl;
  }

  // Вход в систему
  async login(login, password) {
    try {
      console.log("Отправка данных для входа:", { login });

      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          login: login.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();
      console.log("Ответ сервера:", data);

      return data; // Возвращаем данные как есть
    } catch (error) {
      console.error("Ошибка входа:", error);
      return {
        success: false,
        message: "Ошибка соединения с сервером: " + error.message,
      };
    }
  }

  // Получение текущего пользователя
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseUrl}/current-user`, {
        credentials: "include",
      });

      if (response.status === 401) {
        return null;
      }

      const data = await response.json();

      if (data.success) {
        return data.user;
      }

      return null;
    } catch (error) {
      console.error("Ошибка получения пользователя:", error);
      return null;
    }
  }
}

const authService = new AuthService();

// Функция для обработки входа
async function handleLogin(event) {
  event.preventDefault();

  const loginInput = document.getElementById("username");
  const passwordInput = document.getElementById("pass");
  const enterButton = document.getElementById("enter");

  const login = loginInput.value;
  const password = passwordInput.value;

  if (!login || !password) {
    alert("Пожалуйста, заполните все поля");
    return;
  }

  const originalText = enterButton.textContent;
  enterButton.textContent = "Вход...";
  enterButton.disabled = true;

  try {
    const result = await authService.login(login, password);
    console.log("Результат входа:", result);

    if (result.success) {
      alert(`Добро пожаловать, ${result.user.login}!`);
      console.log("ID пользователя:", result.user.id);
      console.log("Логин пользователя:", result.user.login);

      // Сохраняем в localStorage для быстрого доступа
      localStorage.setItem("user", JSON.stringify(result.user));

      window.location.href = "menu.html";
    } else {
      alert(`Ошибка входа: ${result.message}`);
      enterButton.textContent = originalText;
      enterButton.disabled = false;
    }
  } catch (error) {
    alert("Ошибка соединения с сервером: " + error.message);
    enterButton.textContent = originalText;
    enterButton.disabled = false;
  }
}

// Функция для проверки авторизации при загрузке страницы
async function checkAuthOnLoad() {
  try {
    console.log("Проверка авторизации...");
    const user = await authService.getCurrentUser();

    if (user) {
      console.log("Пользователь уже авторизован:", user);

      if (window.location.pathname.includes("authentication.html")) {
        // Если на странице входа и уже авторизован - перенаправляем
        window.location.href = "menu.html";
      } else {
        // Сохраняем пользователя
        localStorage.setItem("user", JSON.stringify(user));
      }
    } else {
      console.log("Пользователь не авторизован");
    }
  } catch (error) {
    console.log("Ошибка при проверке авторизации:", error);
  }
}

// Добавление обработчика событий
document.addEventListener("DOMContentLoaded", function () {
  console.log("Страница авторизации загружена");

  // Проверяем авторизацию при загрузке
  checkAuthOnLoad();

  const enterButton = document.getElementById("enter");

  if (enterButton) {
    enterButton.addEventListener("click", handleLogin);
    console.log("Обработчик входа добавлен");
  }

  const loginInput = document.getElementById("username");
  const passwordInput = document.getElementById("pass");

  [loginInput, passwordInput].forEach((input) => {
    if (input) {
      input.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
          handleLogin(event);
        }
      });
    }
  });
});

// Для использования на других страницах
window.authService = authService;

// Функция для получения пользователя из localStorage
window.getUserFromStorage = function () {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Ошибка чтения пользователя из localStorage:", error);
    return null;
  }
};

// Функция для проверки авторизации на других страницах
window.checkAuth = async function () {
  const user = await authService.getCurrentUser();

  if (!user) {
    const storedUser = window.getUserFromStorage();
    if (!storedUser) {
      console.log("Пользователь не авторизован, перенаправление...");
      window.location.href = "authentication.html";
      return null;
    }
    return storedUser;
  }

  // Обновляем localStorage
  localStorage.setItem("user", JSON.stringify(user));
  return user;
};
