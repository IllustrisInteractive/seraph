// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getDocs, getFirestore } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { Twilio } from "twilio";

type Data = {
  status: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = new Twilio(accountSid, authToken);

  const { f_name, number, category, post_id } = req.query;

  client.messages
    .create({
      body: `SERAPH Reactive SMS Service\n\nHi ${f_name}, a new ${category} report was posted near your last known location. To view more details about the report visit https://localhost:3000/report/${post_id}.\n\n Stay safe!`,
      from: "+12708175659",
      to: `+63${number}`,
    })
    .then((msg) => {
      res.status(200).json({ status: msg.status });
    });
}

/**+12708175659 */
