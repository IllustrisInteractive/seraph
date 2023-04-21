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

  const { uid, number, code } = req.query;

  if (!code) {
    client.verify.v2
      .services("VAde3fbf204d74750321fc7b2169e8010a")
      .verifications.create({ to: `+63${number}`, channel: "sms" })
      .then((verification: any) =>
        res.status(200).json({ status: verification.status })
      );
  } else {
    client.verify.v2
      .services("VAde3fbf204d74750321fc7b2169e8010a")
      .verificationChecks.create({ to: `+63${number}`, code: `${code}` })
      .then((verification_check) =>
        res.status(200).json({ status: verification_check.status })
      );
  }
}
