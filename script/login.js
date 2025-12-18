async function login(login, password) {
  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ login, password }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("Вход успешен! Данные пользователя:", data.user);
      // data.user содержит { id, login }
      return data.user;
    } else {
      console.error("Ошибка входа:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Ошибка сети:", error);
    return null;
  }
}
