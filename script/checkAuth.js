export function checkAuth() {
  fetch("http://localhost:3000/api/user", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.user) {
        console.log("Авторизован как:", data.user.login);
        return true;
      } else {
        console.log("Не авторизован");
        return false;
      }
    });
}
