import { useRouter } from "next/router";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Storage } from "../helpers/storage";
import { discordApi } from "../utils/discordAxios";
import {
  getDiscordUserInfo,
  joinDiscordServerGuild,
} from "../utils/discordUtils";
export //const serverId = "1091450658059714660";

const AUTH_ERROR_MSG =
  "Failed to authenticate with Discord. Please try again later.";
const Redirect = () => {
  const router = useRouter();
  const { code: queryCode, error } = router.query;

  const code = queryCode as string;
  const giveAwayId = Storage.getGiveawayId();
  const serverId = Storage.getInviteCode();
  // get only number from serverID
  const serverIdNumber = serverId?.match(/\d+/g)?.join("") || "";
  useEffect(() => {
    if (error) {
      if (error === "access_denied") {
        redirectOnError("you cancel the auth Process.");
      }
    }
    if (code) {
      getDiscordAccessToken(code);
    }
  }, [code, error]);
  //  get Auth Token and userInfo
  async function getDiscordAccessToken(code: string) {
    const payload = {
      client_id: "1058769840468410439",
      client_secret: "lzP1T-XPtklLQ6s1wBjDW7xjEJtCdHGE",
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://app.freebling.io/redirect",
    };
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await discordApi.post<{
        access_token: string;
        expires_in: number;
        refresh_token: string;
        scope: string;
        token_type: string;
      }>("/oauth2/token", formData);

      const accessToken = response.data.access_token;
      if (!accessToken) {
        redirectOnError("Access token not found in response");
      }
      Storage.setDiscordAccessToken(accessToken);
      Storage.setDiscordRefreshToken(response.data.refresh_token);
      const userResponse = await getDiscordUserInfo(accessToken);

      const userData = userResponse?.data;
      if (!userData) {
        redirectOnError("User data not found in response");
      } else {
        Storage.setUserData(JSON.stringify(userData));
        // Join the Discord server
        const res = await joinDiscordServerGuild(
          userData.id,
          accessToken,
          serverIdNumber
        );
        if (!res.hasError) {
          toast.success(res.message);
          router.push({
            pathname: "/company/giveaway/[id]",
            query: { id: giveAwayId, status: "success" },
          });
        } else {
          redirectOnError(res.message);
        }
      }
    } catch (error) {
      console.error(`Error getting Discord access token: ${error}`);
      redirectOnError(AUTH_ERROR_MSG);
    }
  }

  function redirectOnError(error: string) {
    toast.error(error);
    // Storage.clearAll();
    router.push({
      pathname: "/company/giveaway/[id]",
      query: { id: giveAwayId, status: "error" },
    });
  }
  return <h1>Loading...</h1>;
};

export default Redirect;