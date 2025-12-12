import { checkUser } from "./checkUser.js";

let loginBox = document.getElementById("username"),
  passwordBox = document.getElementById("pass");

let tryAuth, tryStatus;

document.getElementById("enter").addEventListener("click", () => {
  tryAuth = checkUser(loginBox.value, passwordBox.value);
  console.log(tryAuth);
  if (tryAuth["succsess"]) {
    window.location.href = "script/authScript.js";
  }
});
