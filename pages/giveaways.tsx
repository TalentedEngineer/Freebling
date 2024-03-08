import {
  collection,
  DocumentData,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import CardGiveaway from "../components/CardGiveaway";
import Loader from "../components/loader";
import ProtectedRoute from "../components/ProtectedRoute";
import TopCompanies from "../components/TopCompanies";
import { useUserData } from "../context/userDataHook";
import { db } from "../firebase";
import { useTour } from "@reactour/tour";
import {
  customerTutorialWithGiveaway,
  customerTutorialWithoutGiveaway,
} from "../components/Tutorials/Tutorials";
import { useAuth } from "../context/authcontext";
import MainLayout from "../components/Layouts/MainLayout";
import { CheckBadgeIcon, FireIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";


export default function dashboard() {
  const { user } = useAuth();
  const { userData } = useUserData();
  const { setSteps, setIsOpen } = useTour();
  const [loading, setLoading] = useState(false);
  const [giveaways, setGiveaways] = useState<DocumentData[]>([]);
  const [featuredCompanies, setFeaturesCompanies] = useState<DocumentData[]>([]);

  useEffect(() => {
    // console.log(userData?.uid)
      setLoading(true);
      getGiveaways();
      getCompaniesData();
    
  }, []);

  const launchTutorial = () => {
    if (userData && userData?.isNew === true) {
      if (giveaways && giveaways.length > 0) {
        setSteps?.(customerTutorialWithGiveaway);
      } else {
        setSteps?.(customerTutorialWithoutGiveaway);
      }

      setIsOpen(true);
    }
  };

  useEffect(() => {
    launchTutorial();
  }, [userData]);

  const getGiveaways = async () => {
    const q = query(collection(db, "giveaway"));
    const querySnapshot = await getDocs(q)
    const temp = querySnapshot.docs.map((doc) => doc.data());
    const liveEvents = temp.filter((item: any) => {
      const endDate = new Date(item?.endDate);
      const startDate = new Date(item?.startDate);
      const today = new Date();
      const ended = endDate.getTime() - today.getTime();
      const endingInDays = Math.floor(ended / (1000 * 60 * 60 * 24));
      const starting = startDate.getTime() - today.getTime();
      return item && endingInDays >= 0 && starting <= 0;
    });
    // filter out the ones that not drafts , where drafts == false
    const notDrafts = liveEvents.filter((item: any) => {
      return item.draft == false;
    });
    setLoading(false);
    setGiveaways(notDrafts);
  };

  const getCompaniesData = async () => {
    const qry = query(
      collection(db, "users"),
      where("userType", "==", "company")
    );
    const ref = await getDocs(qry);
    const temp = ref.docs.map((doc) => doc.data());
    setFeaturesCompanies(temp);
    setLoading(false);
  };

  return (
    <MainLayout>
      <ProtectedRoute>
      {
          loading && (
            <Loader show={loading}></Loader>
          ) 
        }   
        {
          !loading && (
            <div className="mx-auto max-w-6xl">
              {/* TOP TITLE */}
              <div className="rowSection">
                <h2 className="flex space-x-3 items-center text-xl font-Ubuntu-Medium">
                  <CheckBadgeIcon className="w-6 h-6 text-teal-600"/> 
                  <span>Featured Companies</span>
                </h2>
                <div className="relative max-w-7xl">
                  {
                    featuredCompanies.length === 0 && (
                      <div className=" w-full h-full flex justify-center items-center">
                        <p className="text-gray-500">No featured companies</p>
                      </div>
                    )
                  }
                  <TopCompanies companies={featuredCompanies} />
                </div>
              </div>
  
              <div className="rowSection">
                <h2 className="flex space-x-3 items-center text-xl font-Ubuntu-Medium">
                  <FireIcon className="w-6 h-6 text-teal-600"/> 
                  <span>Live Competitions</span>
                </h2>
                {
                  giveaways.length === 0 && (
                    <div className=" w-full h-full flex justify-center items-center">
                      <p className="text-gray-500">No live competitions</p>
                    </div>
                  )
                }
                <div className="grid grid-cols-2 gap-5 md:gap-10 my-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
                  {giveaways.map((giveaway, index) => (
                    <CardGiveaway key={index} index={index} giveaway={giveaway} status="Live" />
                  ))}
                </div>
              </div>
            </div>
          )
        }   
      </ProtectedRoute>
    </MainLayout>
    );
}