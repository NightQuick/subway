export async function addData(whereAdd, whatAdd = [], values = []) {
  try {
    const response = await fetch("http://localhost:3000/api/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        whereAdd,
        whatAdd,
        values,
      }),
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`Ошибка: ${error.message}</div>`);
  }
}
