export async function updData(
  whereUpd,
  whatUpd = [],
  values = [],
  byWhat,
  byValue
) {
  try {
    const response = await fetch("http://localhost:3000/api/upd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        whereUpd,
        whatUpd,
        values,
        byWhat,
        byValue,
      }),
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`Ошибка: ${error.message}</div>`);
  }
}
