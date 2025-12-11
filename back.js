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

// Обработка POST запросов
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

// Также добавим GET для теста
app.get("/api/find", (req, res) => {
  const { whatFind, whereFind, byWhat, value } = req.query;

  let sql = `SELECT ${whatFind} FROM ${whereFind}`;
  const params = [];

  if (byWhat && value) {
    sql += ` WHERE ${byWhat} = ?`;
    params.push(value);
  }

  connection.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Простой тестовый endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Сервер работает!" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`Тестовый URL: http://localhost:${PORT}/api/test`);
});
