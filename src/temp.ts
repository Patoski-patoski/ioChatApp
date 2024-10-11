import express from "express";
import dotenv from "dotenv";
import { query, validationResult, matchedData } from "express-validator";
import { router, cookieParser, session } from "./routes/users.js";
dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
const middleware = (req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};
app.use(cookieParser('helloworld'));
app.use(express.json());
app.use(middleware, (_req, _res, next) => {
    console.log("Finished logging...");
    next();
});
app.use(session({
    secret: 'ApolloFolloDolloRollo',
    saveUninitialized: true,
    resave: false,
    cookie: {
        maxAge: 6000 * 10,
    }
}));
app.use(router);
const users = [
    { id: 1, name: "patrick", age: 25 },
    { id: 2, name: "bola", age: 28 },
    { id: 3, name: "Charles", age: 35 },
    { id: 4, name: "David", age: 39 },
    { id: 5, name: "Anita", age: 15 },
];
app.get("/", (_req, res, next) => {
    console.log("Base URL 1");
    next();
});
app.get("/api/users", (req, res) => {
    const querys = req.query;
    console.log(req);
    const str = querys.filter;
    const val = querys.value;
    if (!querys || !str || !val) {
        res.status(200).send(users);
    }
    if (str && val) {
        const filteredUsers = users.filter((user) => user.name.includes(val));
        if (filteredUsers.length > 0)
            res.status(200).send(filteredUsers);
        else
            res.status(200).json({ msg: "No user match" });
    }
});
app.get("/hello", query("person").notEmpty().escape(), (req, res) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
        const data = matchedData(req);
        return res.send(`Hello, ${data.person}!`);
    }
    res.send({ errors: result.array() });
});
app.get("/api/users/:user_id", (req, res, next) => {
    const param = parseInt(req.params.user_id);
    const findUser = users.find((user) => user.id === param);
    if (findUser) {
        res.status(200).send(findUser);
        next();
    }
    else
        res.status(404).json({ msg: `No user with id: ${param}` });
});
app.put("/api/users/:user_id", (req, res) => {
    const parsedId = parseInt(req.params.user_id, 10);
    const findUser = users.find((user) => user.id === parsedId);
    if (findUser) {
        const { name, age } = req.body;
        if (name)
            findUser.name = name;
        if (age)
            findUser.age = age;
        res.status(200).send(findUser);
    }
    else
        res.status(404).json({ msg: `No user with id: ${parsedId}` });
});
app.patch("/api/users/:userId", (req, res) => {
    const parsedId = parseInt(req.params.userId, 10);
    const findUser = users.find((user) => user.id === parsedId);
    if (findUser) {
        Object.assign(findUser, req.body);
        res.status(200).send(findUser);
    }
    else
        res.status(404).json({ msg: `No user with id: ${parsedId}` });
});
app.delete("/api/users/:userId", (req, res) => {
    const parsedId = parseInt(req.params.userId, 10);
    const newUsers = users.filter((user) => user.id !== parsedId);
    if (newUsers.length < users.length) {
        users.length = 0;
        users.push(...newUsers);
        res.status(200).json({ msg: `User with id ${parsedId} deleted!!` });
    }
    else
        res.status(404).json({ msg: `No user with id: ${parsedId}` });
});
app.post("/api/users", (req, res) => {
    const newUser = { id: users[users.length - 1].id + 1, ...req.body };
    if (!newUser.name || !newUser.age) {
        res.status(404).json({ msg: "Name and age is required" });
    }
    users.push(newUser);
    console.log(newUser);
    res.sendStatus(201).json(newUser);
});
app.get('/cookie', (req, res) => {
    res.cookie('Hello', 'World', { maxAge: 9000 * 10, signed: true, httpOnly: true });
    res.status(201).send('Hello World');
});
app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}`);
});
