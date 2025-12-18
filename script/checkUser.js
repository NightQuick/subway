async function checkUser(user) {
  try {
    let realUser = await findData(
      ["id", "login", "password_hash"],
      "users",
      "login",
      user.login
    );

    console.log(typeof realUser[0]);
    if (typeof realUser[0] != "object") {
      return { success: false, message: "User not found" };
    }
    console.log("полученный пользователь: ", realUser[0]);

    // Сравнение пароля напрямую (без хэширования)
    if (user.password !== realUser[0].password_hash) {
      console.log(user.password);
      console.log(realUser[0].password_hash);
      return { success: false, message: "Invalid password" };
    }

    return {
      success: true,
      message: "User authenticated",
      user: {
        id: realUser[0].id,
        login: realUser[0].login,
      },
    };
  } catch (error) {
    console.error("Error in checkUser:", error);
    return { success: false, message: "Server error" };
  }
}
