import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { DiscordUser } from "../../utils/discordUtils";
export interface GuildJoinResponse {
  message: string;
  hasError: boolean;
  data: {
    joined_at: string;
    is_pending: boolean;
    user: DiscordUser;
  } | null;
}

const BOT_TOKEN =
  "MTA1ODc2OTg0MDQ2ODQxMDQzOQ.Gy2MWU.ld3ZDBoPk9J59SOXsu2py4CiPf-qg091d8OP1k";
const HTTP_STATUS_NO_CONTENT = 204;
const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId, token, serverId } = req.body;
  const payload = { access_token: token };
  const discord_api_url = `https://discord.com/api/guilds/${serverId}/members/${userId}`;
  const headers = {
    Authorization: `Bot ${BOT_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.put<GuildJoinResponse>(
      discord_api_url,
      payload,
      { headers }
    );
    console.log(response);
    const status = response.status;
    switch (status) {
      case HTTP_STATUS_NO_CONTENT:
        return res.status(HTTP_STATUS_OK).json({
          message: "User is already a member",
          hasError: false,
          data: null,
        });
      case HTTP_STATUS_CREATED:
        return res.json({
          message: "User has joined the server",
          hasError: false,
          data: response.data,
        });
      default:
        return res.status(status).end();
    }
  } catch (error: any) {
    console.error(error);
    return res
      .status(error?.response?.status || HTTP_STATUS_INTERNAL_SERVER_ERROR)
      .send({
        hasError: true,
        message: error?.response?.data?.message || error,
        // "An error occurred. try again later or Your Are owner of the server",
        data: null,
      });
  }
}