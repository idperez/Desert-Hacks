var bodyParser = require('body-parser');
var yelp = require("node-yelp");
var request_async = require('request');
var data = require('./data');
var path = require("path");

var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

const PAGE_ACCESS_TOKEN = "EAAPxkm7zj3gBADoLn1RdDaHzPZB3Wm05XtYMLZBXPh4Yhrs88BpDwOZBtJbllkT4dPLvfxVcnJHrzKARBJTqAF0pqwJ6ry3Ig0mAP8sJbjzWT3TXZBfERrmmvqPOQKDtrSP3P5dWsrF2d2fTh1jhLpsylq6BDVcwalEKbtJAhQZDZD";

var client = yelp.createClient({
    oauth: {
        "consumer_key": "h3hey-0-AyrmRjIDFO9IQg",
        "consumer_secret": "sJQECeqywCfYNYdeCOAiL2ho0K0",
        "token": "71Z8v3i4PhPTNC3pgr7nmpwwETLaPc9Y",
        "token_secret": "vD62BuDMwSMUd_XhGdzUq_TrCfs"
    },
    // Optional settings:
    httpClient: {
        maxSockets: 25  // ~> Default is 10
    }
});

app.get('/', function(request, response) {
    response.send("hello");
});

app.get('/privacy/', function(request, response) {
    response.sendFile(path.join(__dirname+'/privacy.html'));
});

app.get('/webhook/', function(request, response) {
    if (request.query['hub.verify_token'] === "secret-key") {
        response.send(request.query['hub.challenge']);
    }
    response.send("Wrong token");
});

app.post('/webhook/', function(request, response) {
    let messaging_events = request.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++) {
        let event = messaging_events[i];
        let sender = event.sender.id;
        if (event.message && event.message.text) {
            let text = event.message.text.split(" ");
            if(text.length == 3) {
                let city = text[0];
                let state = text[1];
                let type = text[2];
                request_async(`http://lesserthan.com/api.getDealsCity/${state}/${city}/json`, function (error, response, body) {
                    let deals = JSON.parse(body).items;
                    let keyword = data.getKeyword(type);
                    let deal_info = data.getDealbyType(deals, keyword);
                    if(deal_info != undefined) {
                        let title = data.getMerchantTitle(deal_info[8]);
                        if(deal_info[2] != null) {
                            client.search({
                                term: title,
                                location: deal_info[7]
                            }).then(function (data) {
                                let businesses = data.businesses;
                                let review = getReviewByAddress(businesses, deal_info[4]);
                                let review_info = getReviewInfo(review);
                                if (deal_info[9] == undefined) {
                                    sendText(sender, "No deals at this time!");
                                } else if (review_info.length > 0) {
                                    sendMessageWithReview(sender, review_info, deal_info);
                                } else {
                                    sendText(sender, "No deals at this time! Try again.");
                                }
                            });
                        } else {
                            sendText(sender, "No deals at this time! Try again.");
                        }
                    } else {
                        sendText(sender, "Incorrect format! Type 'help' to see example.");
                    }
                });
            } else {
                if(text[0] == 'help'){
                    sendText(sender, "Hello! I'am deal bot, I can find deals and reviews!\nHere is an example..\n\nCITY STATE TYPE\nphoenix arizona food\n\nEnter 'type' to see the different deals I can give you!\nGood luck!");
                } else if(text[0] == 'type') {
                    sendText(sender, "Here are the types of deals you can get with the arguments you may give..\n\nFood deals: food, eat, drink\nHealth & Beauty Deals: gym, health, beauty");
                } else if(text[0] == 'hello' || text[0] == 'hi' || text[0] == 'sup'){
                    sendText(sender, "I'm not one for small talk, I just give you deals and go to bed.");
                } else {
                    sendText(sender, "Invalid number of arguments! Type 'help' to see example.");
                }
            }
            break;
        }
    }
    response.sendStatus(200);
});

function sendText(sender, text) {
    let messageData = {text: text};
    request_async({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs : {access_token: PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: sender},
            message : messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log("sending error")
        } else if (response.body.error) {
            console.log("response body error")
        }
    });
}

function sendMessageWithReview(recipientId, review_info, deal_info) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: deal_info[0],
                        subtitle: `${deal_info[8]}\nOriginal Price: ${deal_info[2]}\nYour Price: ${deal_info[1]}\n${deal_info[7]}, ${deal_info[10]}`,
                        image_url: deal_info[3],
                        buttons: [{
                            type: "web_url",
                            url: deal_info[9],
                            title: "Open Deal"
                        }, {
                            type: "web_url",
                            url: deal_info[9],
                            title: "Get Directions"
                        }],
                    }, {
                        title: `Rating: ${review_info[0]}`,
                        subtitle: review_info[3],
                        image_url: review_info[4],
                        buttons: [{
                            type: "web_url",
                            url: review_info[5],
                            title: "See Full Review"
                        }, {
                            type: "web_url",
                            url: review_info[5],
                            title: "Call Business"
                        }]
                    }]
                }
            }
        }
    };
    callSendAPI(messageData);
}

function sendBasicMessage(recipientId, deal_info) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: deal_info[0],
                        subtitle: `${deal_info[8]}\nOriginal Price: ${deal_info[2]}\nYour Price: ${deal_info[1]}`,
                        image_url: deal_info[3],
                        buttons: [{
                            type: "web_url",
                            url: deal_info[9],
                            title: "Open Deal"
                        }, {
                            type: "web_url",
                            title: "Get Directions",
                            url: deal_info[9],
                        }],
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

function callSendAPI(messageData) {
    request_async({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s",
                messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}

function getReviewByAddress(reviews, address) {
    let found_review = "";
    reviews.map((review) => {
        let review_number = review.location.address.toString().replace(/['"]+/g, '').split(" ")[0].replace(/ /g,'');
        let address_number = address.replace(/['"]+/g, '').split(" ")[0].replace(/ /g,'');
        if(review_number === address_number) {
            found_review = review;
        }
    });
    return found_review;
};

/*
 Index
 0 - Rating
 1 - Phone Number
 2 - Display Phone Number
 3 - Snippet Text
 4 - Review Image
 5 - Mobile URL
 6 - Rating Image In Stars
 */
function getReviewInfo(review) {
    let info = [];
    if(review !== "") {

        let rating = review.rating;
        let phone = review.phone;
        let display_phone = review.display_phone;
        let snippet_text = review.snippet_text;
        let snippet_image_url = review.snippet_image_url;
        let mobile_url = review.mobile_url;
        let rating_image_url_large = review.rating_img_url_large;

        info.push(rating);
        info.push(phone);
        info.push(display_phone);
        info.push(snippet_text);
        info.push(snippet_image_url);
        info.push(mobile_url);
        info.push(rating_image_url_large);
    }
    return info;
}

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

