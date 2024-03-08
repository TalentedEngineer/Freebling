import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import twitterClient from "../../utils/twitterClient";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const CALLBACK_URL = process.env.NEXT_PUBLIC_TWITTER_AUTH_URL || "";

  switch (method) {
    case "GET":
      const details = await twitterClient.generateOAuth2AuthLink(CALLBACK_URL, {
        scope: [
          "tweet.read",
          "tweet.write",
          "users.read",
          "offline.access",
          "follows.read",
          "follows.write",
        ],
      });
      res.status(200).json(details);

      break;
    case "POST":
      const { codeVerifier, state, code, sessionState } = req.body;

      if (!codeVerifier || !state || !sessionState || !code) {
        return res
          .status(400)
          .send("You denied the app or your session expired!");
      }
      if (state !== sessionState) {
        return res.status(400).send("Stored tokens didnt match!");
      }

      // Obtain access token

      twitterClient
        .loginWithOAuth2({ code, codeVerifier, redirectUri: CALLBACK_URL })
        .then(
          async ({
            client: loggedClient,
            accessToken,
            refreshToken,
            expiresIn,
          }) => {
            console.log(accessToken, "accessToken");
            const { data: userObject } = await loggedClient.v2.me();
            console.log(userObject);
            return res.status(200).json({
              client: loggedClient,
              accessToken,
              refreshToken,
              expiresIn,
              currentUser: userObject,
            });
          }
        )
        .catch((err) =>
          res
            .status(403)
            .json({ msg: "Invalid verifier or access tokens!", err })
        );
      break;
  }
}