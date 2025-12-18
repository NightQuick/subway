import express from "express";
import mysql from "mysql2";
import session from "express-session";

const app = express();

// Middleware
app.use(express.json());

// CORS настройка
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Сессия
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

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

// Функция для поиска пользователя по логину
function findUserByLogin(login) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT id, login, password_hash FROM users WHERE login = ?";
    connection.query(sql, [login], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

// Вход в систему
app.post("/api/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: "Логин и пароль обязательны",
      });
    }

    // Ищем пользователя
    const users = await findUserByLogin(login);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    const user = users[0];

    // Проверяем пароль
    if (password !== user.password_hash) {
      return res.status(401).json({
        success: false,
        message: "Неверный пароль",
      });
    }

    // Устанавливаем сессию
    req.session.userId = user.id;
    req.session.userLogin = user.login;

    res.json({
      success: true,
      message: "Успешный вход",
      user: {
        id: user.id,
        login: user.login,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// Получение текущего пользователя
app.get("/api/current-user", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: "Не авторизован",
    });
  }

  res.json({
    success: true,
    user: {
      id: req.session.userId,
      login: req.session.userLogin,
    },
  });
});

// Выход из системы
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Ошибка при удалении сессии:", err);
      return res.status(500).json({
        success: false,
        error: "Ошибка выхода",
      });
    }

    res.json({
      success: true,
      message: "Успешный выход",
    });
  });
});

// Тестовый эндпоинт
app.get("/api/test", (req, res) => {
  res.json({
    message: "Сервер работает!",
  });
});

app.post("/api/checkUser", async (req, res) => {
  try {
    const { login, password } = req.body;
    const users = await findUserByLogin(login);

    if (users.length === 0) {
      return res.json({ success: false, message: "User not found" });
    }

    const user = users[0];

    if (password !== user.password_hash) {
      return res.json({ success: false, message: "Invalid password" });
    }

    return res.json({
      success: true,
      message: "User authenticated",
      user: {
        id: user.id,
        login: user.login,
      },
    });
  } catch (error) {
    console.error("Error in checkUser:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

//запросы в бд
{
  // запрос добавления в бд
  app.post("/api/add", (req, res) => {
    const { whereAdd, whatAdd = [], values = [] } = req.body;

    // Проверка обязательных полей
    if (!whereAdd || !whatAdd || !values) {
      return res.status(400).json({
        error: "Не указаны обязательные поля: whereAdd, whatAdd, values",
      });
    }

    let add = [];
    for (let value of values) {
      add.push('"' + value + '"');
    }

    let sql = `INSERT into ${whereAdd}(${whatAdd})values(${add})`;
    const params = [];

    connection.query(sql, params, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  });

  //бд запросы
  {
    // Запрос поиска в бд
    app.post("/api/find", (req, res) => {
      const { whatFind, whereFind, byWhat, value, limit } = req.body;

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
      if (limit) {
        sql += ` LIMIT ${limit}`;
        params.push(value);
      }

      connection.query(sql, params, (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(results);
      });
    });

    //удаление данных в бд
    app.post("/api/del", (req, res) => {
      const { whereDel, byWhat, value } = req.body;

      // Проверка обязательных полей
      if (!whereDel || !byWhat || !value) {
        return res.status(400).json({
          error: "Не указаны обязательные поля: whereDel, byWhat, value",
        });
      }

      let sql = `DELETE FROM ${whereDel} WHERE ${byWhat}="${value}"`;
      const params = [];

      connection.query(sql, params, (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(results);
      });
    });

    //изменение данных в бд
    app.post("/api/upd", (req, res) => {
      const { whereUpd, whatUpd = [], values = [], byWhat, byValue } = req.body;

      // Проверка обязательных полей
      if (!whereUpd || !whatUpd || !values || !byWhat || !byValue) {
        return res.status(400).json({
          error: "Не указаны обязательные поля: whereDel, byWhat, value",
        });
      }
      let upd = [];
      for (let i = 0; i < whatUpd.length; i++) {
        upd.push(whatUpd[i] + '="' + values[i] + '"');
      }
      let sql = `UPDATE ${whereUpd} set ${upd} WHERE ${byWhat}="${byValue}"`;
      const params = [];

      connection.query(sql, params, (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(results);
      });
    });
  }
}
// 1. Поиск по нескольким условиям (для ингредиентов по имени)
app.post("/api/find-multi", (req, res) => {
  const { whatFind, whereFind, conditions } = req.body;

  if (!whatFind || !whereFind || !conditions) {
    return res.status(400).json({
      error: "Не указаны обязательные поля: whatFind, whereFind, conditions",
    });
  }

  let sql = `SELECT ${whatFind} FROM ${whereFind} WHERE `;
  const params = [];
  const whereClauses = [];

  conditions.forEach((condition, index) => {
    whereClauses.push(`${condition.byWhat} = ?`);
    params.push(condition.value);
  });

  sql += whereClauses.join(" AND ");

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error("Ошибка запроса find-multi:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// 2. INSERT с возвратом ID (ваш /api/add не возвращает ID)
app.post("/api/insert-return-id", (req, res) => {
  const { table, data } = req.body;

  if (!table || !data) {
    return res.status(400).json({
      error: "Не указаны обязательные поля: table, data",
    });
  }

  const columns = Object.keys(data).join(", ");
  const placeholders = Object.keys(data)
    .map(() => "?")
    .join(", ");
  const values = Object.values(data);

  let sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error("Ошибка INSERT:", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json({
      success: true,
      id: results.insertId,
    });
  });
});

// 3. Удаление по нескольким условиям
app.post("/api/delete-multi", (req, res) => {
  const { table, conditions } = req.body;

  if (!table || !conditions) {
    return res.status(400).json({
      error: "Не указаны обязательные поля: table, conditions",
    });
  }

  let sql = `DELETE FROM ${table} WHERE `;
  const params = [];
  const whereClauses = [];

  conditions.forEach((condition) => {
    whereClauses.push(`${condition.field} = ?`);
    params.push(condition.value);
  });

  sql += whereClauses.join(" AND ");

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error("Ошибка удаления:", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json({
      success: true,
      affectedRows: results.affectedRows,
    });
  });
});

// 4. UPDATE с JSON данными (ваш /api/upd работает только со строками)
app.post("/api/update-json", (req, res) => {
  const { table, data, conditions } = req.body;

  if (!table || !data || !conditions) {
    return res.status(400).json({
      error: "Не указаны обязательные поля: table, data, conditions",
    });
  }

  const setClauses = [];
  const whereClauses = [];
  const params = [];

  // SET часть
  Object.entries(data).forEach(([key, value]) => {
    setClauses.push(`${key} = ?`);
    params.push(value);
  });

  // WHERE часть
  conditions.forEach((condition) => {
    whereClauses.push(`${condition.field} = ?`);
    params.push(condition.value);
  });

  const sql = `UPDATE ${table} SET ${setClauses.join(
    ", "
  )} WHERE ${whereClauses.join(" AND ")}`;

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error("Ошибка UPDATE:", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json({
      success: true,
      affectedRows: results.affectedRows,
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
