async function checkAuth() {
  try {
    const response = await fetch("http://localhost:3000/api/current-user", {
      credentials: "include",
    });

    if (response.status === 401) {
      const storedUser = localStorage.getItem("user");

      return storedUser ? JSON.parse(storedUser) : null;
    }

    const data = await response.json();

    if (data.success) {
      // Сохраняем в localStorage для быстрого доступа
      localStorage.setItem("user", JSON.stringify(data.user));
      return data.user;
    }

    return null;
  } catch (error) {
    console.error("Ошибка проверки авторизации:", error);

    // При ошибке сети проверяем localStorage
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  }
}

export { checkAuth };
