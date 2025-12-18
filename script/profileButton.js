import { checkAuth } from "./checkAuth.js";

let navigation = document.getElementById("navigation");

let user = await checkAuth();

if (user) {
  try {
    // Загружаем полную информацию о пользователе
    const userInfoResponse = await fetch("http://localhost:3000/api/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        whatFind: "position",
        whereFind: "users",
        byWhat: "id",
        value: user.id,
      }),
    });

    const userInfo = await userInfoResponse.json();
    const userPosition = userInfo[0]?.position || "user";

    localStorage.setItem(
      "userData",
      JSON.stringify({
        id: user.id,
        login: user.login,
        position: userPosition,
      })
    );

    // Показываем профиль
    let profileContainer = document.createElement("div");
    profileContainer.id = "profile-container";

    let loginBox = document.createElement("p");
    loginBox.innerText = `${user.login} (${getPositionName(userPosition)})`;
    loginBox.id = "login-box";
    loginBox.title = `Должность: ${getPositionName(userPosition)}`;

    let profileImage = document.createElement("img");
    profileImage.src = "img/profileLogo.png";
    profileImage.id = "profileImage";

    // Стили
    profileContainer.style.border = `2px solid ${getPositionColor(
      userPosition
    )}`;
    profileContainer.style.borderRadius = "10px";
    profileContainer.style.padding = "5px 10px";
    profileContainer.style.background = `${getPositionColor(userPosition)}15`;
    profileContainer.style.cursor = "pointer";
    profileContainer.title = "Нажмите для выхода";

    // Выход
    profileContainer.addEventListener("click", handleLogout);

    navigation.appendChild(profileContainer);
    profileContainer.appendChild(loginBox);
    profileContainer.appendChild(profileImage);

    console.log(
      "Пользователь авторизован:",
      user.login,
      "Должность:",
      userPosition
    );
  } catch (error) {
    console.error("Ошибка загрузки данных пользователя:", error);
    showLoginButton();
  }
} else {
  showLoginButton();
  localStorage.removeItem("userData");
}

function showLoginButton() {
  let url = document.createElement("a");
  url.href = "authentication.html";

  let button = document.createElement("button");
  button.id = "header-button-auth";
  button.innerText = "Вход/Регистрация";

  url.appendChild(button);
  navigation.appendChild(url);
}

function getPositionName(position) {
  return (
    {
      admin: "Админ",
      manager: "Менеджер",
      user: "Пользователь",
    }[position] || position
  );
}

function getPositionColor(position) {
  return (
    {
      admin: "#FF5722",
      manager: "#2196F3",
      user: "#4CAF50",
    }[position] || "#757575"
  );
}

async function handleLogout() {
  try {
    const response = await fetch("http://localhost:3000/api/logout", {
      method: "POST",
      credentials: "include",
    });

    localStorage.removeItem("userData");
    localStorage.removeItem("user");

    window.location.reload();
  } catch (error) {
    console.error("Ошибка при выходе:", error);
    localStorage.removeItem("userData");
    localStorage.removeItem("user");
    window.location.reload();
  }
}
