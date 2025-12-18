let currentUser = null;
let userPosition = null;
let currentEditingPancake = null;

async function loadUserData() {
  try {
    // Пытаемся получить из localStorage (из profileButton.js)
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      try {
        const userData = JSON.parse(storedData);
        // Проверка, что данные валидны
        if (userData && userData.id && userData.login) {
          currentUser = { id: userData.id, login: userData.login };
          userPosition = userData.position;
          console.log("Данные из localStorage:", currentUser, userPosition);

          // Проверка, что пользователь действительно авторизован
          const checkResponse = await fetch(
            "http://localhost:3000/api/current-user",
            {
              credentials: "include",
            }
          );

          if (checkResponse.ok) {
            return true;
          } else {
            console.log("Сессия истекла, но данные есть в localStorage");
            // Оставляем данные для отображения, но ограничиваем функционал
            return true;
          }
        }
      } catch (e) {
        console.error("Ошибка парсинга userData:", e);
      }
    }

    // Если нет в localStorage или данные невалидны, запрашиваем с сервера
    const response = await fetch("http://localhost:3000/api/current-user", {
      credentials: "include",
    });

    if (response.status === 401) {
      console.log("Пользователь не авторизован");
      currentUser = null;
      userPosition = null;
      return false;
    }

    const data = await response.json();

    if (data.success && data.user) {
      currentUser = data.user;

      // Запрашиваем position из БД
      const userInfoResponse = await fetch("http://localhost:3000/api/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatFind: "position",
          whereFind: "users",
          byWhat: "id",
          value: currentUser.id,
        }),
      });

      const userInfo = await userInfoResponse.json();
      userPosition = userInfo[0]?.position || "user";

      // Сохраняем в localStorage для других скриптов
      localStorage.setItem(
        "userData",
        JSON.stringify({
          id: currentUser.id,
          login: currentUser.login,
          position: userPosition,
        })
      );

      console.log(
        "Пользователь авторизован:",
        currentUser.login,
        "Должность:",
        userPosition
      );
      return true;
    }

    console.log("Не удалось получить данные пользователя");
    currentUser = null;
    userPosition = null;
    return false;
  } catch (error) {
    console.error("Ошибка загрузки данных пользователя:", error);
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      try {
        const userData = JSON.parse(storedData);
        if (userData && userData.id && userData.login) {
          currentUser = { id: userData.id, login: userData.login };
          userPosition = userData.position;
          console.log("Используем данные из localStorage (ошибка сети)");
          return true;
        }
      } catch (e) {}
    }
    return false;
  }
}

function canEdit() {
  if (!currentUser) return false;
  return userPosition === "manager" || userPosition === "admin";
}

function canAdd() {
  if (!currentUser) return false;
  return userPosition === "admin";
}

