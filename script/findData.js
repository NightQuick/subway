export async function findData(whatFind, whereFind, byWhat, value) {
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
      }),
    });

    const data = await response.json();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.log(`Ошибка: ${error.message}</div>`);
  }
}
