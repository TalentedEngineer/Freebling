import React, { useEffect, useReducer, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import SideBar from "../../components/SideBar";
import toast from "react-hot-toast";
import { useUserData } from "../../context/userDataHook";
import Loader from "../../components/loader";
import Image from "next/image";
import { Tab, TabList } from "react-tabs";
import MainLayout from "../../components/Layouts/MainLayout";
import fetchUserData from "../../utils/getUserData";
// import CsvDownloader from "react-csv-downloader";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";

interface IUsers {
  uid: string;
  name: string;
  email: string;
  country: string;
  state: string;
  participatedGiveaways: string[];
}

export default function followersPage() {
  const { userData } = useUserData();
  const [loading, setLoading] = useState(false);
  const [userDatas, setUserDatas] = useState<any[]>([]);
  const [downloadData, setdownloadData] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState("followers");
  const winners : unknown[] = []
  const filename = "Followers Data";
  const getUserData = async () => {
    setLoading(true);
    if (selectedTab === "followers") {
      userData &&
        fetchUserData(userData.followers)
          .then((response) => {
            setUserDatas(response);
            setLoading(false);
          })
          .catch((error) => {
            console.log(error);
          });
    }
    if (selectedTab === "winners") {
     const win = await getGiveaways();
     winners.push(...win);
     winners &&
     winners?.length > 1 &&
        fetchUserData(winners)
          .then((response) => {
            setUserDatas(response);
            setLoading(false);
          })
          .catch((error) => {
            console.log(error);
          });

    }
    setLoading(false);
  };

  const getGiveaways = async () => {
    const q = query(
      collection(db, "giveaway"),
      where("user_uid", "==", userData?.uid)
    );
    const querySnapshot = await getDocs(q);
    const temp = querySnapshot.docs.map((doc) => doc.data());
     // just give me winner from temp.winner
     const winnersGiveaway = temp.filter((winner: any) => {
      return winner?.winners?.length > 0;
    });
    const winnersObject = {
      winners: winnersGiveaway.flatMap((item) => {
        if (item.winners.length > 1) {
          return item.winners.map((winner: any) => winner.userId);
        } else {
          return [item.winners[0].userId];
        }
      }),
    };
    // push winnerObjects.winner to winners array
    return winnersObject.winners;
  };

  // add a loader until it gets the userData
  useEffect(() => {
    // add redirection to users dashboard if userType == user
    if (userData?.userType === "user") {
      toast.error("You do not have access. Redirecting to users Dashboard");
      window.location.href = "/users/dashboard";
    }
    userData && getUserData();
    if(userDatas){
      const downloadedData = userDatas.map((userData) => {
        return {
          email: userData.email,
          name: userData.name,
          country: userData.country,
          state: userData.state,
        };
      })
      setdownloadData(downloadedData)
    }
  }, [userData, selectedTab, userDatas]);

  

  return (
    <MainLayout>
      <ProtectedRoute>
        <Loader show={loading}></Loader>
        {userData?.userType === "company" && (
          <>
            <div className="mx-auto max-w-6xl">
              <h1 className="h1">Your Followers</h1>
              {/* tabs and filters */}
              <div className="flex flex-col items-center justify-between my-10 space-y-5 md:space-y-0 md:flex-row">
                {/* title top */}
                <TabList className="fbTabList grid_giveaway_tabs hover:bg-jade-900 hover:border-none">
                  <Tab
                    className={`fbTab rounded-sm ${
                      selectedTab === "followers"
                        ? "bg-jade-900 hover:bg-jade-900 hover:border-none"
                        : "hover:bg-jade-900"
                    }`}
                    selectedClassName="bg-jade-900 rounded-[7px]"
                    onClick={() => setSelectedTab("followers")}
                  >
                    All Followers
                  </Tab>
                  <Tab
                    className={`fbTab rounded-sm ${
                      selectedTab === "winners"
                        ? "bg-jade-900 hover:bg-jade-900 hover:border-none"
                        : "hover:bg-jade-900"
                    }`}
                    selectedClassName="bg-jade-900 rounded-[7px]"
                    onClick={() => setSelectedTab("winners")}
                  >
                    Winners
                  </Tab>
                </TabList>
                {/* CSV Downloand button from csv react */}

                {/* <CsvDownloader filename={filename} datas={downloadData}>
                  <button className="buttonTertiary w-full md:w-auto">
                    Download list as CSV
                  </button>
                </CsvDownloader> */}
              </div>

              {/* followers table */}
              <table className="responsiveTable followersTable">
                <thead className="responsiveTableHeader">
                  <tr className="responsiveTableHeaderRow">
                    <th>Name</th>
                    <th>Email</th>
                    <th>Where</th>
                    <th>Activity</th>
                    <th>Total entries</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="responsiveTableBody">
                  {userDatas &&
                    userDatas?.length > 1 &&
                    userDatas?.map((item: IUsers) => (
                      <tr className="responsiveTableBodyRow" key={item?.uid}>
                        <td>{item.name}</td>
                        <td>{item.email}</td>
                        <td>
                          {item.state}, {item.country}
                        </td>
                        <td>
                          {item?.participatedGiveaways?.length
                            ? `${item?.participatedGiveaways?.length} tasks`
                            : ""}
                        </td>
                        <td>{item?.participatedGiveaways?.length}</td>
                        <td>Active</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="flex max-w-[100px] mx-auto py-10 space-x-10">
                <Image
                  src="/assets/images/bizLeftArrow.svg"
                  width={32}
                  height={32}
                  alt="previous page"
                />
                <Image
                  src="/assets/images/bizRightArrow.svg"
                  width={32}
                  height={32}
                  alt="next page"
                />
              </div>
            </div>
          </>
        )}
      </ProtectedRoute>
    </MainLayout>
  );
}
