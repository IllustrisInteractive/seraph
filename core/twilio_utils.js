const accountSid = "ACfad99392c76f19084334aeea53bbe2a8";
const authToken = "989b08460520548c9707f64f495118c1";
const client = require("twilio")(accountSid, authToken);

client.outgoingCallerIds
  .list({ phoneNumber: "+639453727506", limit: 20 })
  .then((outgoingCallerIds) =>
    outgoingCallerIds.forEach((o) => console.log(o.sid))
  );
