import { checkUser } from "./checkUser.js";

let loginBox = document.getElementById("username"),
  passwordBox = document.getElementById("pass");

let tryAuth, tryStatus;

document.getElementById("enter").addEventListener("click", () => {
  checkUser(loginBox.value, passwordBox.value)
    .then((result) => {
      console.log("Результат:", result);
      console.log("Успех:", result.success);

      if (result.success) {
        window.location.href = "menu.html";
      }
    })
    .catch((error) => {
      console.error("Ошибка:", error);
    });
});