async function loadPancakes() {
  try {
    const productsResponse = await fetch("http://localhost:3000/api/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        whatFind: "id, name, price, creator_id",
        whereFind: "products",
        byWhat: "pos_type",
        value: "pancake",
      }),
    });

    const pancakes = await productsResponse.json();

    if (!pancakes || pancakes.length === 0) {
      const mainMenu = document.getElementById("main-menu");
      mainMenu.innerHTML =
        '<p style="text-align: center; padding: 20px; color: #666;">Блины временно отсутствуют</p>';
      return;
    }

    // Для каждого блина получаем ингредиенты
    const pancakesWithIngredients = await Promise.all(
      pancakes.map(async (pancake) => {
        const linksResponse = await fetch("http://localhost:3000/api/find", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            whatFind: "ingredient_id, amount, unit",
            whereFind: "product_ingredients",
            byWhat: "product_id",
            value: pancake.id,
          }),
        });

        const links = await linksResponse.json();

        const ingredients = await Promise.all(
          links.map(async (link) => {
            const ingredientResponse = await fetch(
              "http://localhost:3000/api/find",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  whatFind: "id, name",
                  whereFind: "ingredients",
                  byWhat: "id",
                  value: link.ingredient_id,
                }),
              }
            );

            const ingredientData = await ingredientResponse.json();
            const ingredient = ingredientData[0];

            return {
              id: ingredient?.id,
              name: ingredient?.name || "",
              amount: link.amount,
              unit: link.unit,
            };
          })
        );

        return {
          id: pancake.id,
          name: pancake.name,
          price: pancake.price,
          creator_id: pancake.creator_id,
          ingredients: ingredients.filter((ing) => ing.id),
        };
      })
    );

    const mainMenu = document.getElementById("main-menu");
    mainMenu.innerHTML = "";

    pancakesWithIngredients.forEach((pancake) => {
      createPancakeCard(pancake);
    });
  } catch (error) {
    console.error("Ошибка загрузки блинов:", error);
    const mainMenu = document.getElementById("main-menu");
    mainMenu.innerHTML =
      '<p style="text-align: center; padding: 20px; color: red;">Ошибка загрузки меню</p>';
  }
}
//Создание карточки
function createPancakeCard(pancake) {
  const mainMenu = document.getElementById("main-menu");
  const formattedPrice = parseFloat(pancake.price).toFixed(2);

  const ingredientsHTML =
    pancake.ingredients.length > 0
      ? pancake.ingredients
          .map(
            (ing) =>
              `<li class="ingridient">${ing.name} - ${ing.amount}${ing.unit}</li>`
          )
          .join("")
      : '<li class="ingridient">Состав не указан</li>';

  const card = document.createElement("div");
  card.className = "position";
  card.style.cssText = `
    padding: 0.3em;
    padding-left: 0.1em;
    border-radius: 1em;
    border: .2em solid #4CAF50;
    margin-bottom: 3em;
    margin-right: 0.5em;
    width: 250px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    min-height: 400px;
  `;

  // Показываем кнопку "Изменить" только если пользователь может редактировать
  const showEditButton = canEdit();

  card.innerHTML = `
    <div style="flex-grow: 1;">
      <img class="position-image" src="img/position-image-small.png" alt="${
        pancake.name
      }" style="max-width: 100%; display: block; margin: 0 auto;">
      <p class="position-name" style="margin: 10px 0; text-align: center; font-weight: bold;">${
        pancake.name
      }</p>
      <div class="position-divider" style="width: 90%; margin: 10px auto; background-color: #000; height: 1px;"></div>
      <ul class="list-of-ingridients" style="margin: 0; font-size: 75%; padding: 0 10px; min-height: 80px;">
        ${ingredientsHTML}
      </ul>
      <div class="position-divider" style="width: 90%; margin: 10px auto; background-color: #000; height: 1px;"></div>
      <p class="position-price" style="margin: 10px 0; text-align: center; font-weight: bold;">${formattedPrice}руб</p>
    </div>
    ${
      showEditButton
        ? `
      <button class="change-position-button" data-id="${pancake.id}"
              style="
                display: block;
                margin: 10px auto;
                border-width: 0;
                background-color: #4CAF50;
                color: #f8f8f8;
                font-size: 1em;
                border-radius: 0.2em;
                width: 90%;
                padding: 8px 0;
                cursor: pointer;
                margin-top: auto;
              ">
        Изменить
      </button>
    `
        : ""
    }
  `;

  if (showEditButton) {
    const editButton = card.querySelector(".change-position-button");
    editButton.addEventListener("click", () => {
      openEditModal(pancake);
    });
  }

  mainMenu.appendChild(card);
}

//Кнопка добавления (только для admin)
function createAddButton() {
  if (!canAdd()) return;
  if (document.getElementById("add-pancake-button")) return;

  const addButton = document.createElement("button");
  addButton.id = "add-pancake-button";
  addButton.innerHTML = "+ Добавить блин";
  addButton.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 15px 25px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    z-index: 999;
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  addButton.addEventListener("mouseover", function () {
    this.style.transform = "translateY(-2px)";
    this.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.4)";
  });

  addButton.addEventListener("mouseout", function () {
    this.style.transform = "translateY(0)";
    this.style.boxShadow = "0 4px 15px rgba(76, 175, 80, 0.3)";
  });

  addButton.addEventListener("click", openAddPancakeModal);

  document.body.appendChild(addButton);
}

