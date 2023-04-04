// Download the helper library from https://www.twilio.com/docs/node/install
// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = "ACfa19fc65d8a1335f00c062d24dc83ddc";
const authToken = "46f32c61b9dd63ada0a0f506a4128fe3";
const client = require("twilio")(accountSid, authToken);

export async function sendMessage(message_to_send, number = "+639453727506") {
  client.messages
    .create({
      body: message_to_send,
      from: "+12708175659",
      statusCallback: "http://postb.in/1234abcd",
      to: number,
    })
    .then((message) => console.log(message.sid));
}
