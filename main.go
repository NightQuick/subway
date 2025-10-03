package main

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	database, _ := sql.Open("sqlite3", "./data/data.db")

	statement, _ := database.Prepare("CREATE TABLE IF NOT EXISTS account (id INTEGER PRIMARY KEY, login TEXT,password TEXT, birthDate) ")
	statement.Exec()

	// statement, _ = database.Prepare("INSERT INTO people (login,password) VALUES (?,?)")
	// statement.Exec("Lorem", "Ipsum")

	// rows, _ := database.Query("SELECT id, login, password FROM people")

	// var id int
	// var login string
	// var password string
	// for rows.Next() {
	// 	rows.Scan(&id, &login, &password)
	// 	fmt.Printf("%d:%s %s\n", id, login, password)
	// }
}