// Функция для поиска ингредиента по имени или создания нового
async function findOrCreateIngredient(ingredientName) {
  try {
    // Ищем ингредиент по имени
    const searchResponse = await fetch("http://localhost:3000/api/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        whatFind: "id",
        whereFind: "ingredients",
        byWhat: "name",
        value: ingredientName,
      }),
    });

    const existing = await searchResponse.json();

    if (existing && existing.length > 0) {
      return existing[0].id;
    }

    // Если не найден, создаем новый через /api/add
    const createResponse = await fetch("http://localhost:3000/api/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        whereAdd: "ingredients",
        whatAdd: ["name"],
        values: [ingredientName],
      }),
    });

    const result = await createResponse.json();

    // Пробуем получить ID нового ингредиента
    if (result.insertId) {
      return result.insertId;
    } else {
      // Если insertId нет, ищем последний добавленный
      const findNewResponse = await fetch("http://localhost:3000/api/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatFind: "id",
          whereFind: "ingredients",
          byWhat: "name",
          value: ingredientName,
        }),
      });

      const found = await findNewResponse.json();
      if (found && found.length > 0) {
        return found[0].id;
      }

      throw new Error("Не удалось создать или найти ингредиент");
    }
  } catch (error) {
    console.error("Ошибка в findOrCreateIngredient:", error);
    throw error;
  }
}

