async function main(login, password) {
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

export async function checkUser(login, password) {
  try {
    const result = await main(login, password);
    console.log("Результат:", result);

    // Если нужно строковое представление для отладки
    console.log("Результат (JSON):", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Ошибка в main:", error);
  }
}
