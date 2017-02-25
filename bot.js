'use strict';
var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

app.get('/', function(req, res) {
    res.send("Hi I am a chatbot")
});

let token = "";

app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === "blondiebytes") {
        res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token")
});

app.listen(app.get('port'), function() {
    console.log("running: port")
});