// Модальное окно редактирования
function openEditModal(pancake) {
  currentEditingPancake = pancake;

  const modal = document.createElement("div");
  modal.id = "edit-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  modal.innerHTML = `
    <div style="
      background: white;
      padding: 20px;
      border-radius: 10px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    ">
      <h2 style="margin-top: 0; color: #333;">Редактирование: ${
        pancake.name
      }</h2>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Название:</label>
        <input type="text" id="edit-pancake-name" value="${pancake.name}" 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Цена:</label>
        <input type="number" id="edit-pancake-price" value="${
          pancake.price
        }" step="0.01"
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ингредиенты:</label>
        <div id="ingredients-list" style="margin-bottom: 10px;">
          ${pancake.ingredients
            .map(
              (ing, index) => `
            <div style="display: grid; grid-template-columns: 1fr 80px 80px 40px; gap: 10px; margin-bottom: 5px; align-items: center;" data-index="${index}">
              <input type="text" value="${
                ing.name
              }" placeholder="Название ингредиента"
                     style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
              <input type="number" value="${ing.amount}" placeholder="Кол-во"
                     style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
              <select style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="g" ${
                  ing.unit === "g" ? "selected" : ""
                }>г</option>
                <option value="piece" ${
                  ing.unit === "piece" ? "selected" : ""
                }>шт</option>
                <option value="ml" ${
                  ing.unit === "ml" ? "selected" : ""
                }>мл</option>
              </select>
              <button type="button" class="remove-ingredient-btn" data-index="${index}"
                      style="background: #ff4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
                ✕
              </button>
            </div>
          `
            )
            .join("")}
        </div>
        <button type="button" id="add-ingredient-btn"
                style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 15px;">
          + Добавить ингредиент
        </button>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <button id="cancel-edit-btn" 
                style="padding: 10px 20px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">
          Отмена
        </button>
        <button id="save-edit-btn"
                style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Сохранить в БД
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  // Настройка обработчиков
  document
    .getElementById("add-ingredient-btn")
    .addEventListener("click", function () {
      const ingredientsList = document.getElementById("ingredients-list");
      const newIndex = ingredientsList.children.length;

      const ingredientDiv = document.createElement("div");
      ingredientDiv.style.cssText =
        "display: grid; grid-template-columns: 1fr 80px 80px 40px; gap: 10px; margin-bottom: 5px; align-items: center;";
      ingredientDiv.setAttribute("data-index", newIndex);

      ingredientDiv.innerHTML = `
        <input type="text" placeholder="Название ингредиента" 
               style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
        <input type="number" placeholder="Кол-во" value="100"
               style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
        <select style="padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="g">г</option>
          <option value="piece">шт</option>
          <option value="ml">мл</option>
        </select>
        <button type="button" class="remove-ingredient-btn" data-index="${newIndex}"
                style="background: #ff4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer;">
          ✕
        </button>
      `;

      ingredientsList.appendChild(ingredientDiv);

      ingredientDiv
        .querySelector(".remove-ingredient-btn")
        .addEventListener("click", function () {
          const index = this.getAttribute("data-index");
          document
            .querySelector(`#ingredients-list div[data-index="${index}"]`)
            .remove();
        });
    });

  document.querySelectorAll(".remove-ingredient-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = this.getAttribute("data-index");
      document
        .querySelector(`#ingredients-list div[data-index="${index}"]`)
        .remove();
    });
  });

  document
    .getElementById("cancel-edit-btn")
    .addEventListener("click", function () {
      document.getElementById("edit-modal").remove();
      document.body.style.overflow = "auto";
    });

  document
    .getElementById("save-edit-btn")
    .addEventListener("click", async function () {
      const name = document.getElementById("edit-pancake-name").value.trim();
      const price = document.getElementById("edit-pancake-price").value;

      if (!name || !price) {
        alert("Заполните название и цену");
        return;
      }

      const ingredientRows = document.querySelectorAll(
        "#ingredients-list > div"
      );
      const ingredients = [];

      for (const row of ingredientRows) {
        const nameInput = row.querySelector('input[type="text"]');
        const amountInput = row.querySelector('input[type="number"]');
        const unitSelect = row.querySelector("select");

        if (nameInput.value.trim()) {
          ingredients.push({
            name: nameInput.value.trim(),
            amount: amountInput.value || 0,
            unit: unitSelect.value,
          });
        }
      }

      try {
        // Показываем уведомление о начале сохранения
        const saveBtn = document.getElementById("save-edit-btn");
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Сохранение...";
        saveBtn.disabled = true;

        // Обновляем данные продукта через /api/upd
        const updateProductResponse = await fetch(
          "http://localhost:3000/api/upd",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              whereUpd: "products",
              whatUpd: ["name", "price"],
              values: [name, parseFloat(price)],
              byWhat: "id",
              byValue: pancake.id,
            }),
          }
        );

        const updateResult = await updateProductResponse.json();
        console.log("Результат обновления продукта:", updateResult);

        // Удаляем старые связи с ингредиентами через /api/del
        const deleteResponse = await fetch("http://localhost:3000/api/del", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            whereDel: "product_ingredients",
            byWhat: "product_id",
            value: pancake.id,
          }),
        });

        const deleteResult = await deleteResponse.json();
        console.log("Результат удаления связей:", deleteResult);

        // Cоздаем новые связи с ингредиентами
        for (const ingredient of ingredients) {
          const ingredientId = await findOrCreateIngredient(ingredient.name);

          const addResponse = await fetch("http://localhost:3000/api/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              whereAdd: "product_ingredients",
              whatAdd: ["product_id", "ingredient_id", "amount", "unit"],
              values: [
                pancake.id,
                ingredientId,
                ingredient.amount,
                ingredient.unit,
              ],
            }),
          });

          const addResult = await addResponse.json();
          console.log("Результат добавления связи:", addResult);
        }

        // Обновляем карточку на странице
        updatePancakeCard(pancake.id, {
          name,
          price,
          ingredients: ingredients.map(
            (ing) => `${ing.name} - ${ing.amount}${ing.unit}`
          ),
        });

        document.getElementById("edit-modal").remove();
        document.body.style.overflow = "auto";

        alert("Изменения сохранены в БД!");
      } catch (error) {
        console.error("Ошибка сохранения:", error);
        alert("Ошибка при сохранении в БД: " + error.message);

        // Восстанавливаем кнопку
        const saveBtn = document.getElementById("save-edit-btn");
        saveBtn.textContent = "Сохранить в БД";
        saveBtn.disabled = false;
      }
    });
}

