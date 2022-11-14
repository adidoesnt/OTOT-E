const express = require("express");
const mongoose = require("mongoose");
const redis = require("redis");
const dotenv = require("dotenv");
const people = require("./data.json");
const Person = require("./model/person");

const app = express();
const client = redis.createClient(6379);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

dotenv.config();

console.log(process.env.DB_URL);

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.on("open", () => console.log("connected to database"));

app.get("/", (req, res) => {
  return res.sendStatus(200);
});

app.get("/people", async (req, res) => {
  try {
    let data = await client.get("people");
    if (data === null) {
      const foundPeople = await Person.find();
      data = JSON.stringify(foundPeople);
      client.set("people", data);
    }
    return res.status(200).json(JSON.parse(data));
  } catch (err) {
    return res.sendStatus(500);
  }
});

app.post("/people", async (req, res) => {
  Person.insertMany(people)
    .then(function () {
      return res.sendStatus(200);
    })
    .catch(function (error) {
      return res.sendStatus(500);
    });
});

app.delete("/people", async (req, res) => {
  Person.deleteMany()
    .then(function () {
      return res.sendStatus(200);
    })
    .catch(function (error) {
      return res.sendStatus(500);
    });
});

app.post("/flush", async (req, res) => {
  try {
    await client.flushAll();
    return res.sendStatus(200);
  } catch (err) {
    return res.sendStatus(500);
  }
});

app.listen(3000, async () => {
  await client.connect();
  await client.flushAll();
  console.log("server listening on port 3000");
});
