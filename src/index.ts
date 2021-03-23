import express from "express";
import expressWs from "express-ws";
import { createEngine } from "express-react-views";


const ws = expressWs(express());
const app = ws.app;
const port = process.env.PORT || 8080;


// Setup react engine
app.engine('jsx', createEngine);

import { router as APIRouter } from "./routes/api";
app.use("/party", APIRouter);


app.get("/", (req, res) => {
    res.send("Hello, World");
})

app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log("Listening...");
})