// Модальное окно добавления
function openAddPancakeModal() {
  const modal = document.createElement("div");
  modal.id = "add-pancake-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  modal.innerHTML = `
    <div style="
      background: white;
      padding: 25px;
      border-radius: 10px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    ">
      <h2 style="margin-top: 0; color: #333;">Добавить новый блин</h2>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Название:</label>
        <input type="text" id="new-pancake-name" placeholder="Введите название" 
               style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Цена (руб):</label>
        <input type="number" id="new-pancake-price" placeholder="0.00" step="0.01" min="0"
               style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Ингредиенты:</label>
        <div id="new-ingredients-list" style="margin-bottom: 15px;">
          <div style="display: grid; grid-template-columns: 1fr 80px 80px 40px; gap: 10px; margin-bottom: 10px; align-items: center;" data-index="0">
            <input type="text" placeholder="Название ингредиента" 
                   style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" placeholder="Кол-во" value="100"
                   style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <select style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <option value="g">г</option>
              <option value="piece">шт</option>
              <option value="ml">мл</option>
            </select>
            <button type="button" class="remove-new-ingredient-btn" data-index="0"
                    style="background: #ff4444; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">
              ✕
            </button>
          </div>
        </div>
        <button type="button" id="add-new-ingredient-btn"
                style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          + Добавить ингредиент
        </button>
      </div>
      
      <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 25px;">
        <button id="cancel-add-btn" 
                style="padding: 12px 25px; background: #f0f0f0; border: none; border-radius: 5px; cursor: pointer;">
          Отмена
        </button>
        <button id="save-new-pancake-btn"
                style="padding: 12px 25px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Добавить в БД
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  // Настройка обработчиков
  document
    .getElementById("add-new-ingredient-btn")
    .addEventListener("click", function () {
      const ingredientsList = document.getElementById("new-ingredients-list");
      const newIndex = ingredientsList.children.length;

      const ingredientDiv = document.createElement("div");
      ingredientDiv.style.cssText =
        "display: grid; grid-template-columns: 1fr 80px 80px 40px; gap: 10px; margin-bottom: 10px; align-items: center;";
      ingredientDiv.setAttribute("data-index", newIndex);

      ingredientDiv.innerHTML = `
        <input type="text" placeholder="Название ингредиента" 
               style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <input type="number" placeholder="Кол-во" value="100"
               style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <select style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="g">г</option>
          <option value="piece">шт</option>
          <option value="ml">мл</option>
        </select>
        <button type="button" class="remove-new-ingredient-btn" data-index="${newIndex}"
                style="background: #ff4444; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">
          ✕
        </button>
      `;

      ingredientsList.appendChild(ingredientDiv);

      ingredientDiv
        .querySelector(".remove-new-ingredient-btn")
        .addEventListener("click", function () {
          const index = this.getAttribute("data-index");
          document
            .querySelector(`#new-ingredients-list div[data-index="${index}"]`)
            .remove();
        });
    });

  document.querySelectorAll(".remove-new-ingredient-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = this.getAttribute("data-index");
      document
        .querySelector(`#new-ingredients-list div[data-index="${index}"]`)
        .remove();
    });
  });

  document
    .getElementById("cancel-add-btn")
    .addEventListener("click", function () {
      document.getElementById("add-pancake-modal").remove();
      document.body.style.overflow = "auto";
    });

  document
    .getElementById("save-new-pancake-btn")
    .addEventListener("click", async function () {
      const name = document.getElementById("new-pancake-name").value.trim();
      const price = document.getElementById("new-pancake-price").value;

      if (!name) {
        alert("Введите название блина");
        return;
      }

      if (!price || parseFloat(price) <= 0) {
        alert("Введите корректную цену");
        return;
      }

      const ingredientRows = document.querySelectorAll(
        "#new-ingredients-list > div"
      );
      const ingredients = [];

      for (const row of ingredientRows) {
        const nameInput = row.querySelector('input[type="text"]');
        const amountInput = row.querySelector('input[type="number"]');
        const unitSelect = row.querySelector("select");

        if (nameInput.value.trim()) {
          ingredients.push({
            name: nameInput.value.trim(),
            amount: amountInput.value || 0,
            unit: unitSelect.value,
          });
        }
      }

      try {
        // Показываем уведомление о начале сохранения
        const saveBtn = document.getElementById("save-new-pancake-btn");
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Добавление...";
        saveBtn.disabled = true;

        // Создаем новый продукт через /api/add
        const createProductResponse = await fetch(
          "http://localhost:3000/api/add",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              whereAdd: "products",
              whatAdd: ["name", "price", "pos_type", "creator_id"],
              values: [name, parseFloat(price), "pancake", currentUser.id],
            }),
          }
        );

        const createResult = await createProductResponse.json();
        console.log("Результат создания продукта:", createResult);

        let newProductId;

        if (createResult.insertId) {
          newProductId = createResult.insertId;
        } else {
          // Если не получили insertId, ищем продукт по имени
          const findResponse = await fetch("http://localhost:3000/api/find", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              whatFind: "id",
              whereFind: "products",
              byWhat: "name",
              value: name,
            }),
          });

          const found = await findResponse.json();
          if (found && found.length > 0) {
            // Берем последний созданный продукт с таким именем
            newProductId = found[found.length - 1].id;
          } else {
            throw new Error("Не удалось получить ID нового продукта");
          }
        }

        // Создаем связи с ингредиентами
        for (const ingredient of ingredients) {
          const ingredientId = await findOrCreateIngredient(ingredient.name);

          const addResponse = await fetch("http://localhost:3000/api/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              whereAdd: "product_ingredients",
              whatAdd: ["product_id", "ingredient_id", "amount", "unit"],
              values: [
                newProductId,
                ingredientId,
                ingredient.amount,
                ingredient.unit,
              ],
            }),
          });

          const addResult = await addResponse.json();
          console.log("Результат добавления связи:", addResult);
        }

        // Добавляем карточку на страницу
        const newPancake = {
          id: newProductId,
          name: name,
          price: parseFloat(price).toFixed(2),
          ingredients: ingredients.map(
            (ing) => `${ing.name} - ${ing.amount}${ing.unit}`
          ),
        };

        addPancakeCardToPage(newPancake);

        document.getElementById("add-pancake-modal").remove();
        document.body.style.overflow = "auto";

        alert(`Блин "${name}" добавлен в БД!`);
      } catch (error) {
        console.error("Ошибка добавления:", error);
        alert("Ошибка при добавлении в БД: " + error.message);

        // Восстанавливаем кнопку
        const saveBtn = document.getElementById("save-new-pancake-btn");
        saveBtn.textContent = "Добавить в БД";
        saveBtn.disabled = false;
      }
    });
}

