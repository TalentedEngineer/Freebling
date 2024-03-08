import { NextApiRequest, NextApiResponse } from "next";
import { Context, Telegraf } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";
import { firebaseAdminDb } from "../../firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const bot = new Telegraf(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ?? "");

// Keep track of users who have sent the correct referral ID
const userIdsMap = new Map<number, boolean>();

const findReferalIdsUserByReferralId = async (key: string) => {
  const usersRef = firebaseAdminDb.collection("users");
  const querySnapshot = await usersRef
    .where(`referralIds.${key}`, "==", false)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const userDoc = querySnapshot.docs[0];
  return userDoc.data().referralIds;
};

const updateReferralId = async (key: string) => {
  try {
    const usersRef = firebaseAdminDb.collection("users");
    const querySnapshot = await usersRef
      .where(`referralIds.${key}`, "==", false)
      .get();

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      await userDoc.ref.update({
        [`referralIds.${key}`]: true,
      });
    } else {
      console.log("No user found with referral key", key);
    }
  } catch (error) {
    console.log("updating error", error);
  }
};

const updateEntries = async (key: string) => {
  try {
    const usersRef = firebaseAdminDb.collection("users");
    const giveawayRef = firebaseAdminDb.collection("giveaway");

    const querySnapshotUser = await usersRef
      .where(`referralIds.${key}`, "==", true)
      .get();
    const querySnapshotGiveaway = await giveawayRef
      .where(`referralIds.${key}`, "==", false)
      .get();

    if (!querySnapshotUser.empty && !querySnapshotGiveaway.empty) {
      const userDocId = querySnapshotUser.docs[0].id;
      const userDocRef = usersRef.doc(userDocId);

      const giveawayDocId = querySnapshotGiveaway.docs[0].id;
      const giveawayDocRef = await giveawayRef.doc(giveawayDocId).get();

      const giveaway = giveawayDocRef.data();
      const numberOfEntries = giveaway?.tasks.filter(
        (task: any) => task.title === "Follow on Telegram"
      )[0]?.noOfEntries;

      await usersRef.doc(userDocId).update({
        participatedGiveaways: FieldValue.arrayUnion({
          taskTitle: "Follow on Telegram",
          noOfEntries: numberOfEntries,
          giveawayId: giveawayDocId,
        }),
      });
      console.log("update user", (await userDocRef.get()).data());

      const currentUser = (await userDocRef.get()).data();
      console.log({ currentUser });
      const userEntries = Array.isArray(giveaway?.participatedUsers)
        ? giveaway?.participatedUsers.length &&
          giveaway?.participatedUsers.length > 0
          ? giveaway?.participatedUsers.filter(
              (user: any) => user.userId === currentUser?.uid
            )[0]?.userEntries
          : undefined
        : undefined;

      await giveawayRef.doc(giveawayDocId).update({
        totalEntries: FieldValue.increment(Number(numberOfEntries)),
        participatedUsers: FieldValue.arrayUnion({
          userId: currentUser?.uid,
          name: currentUser?.name,
          email: currentUser?.email,
          userEntries: userEntries || 0 + numberOfEntries,
        }),
      });
      console.log("update giveaway", giveawayDocRef.data());
    } else {
      console.log("user not found");
    }
  } catch (error) {
    console.log("error while updating entries", error);
  }
};

bot.on("new_chat_members", (context: Context) => {
  const newMembers =
    (context.message as Message.NewChatMembersMessage).new_chat_members || [];
  const welcomMessage = `Welcome ${newMembers
    .map((member) => member.first_name)
    .join(", ")}`;
  context.reply(welcomMessage);
  context.reply("What is your referral id?");

  // Add user id to referral ID map with initial value of false
  newMembers.forEach((member) => {
    userIdsMap.set(member.id, false);
  });
});

bot.hears(/^.+$/, async (context: Context) => {
  const text = (context.message as Message.TextMessage).text;
  const userId = context.from?.id;
  const chatId = context.chat?.id;

  if (context.chat?.type === "private") {
    return;
  }

  if (!userId) {
    return;
  }

  if (chatId) {
    const chatMember = await context.telegram.getChatMember(chatId, userId);
    if (
      chatMember.status === "administrator" ||
      chatMember.status === "creator"
    ) {
      return;
    }
  }

  const hasSentCorrectReferralId = userIdsMap.get(userId) ?? false;

  if (new RegExp(/^\/join\/(.+)$/).test(text)) {
    const referralId = text.split("/join/")[1].trim();
    const referralIds = await findReferalIdsUserByReferralId(referralId);
    if (referralIds) {
      const len = Object.values(referralIds).length;
      if (len > 0 && referralIds[referralId] === false) {
        userIdsMap.set(userId, true);
        await updateReferralId(referralId);
        await updateEntries(referralId);
        context.reply("Thank you");
      } else {
        context.reply("Please enter the referral id with /join");
      }
    }
  } else if (!hasSentCorrectReferralId) {
    const referralIds = await findReferalIdsUserByReferralId(text);
    console.log({ referralIds });
    if (referralIds) {
      const len = Object.values(referralIds).length;
      if (len > 0 && referralIds[text] === false) {
        userIdsMap.set(userId, true);
        await updateReferralId(text);
        await updateEntries(text);
        context.reply("Thank you");
      } else {
        context.reply("Please enter the referral id");
      }
    }
  }
});

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await bot.handleUpdate(req.body);
  res.status(200).json({ ok: true });
};