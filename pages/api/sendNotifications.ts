import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
type notificationRes = {
  multicast_id: number;
  success: number;
  failure: number;
  canonical_ids: number;
  results: [{ message_id: string }];
};
const key = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { to, notificationPayload } = req.body;
  try {
    const data = await sendNotification(key!, to, notificationPayload);
    res.status(200).json({ message: "Notification sent successfully", data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
const sendNotification = async (key: string, to: string, notification: any) => {
  try {
    const response = await axios.post<notificationRes>(
      "https://fcm.googleapis.com/fcm/send",
      {
        notification,
        to,
      },
      {
        headers: {
          Authorization: "key=" + key,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};