// Вспомогательные функции
function updatePancakeCard(pancakeId, newData) {
  const allCards = document.querySelectorAll(".position");
  allCards.forEach((card) => {
    const button = card.querySelector(".change-position-button");
    if (button && button.getAttribute("data-id") == pancakeId) {
      const nameElement = card.querySelector(".position-name");
      if (nameElement) nameElement.textContent = newData.name;

      const priceElement = card.querySelector(".position-price");
      if (priceElement)
        priceElement.textContent = `${parseFloat(newData.price).toFixed(2)}руб`;

      const ingredientsList = card.querySelector(".list-of-ingridients");
      if (ingredientsList) {
        ingredientsList.innerHTML =
          newData.ingredients.length > 0
            ? newData.ingredients
                .map((ing) => `<li class="ingridient">${ing}</li>`)
                .join("")
            : '<li class="ingridient">Состав не указан</li>';
      }
    }
  });
}

function addPancakeCardToPage(pancake) {
  const mainMenu = document.getElementById("main-menu");
  createPancakeCard(pancake);
}

// Инициализация
document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM загружен, начинаем инициализацию...");

  // Загружаем данные пользователя
  const userLoaded = await loadUserData();
  console.log(
    "Пользователь загружен:",
    userLoaded,
    "Текущий пользователь:",
    currentUser
  );

  // Загружаем блины
  await loadPancakes();

  // Создаем кнопку добавления (только для admin)
  createAddButton();

  // Настройка фильтров
  const filterButtons = document.querySelectorAll("#section-table td");
  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      filterButtons.forEach((btn) => (btn.style.backgroundColor = ""));
      this.style.backgroundColor = "#f0f0f0";

      if (this.id === "pancakes filter") {
        loadPancakes();
      }
    });
  });
});
// Добавить в конец script.js, перед закрывающей скобкой
function setupGlobalLogout() {
  // Функция для глобального использования
  window.logoutUser = async function () {
    try {
      const response = await fetch("http://localhost:3000/api/logout", {
        method: "POST",
        credentials: "include",
      });

      // Очищаем все данные
      localStorage.removeItem("userData");
      localStorage.removeItem("user");
      currentUser = null;
      userPosition = null;

      // Перезагружаем страницу
      window.location.reload();
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      // Все равно очищаем и перезагружаем
      localStorage.removeItem("userData");
      localStorage.removeItem("user");
      window.location.reload();
    }
  };
}

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM загружен, начинаем инициализацию...");

  // Настраиваем глобальный выходs
  setupGlobalLogout();
});
