import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  DocumentData,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import router from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import Loader from "../../../components/loader";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { db } from "../../../firebase";
import Image from "next/image";
import CardGiveaway from "../../../components/CardGiveaway";
import { useUserData } from "../../../context/userDataHook";
import toast from "react-hot-toast";
import MainLayout from "../../../components/Layouts/MainLayout";

export default function view() {
  const id = router.query.id;
  const [giveaways, setGiveaways] = useState<DocumentData[]>([]);
  const [filteredData, setRefilteredData] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<any | undefined>();
  const [companyData, setUserData] = useState<any>();
  const { userData, updateUserData } = useUserData();
  const [following, setFollowing] = useState<boolean>(false);
  const [noOFFollower, setNoOfFollowers] = useState(0)

  // getUser if there is any id
  useEffect(() => {
    if (id) {
      getUserData();
      getGiveaways();
    }
  }, [id]);
  // check which company user is following if user.following has company.uid set following to true
  useEffect(() => {
    if (userData?.following) {
      const isFollowing = userData?.following?.some((item: any) => item === id);
      if (isFollowing) {
        setFollowing(true);
      }
    }
  }, [userData?.following]);

  // setSelected imaged to userData?.imgUrl
  useEffect(() => {
    if (companyData?.imgUrl) {
      setSelectedImage(companyData?.imgUrl);
    }
    setNoOfFollowers(companyData?.followers?.length)
  }, [companyData?.imgUrl]);
  // getUserData by id from usersCollection

  const getUserData = async () => {
    const qry = query(collection(db, "users"), where("uid", "==", id));
    const ref = await getDocs(qry);
    ref.forEach((doc) => {
      const data = doc.data();
      // console.log(data);
      setUserData(data);
    });
  };

  // getGiveaways by id from giveaways collection
  const getGiveaways = async () => {
    const q = query(collection(db, "giveaway"), where("user_uid", "==", id));
    const querySnapshot = await getDocs(q);
    const temp = querySnapshot.docs.map((doc) => doc.data());
    setLoading(false);
    setGiveaways(temp);
    // set filtered by liveevents as default
    const liveEvents = temp.filter((item: any) => {
      const endDate = new Date(item?.endDate);
      console.log(endDate)
      const startDate = new Date(item?.startDate);
      console.log(startDate)
      const today = new Date();
      const ended = endDate.getTime() - today.getTime();
      const endingInDays = Math.floor(ended / (1000 * 60 * 60 * 24));
      const starting = startDate.getTime() - today.getTime();
      return item && endingInDays >= 0 && starting <= 0;
    });
    // console.log(liveEvents);
    setRefilteredData(liveEvents);
  };

  const handleTabChange = (index: number) => {
    setTabIndex(index);
    if (index === 0) {
      // filter data by live events whose endDate is greater than zero and start data is not tomorrow
      const liveEvents = giveaways.filter((item: any) => {
        const endDate = new Date(item?.endDate);
      console.log(endDate)
      const startDate = new Date(item?.startDate);
      console.log(startDate)
      const today = new Date();
      const ended = endDate.getTime() - today.getTime();
      const endingInDays = Math.floor(ended / (1000 * 60 * 60 * 24));
      const starting = startDate.getTime() - today.getTime();
      return item && endingInDays >= 0 && starting <= 0;
      });
      setRefilteredData(liveEvents);
    }

    if (index === 1) {
      // filter data by upcoming events whose startDate is greater than tomorrow
      const upcomingEvents = giveaways.filter((item: any) => {
        const startDate = item?.startDate;
        const today = new Date();
        const date = new Date(startDate);
        const diff = date.getTime() - today.getTime();
        return item && diff > 360;
      });
      setRefilteredData(upcomingEvents);
    }

    if (index === 2) {
      // filter data by past events whose endDate is less than today
      const pastEvents = giveaways.filter((item: any) => {
        const endDate = item?.endDate;
        const today = new Date();
        const date = new Date(endDate);
        const diff = today.getTime() - date.getTime();
        return item && diff > 0;
      });
      setRefilteredData(pastEvents);
    }
  };

  // add followers to users of if a user follow also add it following list of the user
  const addFollowers = async () => {
    // make a reference of userData
    const qry = query(
      collection(db, "users"),
      where("uid", "==", userData?.uid)
    );
    const querySnapshot = await getDocs(qry);
    const temp = querySnapshot.docs.map((doc) => {
      // console.log doc ref.id
      return doc.ref.id;
    });

    // get the ref of the doc where is equal to userData.uid
    const ref1 = doc(db, "users", temp[0]);
    // make a recreance for companyData
    const qry2 = query(
      collection(db, "users"),
      where("uid", "==", companyData?.uid)
    );

    const querySnapshot2 = await getDocs(qry2);
    const temp2 = querySnapshot2.docs.map((doc) => {
      // console.log doc ref.id
      return doc.ref.id;
    });
    // get the ref of the doc where is equal to companyData.uid
    const ref2 = doc(db, "users", temp2[0]);
    // check the followers and following of both and then update if its not their or remove if its their
    try {
      if (following) {
        // remove the following of the user
        setNoOfFollowers(companyData?.followers?.length -1)
        await updateDoc(ref1, {
          following: arrayRemove(companyData?.uid),
        });
        // update the following of the company
        await updateDoc(ref2, {
          followers: arrayRemove(userData?.uid),
        });
        // update the state of the
        setFollowing(false);
        toast.success("You are no longer following this company");
      } else {
        // add the following of the user
        setNoOfFollowers(companyData?.followers?.length + 1)
        await updateDoc(ref1, {
          following: arrayUnion(companyData?.uid),
        });
        // update the following of the company
        await updateDoc(ref2, {
          followers: arrayUnion(userData?.uid),
        });
        // update the state of the
        setFollowing(true);
        toast.success("You are now following this company");
      }
    } catch (err: any) {
      toast.error(err);
    }
  };

  return (
    <MainLayout>
      <ProtectedRoute>
        <Loader show={loading}></Loader>
        {companyData && (
          <div className="max-w-6xl mx-auto">
            {/* profile top */}
            <div className="flex flex-row w-full items-center">
              <div className="flex flex-col flex-1 it ems-center md:flex md:flex-row md:space-x-10">
                <div className="relative flex flex-col items-center justify-center w-full max-w-[192px] py-5 space-y-2">
                  {selectedImage && (
                    <Image className="rounded-full"
                      src={selectedImage}
                      alt="gift_box_big"
                      width={192}
                      height={192}
                    />
                  )}
                </div>
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between py-2 text-white/60 font-medium text-sm md:text-xl">
                    <div className="">
                      <h3 className="text-xl font-Ubuntu-Bold text-white w-full md:text-2xl lg:w-auto">
                        {companyData?.company_name || "Company Name"}
                      </h3>{" "}
                      {companyData?.website || "Website"}
                    </div>

                    <div className="text-xl font-Ubuntu-Bold text-teal-900 md:text-[48px] lg:w-auto text-center">
                      {noOFFollower }
                      <span className="block font-Ubuntu-Regular text-base md:text-lg text-white/60">
                        Followers
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center space-y-5 md:space-y-0 md:space-x-8">
                    {
                      // if the user is not following the company then show the follow button
                      !following && (
                        <button
                          onClick={addFollowers}
                          className="buttonPrimary m-0 py-1 w-full md:max-w-[200px]"
                        >
                          Follow
                        </button>
                      )
                    }
                    {
                      // if the user is following the company then show the following button
                      following && (
                        <button
                          onClick={addFollowers}
                          className="buttonPrimary m-0 py-1 w-full md:max-w-[200px]"
                        >
                          Following
                        </button>
                      )
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* tabs and filters */}
            <Tabs
              focusTabOnClick={false}
              selectedIndex={tabIndex}
              onSelect={(index) => {
                handleTabChange(index);
              }}
            >
              <div className="flex flex-col items-center justify-between my-10 pt-10 border-t-[1.5px] border-jade-900 space-y-5 md:space-y-0 md:flex-row">
                <TabList className="fbTabList grid_giveaway_tabs ">
                  <Tab
                    className="fbTab rounded-sm hover:bg-jade-900"
                    selectedClassName="bg-jade-900 rounded-[7px]"
                  >
                    Live
                  </Tab>
                  <Tab
                    className="fbTab rounded-sm hover:bg-jade-900"
                    selectedClassName="bg-jade-900 rounded-[7px]"
                  >
                    Upcoming
                  </Tab>
                  <Tab
                    className="fbTab rounded-sm hover:bg-jade-900"
                    selectedClassName="bg-jade-900 rounded-[7px]"
                  >
                    Ended
                  </Tab>
                </TabList>
                {/* <select className="w-full md:max-w-[160px] leading-[20px] text-white border-[1.5px] border-jade-100 rounded-full bg-transparent placeholder:text-black">
                  <option className="text-black" value="endingSoon">
                    Ending soon
                  </option>
                  <option className="text-black" value="sortedEvents">
                    Prize value
                  </option>
                </select> */}
              </div>

              {/* giveaway cards */}
              <TabPanel>
                <div className="w-full grid grid-cols-1 gap-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 my-5">
                  {filteredData.map((giveaway, index) => (
                    <CardGiveaway key={index} giveaway={giveaway} status="Live"  />
                  ))}
                </div>
              </TabPanel>

              <TabPanel>
                <div className="w-full grid grid-cols-1 gap-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 my-5">
                  {filteredData.map((giveaway, index) => (
                    <CardGiveaway key={index} giveaway={giveaway} status="Upcoming" />
                  ))}
                </div>
              </TabPanel>

              <TabPanel>
                <div className="w-full grid grid-cols-1 gap-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 my-5">
                  {filteredData.map((giveaway, index) => (
                    <CardGiveaway key={index} giveaway={giveaway} status="Ended" />
                  ))}
                </div>
              </TabPanel>
            </Tabs>
          </div>
        )}
      </ProtectedRoute>
    </MainLayout>
  );
}
