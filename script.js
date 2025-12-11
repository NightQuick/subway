async function findData() {
  let [whatFind, whereFind, byWhat, value] = [
    "*",
    "users",
    "login",
    "ivanchai@gmail.com",
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
async function addData() {
  let whereAdd = "users",
    whatAdd = ["login", "password_hash", "birth_date", "position"],
    values = [`"ivanchai@gmail.com"`, `"password"`, `"2005.10.27"`, `"user"`];

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

async function delData() {
  let whereDel = "users",
    byWhat = "id",
    value = "5";

  try {
    const response = await fetch("http://localhost:3000/api/del", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        whereDel,
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

async function updData() {
  let whereUpd = "users",
    whatUpd = ["login"],
    values = ["iva228777@gmail.com"],
    byWhat = "id",
    byValue = "7";

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

updData();
findData();

let arr = [];
["a", "b", "c", "d"].forEach((sign) => {
  arr.push(sign);
});
