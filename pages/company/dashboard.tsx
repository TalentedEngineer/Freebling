import React, { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import SideBar from "../../components/SideBar";
import WinnersList from "../../components/WinnersList";
import Image from "next/legacy/image";
import CampaignsList from "../../components/CampaignsList";
import arrow_icon from "../../public/assets/images/viewAll_arrow_icon.svg";
import { useUserData } from "../../context/userDataHook";
import Loader from "../../components/loader";
import { toast } from "react-hot-toast";
import {
  collection,
  DocumentData,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import NoCampaign from "../../components/NoCampaign";
import { useTour } from "@reactour/tour";
import { businessTutorial } from "../../components/Tutorials/Tutorials";
import router from "next/router";
import MainLayout from "../../components/Layouts/MainLayout";

export default function dashboard() {
  const { userData } = useUserData();
  const { setSteps, setIsOpen } = useTour();
  const [loading, setLoading] = useState(false);
  const [giveaways, setGiveaways] = useState<DocumentData[]>([]);
  const [winners, setWinners] = useState<DocumentData[]>([]);

  // add a loader until it gets the userData
  useEffect(() => {
    setLoading(!loading);
    // add redirection to users dashboard if userType == user
    if (userData?.userType === "user") {
      toast.error("You do not have access. Redirecting to users Dashboard");
      window.location.href = "/users/dashboard";
    }
  }, [userData]);

  useEffect(() => {
    // console.log(userData?.uid)
    setLoading(true);
    if (userData?.uid === undefined) return;
    getGiveaways();
    localStorage.setItem("user", JSON.stringify(userData));
  }, [userData]);

  const launchTutorial = () => {
    if (userData && userData?.isNew === true) {
      setSteps?.(businessTutorial);
      setIsOpen(true);
    }
  };

  useEffect(() => {
    launchTutorial();
  }, [userData]);

  const getGiveaways = async () => {
    const q = query(
      collection(db, "giveaway"),
      where("user_uid", "==", userData?.uid)
    );
    const querySnapshot = await getDocs(q);
    const temp = querySnapshot.docs.map((doc) => doc.data());
    // just give me winner from temp.winner
    const winners = temp.filter((winner: any) => {
      return winner?.winners?.length > 0;
    });
    // filter out data with winners.winner[i] and winnners.endDate only and push it to winnerList
    const wList = winners.map((winner: any) => ({
      winners: winner?.winners,
      endDate : winner?.endDate,
      title : winner?.title,
    }));
    // now if winnerList.winner has more that one elements in array break it into another element
    const extract = wList.map((winner: any) => {
      if (winner?.winners?.length > 1) {
        const temp = winner?.winners.map((item: any) => ({
          winners: [item],
          endDate : winner?.endDate,
          title: winner?.title
        }));
        return temp;
      } else {
        return winner;
      }
    });
    // now flatten the array
    const winnerList = extract.flat(1);
    // now update winnerList
    setWinners(winnerList);
    const liveEvents = temp.filter((item: any) => {
      const endDate = new Date(item?.endDate);
      const startDate = new Date(item?.startDate);
      const today = new Date();
      const ended = endDate.getTime() - today.getTime();
      const endingInDays = Math.floor(ended / (1000 * 60 * 60 * 24));
      const starting = startDate.getTime() - today.getTime();
      return item && endingInDays >= 0 && starting <= 0;
    });
    setLoading(false);
    //console.log(temp)
    setGiveaways(liveEvents);
  };

  return (
    <MainLayout>
      <ProtectedRoute>
        <Loader show={loading}></Loader>
        <>
          {/* TOP TITLE */}
          <div className="flex flex-col space-y-20 lg:space-y-0 lg:flex-row mx-auto max-w-6xl">
            <div className="w-full lg:border-r lg:border-jade-100 lg:w-[56%] lg:pr-12">
              <div className="flex items-center justify-between mb-6">
                {/* TITLE */}
                <h2 className="w-1/2 text-xl font-familyMedium">
                  Current Giveaways
                </h2>

                {/* BUTTON */}
                <button
                  onClick={() => {
                    router.push("/company/profile");
                  }}
                  className="flex items-center justify-center group"
                >
                  <span className="text-sm leading-5 uppercase mr-2.5">
                    View all
                  </span>
                  <Image src={arrow_icon} alt="arrow_icon" layout="intrinsic" />
                </button>
              </div>

              {/* ITEM LIST */}
              <div className="space-y-8">
                {giveaways.length > 0 ? (
                  giveaways.map((giveaway, index) => (
                    <CampaignsList key={index} data={giveaway} />
                  ))
                ) : (
                  <NoCampaign />
                )}
              </div>
            </div>

            <div className="w-full lg:w-[44%] lg:pl-12">
              {/* TOP TITLE */}
              <div className="flex items-center justify-between mb-6 lg:px-8">
                {/* TITLE */}
                <h3 className="w-1/2 text-xl font-familyMedium">Ended Giveaways</h3>

                {/* BUTTON */}
                <button
                  onClick={() => {
                    router.push("/company/followers");
                  }}
                  className="flex items-center justify-center"
                >
                  <span className="text-sm leading-5 uppercase mr-2.5">
                    View all
                  </span>
                  <Image src={arrow_icon} alt="arrow_icon" layout="intrinsic" />
                </button>
              </div>

              <div className="space-y-6">
                {winners.length > 0 ? (
                  winners.map((winner, index) => (
                    <WinnersList key={index} data={winner} />
                  ))
                ) : (
                  <div className="flex justify-center">
                    <p className="text-lg font-familyMedium">No winners yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      </ProtectedRoute>
    </MainLayout>
  );
}
