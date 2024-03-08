import React, { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useUserData } from '../../context/userDataHook';
import Loader from '../../components/loader';
import { toast } from 'react-hot-toast';
import { collection, DocumentData, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import CardLiveEvent from '../../components/CardLiveEvent';
import CardPreviousEvent from '../../components/CardPreviousEvent';
import MainLayout from '../../components/Layouts/MainLayout';
import { ArrowLongRightIcon, TrophyIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import WinnersCard from '../../components/WinnersCard';


export default function favorites() {
  const { userData } = useUserData();
  const [loading, setLoading] = useState(false);
  const [giveaways, setGiveaways] = useState<DocumentData[]>([]);
  const [participatedGiveaways , setParticipatedGiveaways] = useState<DocumentData[]>([]);
  const [liveEvents, setLiveEvents] = useState<DocumentData[]>([]);
  const [previousEvents, setPreviousEvents] = useState<DocumentData[]>([]);
  const [followed, setFollowed] = useState<any>();
  // add a loader until it gets the userData
  useEffect(() => {
    // setLoading(!loading)
    // add redirection to users dashboard if userType == user
    if (userData && userData?.userType === "company") {
      toast.error("You do not have access. Redirecting to users Dashboard");
      window.location.href = "/company/dashboard";
    }
  }, [userData])

  useEffect(() => {
    // setLoading(true);
    if (userData?.uid !== undefined) {
      getGiveaways();
      setFollowed(userData?.following)
      localStorage.setItem("user", JSON.stringify(userData));
    }
  }, [userData?.uid]);
  const getGiveaways = async () => {
    const q = query(
      collection(db, "giveaway"),
    );
    const querySnapshot = await getDocs(q);
    const temp = querySnapshot.docs.map((doc) => doc.data());
    // find giveaways that has participcatedUsers.uid === userData.uid
    const participatedGiveaways = filterParticipatedGiveaways(userData?.uid, temp);
    setParticipatedGiveaways(participatedGiveaways);
    // find giveaways that has endDate > now
    const liveEvents = participatedGiveaways.filter((giveaway: any) => new Date(giveaway.endDate) > new Date());
    setLiveEvents(liveEvents);
    // find giveaways that has endDate < now
    const previousEvents = participatedGiveaways.filter((giveaway: any) => giveaway.status === 'closed');
    setPreviousEvents(previousEvents);
    setLoading(false)
    //console.log(temp)
    setGiveaways(temp);
  };
  function filterParticipatedGiveaways(userID: any, giveaways: any[]): any[] {
    return giveaways.filter(giveaway =>
      giveaway.participatedUsers?.some((user: any) => user.userId === userID || user.userID === userID)
    );
  }
  return (
    <MainLayout>
      <ProtectedRoute>
        <Loader show={loading}></Loader>
        {userData?.userType === "user" && (
          <div className="mx-auto max-w-6xl">
            {/* TOP TITLE */}
            <div className="flex items-center space-x-3 mb-6">
              <UserGroupIcon className="w-5 h-5 text-teal-300" />
              <h1 className="h1">My Dashboard</h1>
            </div>

            {/* Live and Following  */}
            <div className="flex flex-col space-y-10 lg:space-y-0 lg:flex-row md:space-x-12">
              <div className="w-full md:w-3/5 lg:border-r-[1.5px] lg:border-jade-100/40 md:pr-12">
                <div className="mb-6">
                  {/* TITLE */}
                  <h2 className="text-xl font-Ubuntu-Medium">Live Entered Events</h2>
                  {/* Card item list */}
                  <div className="my-6 space-y-8">
                    {/* Map liveEvents to cardLiveEvents  */}
                    {liveEvents.map((giveaway: any, index) => (
                      <CardLiveEvent
                        key={index}
                        giveaway={giveaway}
                        ></CardLiveEvent>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/5 pt-10 md:pt-0 border-t-[1.5px] border-jade-100/40 md:border-t-0">
                {/* TOP TITLE */}
                <div className="flex items-center justify-between mb-6">
                  {/* TITLE */}
                  <h3 className="text-xl font-Ubuntu-Medium">Following</h3>
                </div>

                <div className="space-y-6 mb-10">
                  {/* Map previous items*/}
                  {followed?.map((id: any, index: any) => (
                    <CardPreviousEvent
                      key={index}
                      companyId={id}
                    ></CardPreviousEvent>
                  ))}
                </div>
              </div>
            </div>

            {/* Ended and Won */}
            <div className="flex flex-col space-y-20 pt-10 border-t-[1.5px] border-jade-100/40 lg:space-y-0 lg:flex-row md:space-x-12">
              <div className="w-full">
                <div className="mb-5">
                  {/* TITLE */}
                  <h2 className="text-xl font-Ubuntu-Medium">Events History</h2>
                  {/* Card item list */}
                  {/* // Map previousEvents to WinnersCard */}
                  {
                    previousEvents.map((giveaway: any, index) => (
                      giveaway?.winners?.length > 0 && 
                      <WinnersCard
                        key={index}
                        giveaway={giveaway}
                      ></WinnersCard>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </ProtectedRoute>
    </MainLayout>
  )
}
