import { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';
let serviceAccount = require("../../serviceAccountKey.json");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // getGiveaways
  // handle errors
  try {
    const winners = await winnerSelection();
    res.status(200).json({ message: "These users have been picked as a winner", winners: winners });
  } catch (error) {
    console.error(`Error occurred while picking winners: ${error}`);
    res.status(500).json({ message: 'Error occurred while picking winners.' });
  }
}

function pickWinner(participatedUsers: string | any[], total: any, noOfWinners: number) {
  // If no users participated, return null
  if (!participatedUsers || participatedUsers.length === 0) {
    return null;
  }

  const totalEntries = total;
  const weightedPool = [];

  // Build a weighted pool based on the number of entries
  for (const user of participatedUsers) {
    const userEntries = user.userEntries || 1;
    for (let i = 0; i < userEntries; i++) {
      weightedPool.push(user);
    }
  }

  const winners = [];

  // Randomly select winners from the weighted pool
  while (winners.length < noOfWinners && weightedPool.length > 0) {
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    const winner = weightedPool[randomIndex];
    winners.push(winner);
    if(weightedPool.length > noOfWinners)
    weightedPool.splice(randomIndex, 1); // Remove the winner from the pool
  }
  return winners.length > 0 ? winners : null;
}

const winnerSelection = async () => {
  try {
    const giveawaysRef = admin.firestore().collection('giveaway');
    const usersRef = admin.firestore().collection('users');
    const winners: any[] = [];

    const batch = admin.firestore().batch();

    const giveawaysSnapshot = await giveawaysRef.get();
    //console.log all giveaways in snapshot 
    const usersSnapshot = await usersRef.get();

    const today = admin.firestore.Timestamp.now();

    giveawaysSnapshot?.forEach((giveawayDoc) => {
      const giveaway = giveawayDoc.data();
      const endDate = new Date(giveaway.endDate);
      const ended = endDate.getTime() - today.toDate().getTime();
      const endingInDays = Math.floor(ended / (1000 * 60 * 60 * 24));
      const prizes = giveaway.prize

      // calculate noOfWinners from no of prizes
      let noOfWinners = 0;
      if (prizes && prizes?.length > 0) {
        prizes?.forEach((prize: any) => {
          noOfWinners += prize.noOfWinners
        })
      }

      if (giveaway?.status === 'closed') {
        return;
      }

      if (endingInDays < 0) {

        // console.log("prizeWinners", giveaway?.title, endingInDays, giveaway?.participatedUsers, giveaway?.totalEntries, noOfWinners)

        if (giveaway.participatedUsers?.length > 0 || giveaway?.totalEntries > 0) {
          // console.log("prizeWinners", giveaway?.title, giveaway?.participatedUsers, giveaway?.totalEntries, noOfWinners)
          const winners: any[] = [];

          for (const prize of prizes) {
            const prizeWinners = pickWinner(giveaway?.participatedUsers, giveaway.totalEntries, prize.noOfWinners);
            if(prizeWinners && prizeWinners?.length >0 ){
              //console.log("prizeWinners", giveaway?.title, prizeWinners)
              prizeWinners?.forEach( (winner) => {
                // const user = await usersRef.where("uid", "==", winner.userId).get();
                const user = usersSnapshot.docs.find((doc) => {
                  return doc.data().uid === winner.userId
                });
                if (winner && user) {
                  const userRef = usersRef.doc(user?.ref.id);
                  batch.update(userRef, {
                    giveawaysWon: admin.firestore.FieldValue.arrayUnion(giveaway.uid)
                  });
                  winners.push(winner);
                }
              });
            }
          }

          if (winners.length > 0) {
            batch.update(giveawayDoc.ref, {
              winners: winners,
              status: 'closed',
              closedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log("New winners",winners)
          }
          else {
            console.log();
          }
        }
      }
    });
    await batch.commit();
    return winners;
  } catch (error) {
    console.error(`Error occurred while processing giveaways: ${error}`);
    throw new Error('Unable to process giveaways.');
  }
}
// Path: pages\api\pickwinner.ts
