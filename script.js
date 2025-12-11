// console.log(finder("*", "ingredients", "name", "Nutella"));

async function findData() {
  let [whatFind, whereFind, byWhat, value] = [
    "*",
    "ingredients",
    "name",
    "Nutella",
  ];

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
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`Ошибка: ${error.message}</div>`);
  }
}
findData();
