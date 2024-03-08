import { addDoc, collection } from "firebase/firestore";
import router, { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/authcontext";
import { useUserData } from "../../../context/userDataHook";
import { db } from "../../../firebase";
import New from "../../../components/new";

export default function add() {
  const [loading, setLoading] = useState(false);
  const { userData } = useUserData();
  const router = useRouter();

  useEffect(() => {
    setLoading(!loading);
    // add redirection to users dashboard if userType == user
    if (userData?.userType === "user") {
      toast.error("Access denied. Redirecting to your dashboard");
      window.location.href = "/users/dashboard";
    }
  }, [userData]);


  return (
    <div>
      <New />
    </div>
  );
}
