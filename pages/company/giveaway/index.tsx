import React, { useEffect, useState } from "react";
import Image from "next/legacy/image";
import arrow_icon from "../../../public/assets/images/arrow_icon.svg";
import giveaway_art from "../../../public/assets/images/giveaway_img2.png";
import { useAuth } from "../../../context/authcontext";
import {
  collection,
  DocumentData,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useUserData } from "../../../context/userDataHook";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Loader from "../../../components/loader";
import SideBar from "../../../components/SideBar";
import TemplateItem from "../../../components/TemplateItem";
import NavbarMobile from "../../../components/NavbarMobile";
import MainLayout from "../../../components/Layouts/MainLayout";
import { PlusCircleIcon } from "@heroicons/react/24/solid";

export default function index() {
  const { userData } = useUserData();
  const { user, setFormValues } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [giveaways, setGiveaways] = useState<DocumentData[]>([]);

  // add a loader until it gets the userData
  useEffect(() => {
    setLoading(!loading);
    // add redirection to users dashboard if userType == user
    if (
      userData?.userType === "user" &&
      userData?.userType !== undefined &&
      userData?.userType !== null &&
      user?.uid !== undefined &&
      user?.uid !== null
    ) {
      toast.error("You do not have access. Redirecting to users Dashboard");
      window.location.href = "/users/dashboard";
    }
  }, [userData]);

  // fetch data from firestore
  useEffect(() => {
    const getGiveaways = async () => {
      const q = query(
        collection(db, "giveaway"),
        where("user_uid", "==", user?.uid),
        where("template", "==", true),
      );
      const querySnapshot = await getDocs(q);
      const temp = querySnapshot.docs.map((doc) => {
        return doc.data();
      });

      setGiveaways(temp);
      setFormValues("submitted");
    };
    userData && getGiveaways();
  }, [userData]);

  const goToNew = () => {
    router.push("/company/giveaway/add");
  };

  return (
    <MainLayout>
      <ProtectedRoute>
        <Loader show={loading}></Loader>
        <div className="mx-auto max-w-6xl">
          <div className="rowSection">
            <div className="flex items-center justify-between mb-6">
              {/* TITLE */}
              <h2 className="flex space-x-3 items-center text-xl font-Ubuntu-Medium">
                  <PlusCircleIcon className="w-6 h-6 text-teal-600"/> 
                  <span>Create a Giveaway</span>
                </h2>

              {/* BUTTON */}
              <div className="flex items-center">
                <button className="w-14 h-14 rounded-full flex items-center justify-center border-[1.5px] border-jade-100">
                  <Image
                    className="-scale-[1]"
                    src={arrow_icon}
                    alt="arrow_icon"
                    layout="intrinsic"
                  />
                </button>
                <div className="px-5 text-lg">1</div>
                <button className="w-14 h-14 rounded-full flex items-center justify-center border-[1.5px] border-jade-100">
                  <Image
                    src={arrow_icon}
                    alt="arrow_icon"
                    layout="intrinsic"
                  />
                </button>
              </div>
            </div>
            {/* TEMPLATES LIST */}
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 lg:grid-cols-5">
              {/* TEMPLATE BOX */}
              <div className="border-[1.37px] border-jade-100 p-6 rounded-lg md:p-4 lg:p-3.5">
                {/* IMAGE */}
                <div className="w-full h-52 rounded-3sm flex items-center justify-center mb-6 md:mb-4 lg:mb-2.5 ">
                  <Image
                    className="rounded-3sm"
                    src={giveaway_art}
                    alt="giveaway_art"
                    layout="intrinsic"
                    objectFit="cover"
                  />
                </div>

                {/* TITLE */}
                <h5 className="text-base font-Ubuntu-Medium mb-7">
                  Start from scratch
                </h5>

                {/* BUTTON */}
                <button
                  onClick={goToNew}
                  className="w-full h-[30px] text-sm leading-[22.4px] border-[0.97px] border-jade-100 rounded-sm transition duration-200 ease-in-out hover:bg-fbblack-200"
                >
                  <span className="opacity-60">Create giveaway</span>
                </button>
              </div>
              {/* TEMPLATE BOX */}
              {/* map giveaways  to template item */}
              {giveaways.map((item, index) => {
                return <TemplateItem key={index} props={item} />;
              })}
            </div>
          </div>
         </div>
      </ProtectedRoute>
    </MainLayout>
  );
}
