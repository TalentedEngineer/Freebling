import { NextApiRequest, NextApiResponse } from "next";
import twitter from "../../utils/twitterMethods";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { method } = req.body;
    switch (method) {
      case "userInfo": {
        const { username, token } = req.body;
        const userName = await twitter.getUserID(token, username);
        res.status(200).json(userName);
        break;
      }
      case "refreshToken": {
        const { refreshToken, token } = req.body;
        const userName = await twitter.getRefreshToken(refreshToken, token);
        res.status(200).json(userName);
        break;
      }
      case "tweet": {
        const { status, token } = req.body;
        console.log(token, "tweet");
        const createdTweet = await twitter.tweet(status, token);
        res.status(201).json(createdTweet);
        break;
      }
      case "retweet": {
        console.log("inside retweet");

        const { loggedUserId, tweetId, token } = req.body;
        const reTweet = await twitter.retweet(loggedUserId, tweetId, token);
        res.status(200).json(reTweet);
        break;
      }
      case "followUser": {
        const { loggedUserId, userId, token } = req.body;
        const followedUser = await twitter.followUser(
          loggedUserId,
          userId,
          token
        );
        res.status(200).json(followedUser);
        break;
      }
      case "isFollowing": {
        const { userId, token } = req.body;
        const followedUser = await twitter.isFollowingUser(token, userId);
        res.status(200).json(followedUser);
        break;
      }
      default:
        res.setHeader("Allow", ["POST", "PUT", "PATCH"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    debugger;
    console.error(error);
    res.status(500).json({ error });
  }
}