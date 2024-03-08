import axios, { AxiosResponse } from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "react-responsive-modal";
import {
  TweetV2PostTweetResult,
  TweetV2RetweetResult,
  UserV2FollowResult,
} from "twitter-api-v2";
import { FollowLink, RetweetLink, TweetLink } from "../components/ActionLink";
import "react-responsive-modal/styles.css";

import { Storage } from "../helpers/storage";
import { twitterAuth } from "../utils/twitterAuth";
import TwitterClientMethods from "../utils/twitterClientMethods";
import Loader from "../components/loader";
type Status = "tweet" | "retweet" | "followUser";
export default function Tweet() {
  const [open, setOpen] = useState(false);
  const [tweetData, setTweetData] = useState({});

  const onOpenModal = () => setOpen(true);
  const onCloseModal = () => {
    debugger;
    setOpen(false);
    if (Object.entries(tweetData).length > 0) router.push({ ...tweetData });
  };
  const router = useRouter();
  const {
    code: twitterCode,
    state: twitterState,
    error: errorState,
  } = router.query;

  const code = twitterCode as string;
  const state = twitterState as string;
  const error = errorState as string;
  const giveAwayId = localStorage.getItem("url");

  useEffect(() => {
    if (error) {
      if (error === "access_denied") {
        redirectOnError("You canceled the Auth process");
      }
    }
    if (state) {
      getTwitterToken();
    }
  }, [code, state, error]);

  async function getTwitterToken() {
    const res = await twitterAuth.getTwitterToken(code, state);
    if (res?.status === "success") {
      debugger;
      const twitterData = Storage.getTweetData()!;
      const func = TwitterClientMethods[twitterData?.status]!;
      const data = await func(twitterData.tweetData);
      redirectOnSuccess(twitterData?.status, data.data);
    }
  }

  function returnTweeterFunc(status: Status) {
    switch (status) {
      case "tweet":
        return TwitterClientMethods.tweet;
      case "retweet":
        return TwitterClientMethods.retweet;
      case "followUser":
        return TwitterClientMethods.followUser;
      default:
        break;
    }
  }

  function redirectOnError(error: string) {
    toast.error(error);
    router.push({
      pathname: "/company/giveaway/[id]",
      query: { id: "giveAwayId", tweeterStatus: "twitter-error" },
    });
  }

  function redirectOnSuccess(
    status: Status,
    data:
      | TweetV2PostTweetResult["data"]
      | TweetV2RetweetResult["data"]
      | UserV2FollowResult["data"]
  ) {
    debugger;
    if (status === "retweet") {
      const reTweetData = data as TweetV2RetweetResult["data"];
      if (reTweetData.retweeted) {
        onOpenModal();
      }
    }
    if (status === "tweet") {
      const postTweetData = data as TweetV2PostTweetResult["data"];
      if (postTweetData.id) {
        onOpenModal();
      }
    }
    if (status === "followUser") {
      const followUserData = data as UserV2FollowResult["data"];
      if (followUserData.following) {
        onOpenModal();
      }
    }
    setTweetData({
      pathname: "/company/giveaway/[id]",
      query: {
        id: giveAwayId,
        tweeterStatus: status,
        data: JSON.stringify(data),
      },
    });
    // router.push({
    //   pathname: "/company/giveaway/[id]",
    //   query: {
    //     id: giveAwayId,
    //     tweeterStatus: status,
    //     data: JSON.stringify(data),
    //   },
    // });
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-4">
          <Loader show={true} />
        </div>
      </div>
      {open ? (
        <ModalComp {...{ open, onCloseModal }}>{ReturnTweetLik()}</ModalComp>
      ) : null}
    </>
  );
}

function ModalComp({
  open,
  onCloseModal,
  children,
}: {
  open: boolean;
  onCloseModal: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      classNames={{
        overlay: "popupTasksOverlay",
        modal: "!w-full !p-6 !m-0 md:!max-w-[844px] !bg-transparent",
      }}
      open={open}
      onClose={onCloseModal}
      center
    >
      {children}
    </Modal>
  );
}

function ReturnTweetLik() {
  const twitterData = Storage.getTweetData()!;
  if (twitterData.status === "tweet") {
    const tData = JSON.parse(
      twitterData.tweetData
    ) as TweetV2PostTweetResult["data"];
    const tweet = { id: tData.id, text: tData.text };
    return <TweetLink tweet={tweet} />;
  }
  if (twitterData.status === "retweet") {
    const twitterStorageData = Storage.getTweetData();
    const reTweetedData = JSON.parse(
      twitterData.tweetData
    ) as TweetV2RetweetResult["data"];

    const retweet = {
      tweetId: twitterStorageData?.tweetData!,
      retweeted: reTweetedData.retweeted,
    };
    return <RetweetLink retweet={retweet} />;
  }
  if (twitterData.status === "followUser") {
    const follow = { followedUserId: twitterData.tweetData! };
    return <FollowLink follow={follow} />;
  }
}