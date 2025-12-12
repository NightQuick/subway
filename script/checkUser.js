export async function checkUser(login, password) {
  try {
    const response = await fetch("http://localhost:3000/api/checkUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login,
        password,
      }),
    });
    fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ВАЖНО: отправляем куки
      body: JSON.stringify({
        login: login,
        password: password,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Ошибка: ${error.message}`);
    return { success: false, error: error.message };
  }
}
