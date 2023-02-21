require("dotenv").config();
import request from "request";

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

let getHomePage = (req, res) => {
    return res.send("Xin Chào");
};

let postWebhook = (req, res) => {
    let body = req.body;

    console.log(`\u{1F7EA} Received webhook:`);
    console.dir(body, { depth: null });

    if (body.object === "page") {

        body.entry.forEach(function (entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);


            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });
        // Returns a '200 OK' response to all requests
        res.status(200).send("EVENT_RECEIVED");

        // Determine which webhooks were triggered and get sender PSIDs and locale, message content and more.

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
};

let getWebhook = (req, res) => {
    // Your verify token. Should be a random string.

    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
        // Check the mode and token sent is correct
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            // Respond with the challenge token from the request
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            // Respond with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
};

// Handles messages events
function handleMessage(sender_psid, received_message) {

    let response;

    // Check if the message contains text
    if (received_message.text) {

        const heightRegex = /(\d+)m(\d+)/;
        const weightRegex = /(\d+)kg/;

        const heightMatch = received_message.text.match(heightRegex);
        const weightMatch = received_message.text.match(weightRegex);

        if (received_message.text.includes('hi shop') || received_message.text.includes('chào shop')) {
            response = {
                text: `Xin chào, cảm ơn bạn đã liên hệ, tôi có thể giúp gì được cho bạn?`
            };
        } else if (received_message.text.includes('shop ơi') || received_message.text.includes('alo')) {
            response = {
                text: `Mình nghe ạ`
            };
        } else if (heightMatch && weightMatch) {
            response = checSize(heightMatch, weightMatch);
        }
    } else if (received_message.attachments) {
        // Get the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { "text": "Thanks!" }
    } else if (payload === 'no') {
        response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

function checSize(heightMatch, weightMatch) {
    cc = `${heightMatch[1]}m${heightMatch[2]} ${weightMatch[1]}kg `;
    const heightInCm = parseInt(heightMatch[1]) * 100 + parseInt(heightMatch[2]);
    const weight = parseInt(weightMatch[1]);

    if (heightInCm < 165 && heightInCm > 150 && weight < 60 && weight > 50) {
        return {
            text: cc + 'lấy size S được ạ'
        }
    } else if (heightInCm < 172 && heightInCm > 163 && weight < 70 && weight > 60) {
        return {
            text: cc + 'lấy size M được ạ'
        }
    } else if (heightInCm < 178 && heightInCm > 170 && weight < 77 && weight > 68) {
        return {
            text: cc + 'lấy size L được ạ'
        }
    } else if (heightInCm < 190 && heightInCm > 176 && weight < 85 && weight > 75) {
        return {
            text: cc + 'lấy size XL được ạ'
        }
    }
}

module.exports = {
    getHomePage: getHomePage, //key: value
    getWebhook: getWebhook,
    postWebhook: postWebhook
}