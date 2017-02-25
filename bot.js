'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();

app.set('port', (process.env.PORT || 5000));

// Allows us to process the data
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.send("Hi I am a chatbot")
});

let token = "";

app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === "password") {
        res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token")
});

app.post('/webhook/', function(req, res) {
    let messaging_events = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++) {
        let event = messaging_events[i];
        let sender = event.sender.id;
        if (event.message && event.message.text) {
            let text = event.message.text;
            sendText(sender, "Text echo: " + text.substring(0, 100))
        }
    }
    res.sendStatus(200)
});

app.listen(app.get('port'), function() {
    console.log("running: port")
});