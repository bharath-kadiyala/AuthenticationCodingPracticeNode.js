const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let dataBase = null;
const initializeDbAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DataBase Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//1.creating User account API

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkUserNameQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await dataBase.get(checkUserNameQuery);
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (dbUser === undefined) {
    //post new user account
    const addNewUser = `
    INSERT INTO
        user(username,name,password,gender,location)
    VALUES(
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
    )`;
    await dataBase.run(addNewUser);
    response.status(200);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//2.login User API

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await dataBase.get(checkUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, dbUser.password);
    if (checkPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//3. Update Password API

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserNameQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await dataBase.get(checkUserNameQuery);
  if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const checkOldPass = await bcrypt.compare(oldPassword, dbUser.password);
    if (checkOldPass === true) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const changePasswordQuery = `
        UPDATE  user
        SET
            password = '${hashedPassword}'
        `;
      await dataBase.run(changePasswordQuery);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
