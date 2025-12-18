export async function findData(whatFind, whereFind, byWhat, value, limit) {
  try {
    const response = await fetch("http://localhost:3000/api/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        whatFind,
        whereFind,
        byWhat,
        value,
        limit,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.log(`Ошибка: ${error.message}`);
    return []; // Возвращаем пустой массив при ошибке
  }
}

// Экспортируем по умолчанию
export default findData;
