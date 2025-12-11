import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к БД
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "subway",
  port: 3306,
});

connection.connect((err) => {
  if (err) {
    console.error("Ошибка подключения:", err);
    return;
  }
  console.log("Подключено к MySQL");
});

// запрос добавления в бд
app.post("/api/add", (req, res) => {
  const { whereAdd, whatAdd = [], values = [] } = req.body;

  console.log("Получен запрос:", { whereAdd, whatAdd, values });

  // Проверка обязательных полей
  if (!whereAdd || !whatAdd || !values) {
    return res.status(400).json({
      error: "Не указаны обязательные поля: whereAdd, whatAdd, values",
    });
  }

  let sql = `INSERT into ${whereAdd}(${whatAdd})values(${values})`;
  const params = [];

  console.log("Выполняем SQL:", sql);

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error("Ошибка SQL:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log("Результаты:", results);
    res.json(results);
  });
});

// Запрос поиска в бд
app.post("/api/find", (req, res) => {
  const { whatFind, whereFind, byWhat, value } = req.body;

  console.log("Получен запрос:", { whatFind, whereFind, byWhat, value });

  // Проверка обязательных полей
  if (!whatFind || !whereFind) {
    return res
      .status(400)
      .json({ error: "Не указаны обязательные поля: whatFind, whereFind" });
  }

  let sql = `SELECT ${whatFind} FROM ${whereFind}`;
  const params = [];

  if (byWhat && value) {
    sql += ` WHERE ${byWhat} = ?`;
    params.push(value);
  }

  console.log("Выполняем SQL:", sql);
  console.log("Параметры:", params);

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error("Ошибка SQL:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log("Результаты:", results);
    res.json(results);
  });
});

//удаление данных в бд
app.post("/api/del", (req, res) => {
  const { whereDel, byWhat, value } = req.body;

  console.log("Получен запрос:", { whereDel, byWhat, value });

  // Проверка обязательных полей
  if (!whereDel || !byWhat || !value) {
    return res
      .status(400)
      .json({ error: "Не указаны обязательные поля: whereDel, byWhat, value" });
  }

  let sql = `DELETE FROM ${whereDel} WHERE ${byWhat}="${value}"`;
  const params = [];

  console.log("Выполняем SQL:", sql);

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error("Ошибка SQL:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log("Результаты:", results);
    res.json(results);
  });
});

app.post("/api/upd", (req, res) => {
  const { whereUpd, whatUpd = [], values = [], byWhat, byValue } = req.body;

  console.log("Получен запрос:", {
    whereUpd,
    whatUpd,
    values,
    byWhat,
    byValue,
  });

  // Проверка обязательных полей
  if (!whereUpd || !whatUpd || !values || !byWhat || !byValue) {
    return res
      .status(400)
      .json({ error: "Не указаны обязательные поля: whereDel, byWhat, value" });
  }
  let upd = [];
  for (let i = 0; i < whatUpd.length; i++) {
    upd.push(whatUpd[i] + '="' + values[i] + '"');
  }
  let sql = `UPDATE ${whereUpd} set ${upd} WHERE ${byWhat}="${byValue}"`;
  const params = [];

  console.log("Выполняем SQL:", sql);

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error("Ошибка SQL:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log("Результаты:", results);
    res.json(results);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`Тестовый URL: http://localhost:${PORT}/api/test`);
});
