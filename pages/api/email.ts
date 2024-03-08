import { NextApiRequest, NextApiResponse } from "next";
import sgMail from "@sendgrid/mail";

export default async function email(req: NextApiRequest, res: NextApiResponse) {
  const { to, from, subject, text, html } = req.body;
  try {
    sgMail.setApiKey(process.env.NEXT_PUBLIC_SENDGRID_API_KEY!);
    const msg: sgMail.MailDataRequired = {
      to,
      from,
      subject,
      text,
      html,
    };

    // Make the SendGrid API request
    await sgMail.send(msg);

    // Return a success message
    res
      .status(200)
      .json({ message: "Email sent successfully", status: "success" });
  } catch (error: any) {
    const err: {
      code: number;
      message: string;
      response: {
        headers: { [key: string]: string };
        body: { errors: { message: string; field: string }[] };
      };
    } = error;
    console.log(error);

    if (err.response) {
      console.error(err.response.body);
    }

    // Return an error message
    res.status(500).json({
      message: "Error sending email",
      error: err.response.body.errors[0].message,
      status: "error",
    });
  }
}