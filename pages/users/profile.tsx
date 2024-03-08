import React, { useEffect, useReducer, useRef, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authcontext";
import { useUserData } from "../../context/userDataHook";
import MetaMaskLogo from "../../components/MetaMaskLogo";
import Loader from "../../components/loader";
import Image from "next/image";
import google_icon from "../../public/assets/images/google_icon.svg";
import facebook_icon from "../../public/assets/images/facebook_icon.svg";
import {
  AtSymbolIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { ArrowLongRightIcon, BellAlertIcon, DocumentDuplicateIcon, IdentificationIcon, LinkIcon, LockClosedIcon, UserCircleIcon, WalletIcon } from "@heroicons/react/24/solid";
import SideBar from "../../components/SideBar";
import NavbarMobile from "../../components/NavbarMobile";
import { auth, db, storage } from "../../firebase";
import { sendEmailVerification } from "firebase/auth";
import { useForm } from "react-hook-form";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import ImageCropper from "../../components/ImageCopper";
import { handleNotification } from "../../firebaseUtils";
import MainLayout from "../../components/Layouts/MainLayout";

import { useAccount, useConnect, useSignMessage } from "wagmi";
import { disconnect } from '@wagmi/core';
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

export default function userProfile() {
  const { connectAsync } = useConnect();
  const { isConnected } = useAccount();

  const { userData, updateUserData, metamaskUserData } = useUserData();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser;
  const [editPersonalInfo, setEditPersonalInfo] = useState(false);
  const [securityInfo, setSecurityInfo] = useState(false);
  const [wallets, setWalletData] = useState(false);
  const methods = useForm<any>({ mode: "onBlur" });
  const [address, setAddress] = useState<any | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = methods;
  const [selectedImage, setSelectedImage] = useState<any | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageToPost, setImageToPost] = useState<any | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [profilePercentage, setProfilePercentage] = useState(90);
  const [imageLoading, setImageLoading] = useState(false);
  const [croppedImage, setCroppedImage] = useState<any | null | undefined>();
  const userParse = localStorage.getItem("user") || "";
  const [notificationValue, setNotificationValue] = useState(false);
  const derivedNotificationValue = notificationValue
    ? notificationValue
    : userData?.notifications || false;

  let users: any
  if (userParse) {
    users = JSON.parse(userParse)
  }

  useEffect(() => {
  }, [])

  useEffect(() => {
    if (userData === undefined) {
      setLoading(true);
    } else {
      setLoading(false);
    }
    // add redirection to users dashboard if userType == user
    if (userData?.userType === "company") {
      toast.error("You do not have access. Redirecting to users Dashboard");
      window.location.href = "/users/dashboard";
    }
    setLoading(false);
    setAddress(userData?.metamask)
    setAddress(users?.metamask)
  }, [userData]);

  useEffect(() => {
    if (users === undefined) {
      setLoading(true);
    } else {
      setLoading(false);
    }
    // add redirection to users dashboard if userType == user
    if (users?.userType === "company") {
      toast.error("You do not have access. Redirecting to users Dashboard");
      window.location.href = "/users/dashboard";
    }
    setLoading(false);
  }, [users]);

  // set selectedImage to the current user image
  useEffect(() => {
    if (userData?.imgUrl) {
      setSelectedImage(userData?.imgUrl);
    }
    // check userData?.notification to see if the user has verified their email
    if (
      userData?.notifications ||
      userData?.emailNotifications ||
      userData?.smsNotifications
    ) {
      setValue("notifications", userData?.notifications || false);
      // setNotificationValue(userData?.notifications || false);
      setValue("emailNotifications", userData?.emailNotifications || false);
      setValue("smsNotifications", userData?.smsNotifications || false);
    }
    console.log(userData)

  }, [userData]);

  useEffect(() => {
    if (users?.imgUrl) {
      setSelectedImage(users?.imgUrl);
    }
    // check userData?.notification to see if the user has verified their email
    if (
      users?.notifications ||
      users?.emailNotifications ||
      users?.smsNotifications
    ) {
      setValue("notifications", users?.notifications || false);
      // setNotificationValue(users?.notifications || false);
      setValue("emailNotifications", users?.emailNotifications || false);
      setValue("smsNotifications", users?.smsNotifications || false);
    }
    console.log(users)
  }, [users]);

  // send email verification link to the current user
  const sendEmail = () => {
    if (currentUser && !currentUser.emailVerified) {
      sendEmailVerification(currentUser).then(() => {
        toast.success("Verification email sent");
      });
    }
  };

  const handleClick = (event: any) => {
    // 👉️ ref could be null here
    if (inputRef.current != null) {
      inputRef.current.click();
    }
  };

  const imageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      // check image size
      if (file.size > 10000000) {
        toast.error("Image size should be less than 1MB");
        return;
      }
      // check image type
      if (
        file.type !== "image/png" &&
        file.type !== "image/jpg" &&
        file.type !== "image/jpeg"
      ) {
        toast.error("Image type should be png, jpg or jpeg");
        return;
      }
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        URL.revokeObjectURL(img.src);
        const aspectRatio = width / height;
        if (width > 400 || height > 400 || aspectRatio !== 1) {
          toast.error("Please upload an image with a 1:1 aspect ratio.");
          setCroppedImage(file);
          setImageLoading(true);
          return;
        } else {
          setSelectedImage(URL.createObjectURL(file));
          setImageChanged(true);
          setImageToPost(file);
        }
      };
    }
  };

  // handle crop image
  const handleCrop = (image: any) => {
    const croppedImageFile = new File(
      [image],
      Math.random().toString(36).substring(2, 15) + ".png"
    );
    setSelectedImage(URL.createObjectURL(croppedImageFile));
    setImageChanged(true);
    setImageToPost(croppedImageFile);
    setCroppedImage(null);
    setImageLoading(false);
    setImageChanged(true);
    //handleClose();
  };
  // handle close crop image
  const handleClose = () => {
    setCroppedImage(null);
    setImageLoading(false);
    setSelectedImage(userData?.imgUrl);
    setImageChanged(false);
  };

  // if selectedImage is not undefined then upload the image
  useEffect(() => {
    if (imageChanged) {
      uploadPhoto();
    }
  }, [imageChanged]);

  // upload the photo
  async function uploadPhoto() {
    if (imageToPost) {
      const storageRef = ref(storage, `/files/${imageToPost.name}`); // progress can be paused and resumed. It also exposes progress updates. // Receives the storage reference and the file to upload.
      const uploadTask = uploadBytesResumable(storageRef, imageToPost);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          setLoading(true);
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          ); // update progress
        },
        (err) => {
          toast.error(err.message);
        },
        () => {
          // download url
          getDownloadURL(uploadTask.snapshot.ref).then(async (url) => {
            setImageToPost(url);
            setValue("imgUrl", await url);
            setSelectedImage(url);
            setImageChanged(false);
            setLoading(false);
            // save this url to users collection
            // find a user in users table whose id is equal to userData?.id
            if (userData?.uid) {
              const qry = query(
                collection(db, "users"),
                where("uid", "==", userData?.uid)
              );
              const querySnapshot = await getDocs(qry);
              const temp = querySnapshot.docs.map((doc) => {
                return doc.ref.id;
              });

              // get the ref of the doc where is equal to userData.uid
              const ref = doc(db, "users", temp[0]);
              // update the doc
              const tempData = {
                imgUrl: url,
              };
              // update ref
              try {
                await updateDoc(ref, tempData);
                setLoading(false);
                toast.success("Profile Updated");
                reset();
              } catch (e: any) {
                setLoading(false);
                toast.error(e);
              }
            }
          });
        }
      );
    }
  }

  const removeSelectedImage = () => {
    setSelectedImage(undefined);
    setImageToPost(undefined);
  };

  const onSubmit = async () => {
    setLoading(true);
    // log the values of all form fields
    const multipleValues = getValues();
    // update the user data
    // find a user in users table whose id is equal to userData?.id
    if (userData?.uid) {
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
      const ref = doc(db, "users", temp[0]);
      // update the doc
      const tempData = {
        ...multipleValues,
      };
      // update ref
      try {
        await updateDoc(ref, tempData);
        toast.success("Profile Updated");
        updateUserData();
        reset();
        setLoading(false);
      } catch (e: any) {
        setLoading(false);
        toast.error(e);
      }
    }
  };

  // set EditPersonal info to !editPersonalinfo and also set value for respective form values
  const enabledEditPersonalInfo = () => {
    setEditPersonalInfo(!editPersonalInfo);
    if (userData) {
      setValue("name", userData?.name || "");
      setValue("email", userData?.email || "");
      setValue("state", userData?.state || "");
      setValue("country", userData?.country || "");
      setValue("dateOfBirth", userData?.dateOfBirth || "");
      setValue("firstName", userData?.firstName || "");
      setValue("lastName", userData?.lastName || "");
    }
  };

  // set securityInfo too
  const enabledEditSecurityInfo = () => {
    setSecurityInfo(!securityInfo);
    if (userData) {
      setValue("phoneNo", userData?.phoneNo || "");
      setValue("twoFa", userData?.twoFa || "");
      setValue("securityQuestion1", userData?.securityQuestion1 || "");
      setValue("securityQuestion2", userData?.securityQuestion2 || "");
      setValue("answerQuestion1", userData?.answerQuestion1 || "");
      setValue("answerQuestion2", userData?.answerQuestion2 || "");
    }
  };

  // setWallets to real values
  const enabledEditWallets = () => {
    setWalletData(!wallets);
    if (userData) {
      setValue("erc20", userData?.erc20);
      setValue("bnb", userData?.bnb);
    }
  };

  // watch formValues.notification , emailNotifications and smsNotifications if they updated , update them in Database
  // const notifications = watch("notifications");
  const emailNotifications = watch("emailNotifications");
  const smsNotifications = watch("smsNotifications");

  useEffect(() => {
    // only updates once if values changes
    if (
      // notifications != userData?.notifications ||
      emailNotifications != userData?.emailNotifications ||
      smsNotifications != userData?.smsNotifications
    ) {
      updateNotification();
    }
    // }, [notifications, emailNotifications, smsNotifications]);
  }, [emailNotifications, smsNotifications]);

  const updateNotification = async () => {
    // if (notifications || emailNotifications || smsNotifications) {
    if (emailNotifications || smsNotifications) {
      // update the user data
      // find a user in users table whose id is equal to userData?.id
      if (userData?.uid) {
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
        const ref = doc(db, "users", temp[0]);
        // update the doc
        const tempData = {
          // notifications,
          emailNotifications,
          smsNotifications,
        };
        // update ref
        try {
          await updateDoc(ref, tempData);
          toast.success("Notifications  Settings Updated");
          updateUserData();
          reset();
          setLoading(false);
        } catch (e: any) {
          setLoading(false);
          toast.error(e);
        }
      }
    }
  };

  const handleNotificationChange = async ({
    target: { checked },
  }: React.ChangeEvent<HTMLInputElement>) => {
    console.log(userData);

    const payload = {
      notification: checked,
      user,
    };
    try {
      setLoading(true);
      const data = await handleNotification(payload);
      if (data && !data?.hasError) {
        toast.success(data?.msg);
        updateUserData();
        reset();
        setLoading(false);
        setNotificationValue(checked);
      } else {
        toast.error(data.msg);
        setLoading(false);
        setNotificationValue(checked);
      }
    } catch (error: any) {
      console.log(error);

      // toast.error(error);
      setLoading(false);
      setNotificationValue(checked);
    }
  };

  const handleDisconnect = async () => {
    if (isConnected) {
      await disconnect()
    }
    setAddress('')

    setLoading(true);
    if (userData?.uid) {
      const qry = query(
        collection(db, 'users'),
        where("uid", "==", userData?.uid)
      );
      const querySnapshot = await getDocs(qry);
      const temp = querySnapshot.docs.map((doc) => {
        return doc.ref.id;
      });

      // get the ref of the doc where is equal to userData.uid
      const ref = doc(db, "users", temp[0]);
      const tempData = {
        metamask: '',
      };
      // update ref
      try {
        await updateDoc(ref, tempData);
        setLoading(false);
        updateUserData();
        toast.success("Unconnected with Metamask");
        reset();
      } catch (e: any) {
        setLoading(false);
        toast.error(e)
      }
    }
  }

  const handleConnect = async () => {
    if (isConnected) {
      await disconnect()
    }
    const { account, chain } = await connectAsync({
      connector: new MetaMaskConnector(),
    });

    setAddress(account)

    setLoading(true);
    if (userData?.uid) {
      const qry = query(
        collection(db, 'users'),
        where("uid", "==", userData?.uid)
      );
      const querySnapshot = await getDocs(qry);
      const temp = querySnapshot.docs.map((doc) => {
        return doc.ref.id;
      });

      // get the ref of the doc where is equal to userData.uid
      const ref = doc(db, "users", temp[0]);
      const tempData = {
        metamask: account
      }

      // update ref
      try {
        await updateDoc(ref, tempData);
        updateUserData();
        setLoading(false);
        toast.success("Connected with Metamask");
        reset();
      } catch (e: any) {
        setLoading(false);
        toast.error(e)
      }
    }
    console.log(account)
  }

  function truncateAddress(address: string) {
    return address.slice(0,5) + '...' + address.slice(-5);  
  }


  // truncate email addresses 	
  let addressE = "linkedEmailAccount@gmail.com";
  function truncateAddressE(address: string) {
    return addressE.slice(0, 5) + '...' + addressE.slice(-10);
  }

  return (
    <MainLayout>
      <ProtectedRoute>
        <Loader show={loading}></Loader>
        {/* profile top */}
        <div className="flex flex-row w-full items-center max-w-6xl mx-auto">
          <div className="flex flex-col flex-1 items-center md:flex md:flex-row md:space-x-10">
            {selectedImage && (
              <>
                <div className="relative flex flex-col items-center">
                  <Image className="rounded-full"
                    src={selectedImage}
                    alt="User profile photo"
                    width={192}
                    height={192}
                  />
                  {/* add an xmark.png on the right upcorner with respect to above image */}

                  <div>
                    <div className="cursor-pointer absolute top-0 right-0">
                      <Image
                        src="/assets/images/xmark.png"
                        className="object-none object-right-top"
                        width={16}
                        height={16}
                        onClick={removeSelectedImage}
                        alt="Giveaeway featured image"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            {croppedImage && imageLoading && (
              <div>
                <ImageCropper
                  src={URL.createObjectURL(croppedImage)}
                  maxWidth={400}
                  maxHeight={400}
                  onCrop={handleCrop}
                />
                <button onClick={handleClose}>Cancel</button>
              </div>
            )}
            {!selectedImage && !croppedImage && (
              <>
                <div className="flex flex-col items-center border rounded-md justify-centre">
                  <div className="border rounded-md cursor-pointer">
                    <Image
                      src="/assets/images/camera.svg"
                      width={64}
                      height={64}
                      onClick={handleClick}
                      alt="Giveaeway featured image"
                    />
                    <input
                      type="file"
                      id="file"
                      ref={inputRef}
                      onChange={imageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col w-full">
              <div className="flex flex-col md:flex-row items-start justify-between py-2 text-white/60 font-medium text-sm md:text-xl space-y-5 md:space-y-0">
                <div className="">
                  <h3 className="text-xl font-Ubuntu-Bold text-white w-full md:text-2xl lg:w-auto">
                    {currentUser?.displayName || userData?.name}
                  </h3>{" "}
                  {currentUser?.email}
                </div>
                {/* TODO:Add a Formula of completeness of Profile */}
                <div className="flex text-xl font-familySemibold text-teal-900 md:text-[48px] lg:w-auto text-center">
                  <span className="block font-Ubuntu-Regular text-base md:text-lg mr-3 text-white/60">
                    Profile completeness:
                  </span>
                  {profilePercentage} %
                </div>
              </div>
              <div className="flex flex-col relative md:flex-row items-center">
                <div className="border-[2px] border-teal-900/20 relative h-[20px] md:h-[44px] w-full rounded-full p-1 mt-1">
                  <div className="rounded-full absolute top-0 left-0 flex h-full w-[90%] items-center justify-center text-sm font-semibold text-white bg-gradient-to-r from-[#139BAD]/40 to-[#139BAD]">
                    {profilePercentage}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* account information */}
        <div className="my-10 space-y-10 md:flex-row max-w-6xl mx-auto">
          {/* information & email */}
          <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:space-x-12">
            <div className="card p-6 md:p-9">
              <h2 className="h2 flex">
                <div className="w-6 h-6 mr-4">
                  <InformationCircleIcon />
                </div>{" "}
                Add account information
              </h2>
              <p className="text-base text-white/60">
                In order to prevent future issue, please add your account
                details like phone number, backup email and answer on some
                security questions. It won’t take longer than 10 minutes, we
                promise!
              </p>
              <button className="flex items-center mt-5 group">
                <span className=" text-sm leading-[22.4px] uppercase mr-2.5 group-hover:text-yellow-400">
                  Finish Setup
                </span>
                <div className="w-5 group-hover:text-yellow-400">
                  <ArrowLongRightIcon />
                </div>
              </button>
            </div>
            {!currentUser?.emailVerified && (
              <div className="card p-6 md:p-9">
                <h2 className="h2 flex">
                  <div className="w-6 h-6 mr-4">
                    <AtSymbolIcon />
                  </div>{" "}
                  Confirm your email address
                </h2>
                <p className="text-base text-white/60">
                  We need to verify your email address in order to validate your
                  account. After email verification you will have full access to
                  all the available features on the platform.
                </p>
                <button
                  onClick={sendEmail}
                  className="flex items-center mt-5 group"
                >
                  <span className=" text-sm leading-[22.4px] uppercase mr-2.5 group-hover:text-yellow-400">
                    Verify Email Address
                  </span>
                  <div className="w-5 group-hover:text-yellow-400">
                    <ArrowLongRightIcon />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* additional info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="userInfoCol">
              <h2 className="h2 flex items-center">
                <IdentificationIcon className="w-5 h-5 text-teal-300 mr-2" /> Personal information
              </h2>
              {!editPersonalInfo && (
                <>
                  {/* name of user */}
                  <p>{userData?.name}</p>
                  <p>{userData?.firstName}</p>
                  <p>{userData?.lastName}</p>

                  {/* state and country of user  */}
                  <p>
                    {userData?.state}, {userData?.country}
                  </p>
                  {/* email of user */}
                  <p>{userData?.email}</p>
                  {/* date of birth of user */}
                  <p>{userData?.dateOfBirth}</p>
                  <button
                    onClick={enabledEditPersonalInfo}
                    className="flex items-center mt-5 group"
                  >
                    <span className=" text-sm leading-[22.4px] uppercase mr-2.5 group-hover:text-yellow-400">
                      Edit
                    </span>
                    <div className="w-5 group-hover:text-yellow-400">
                      <ArrowLongRightIcon />
                    </div>
                  </button>
                </>
              )}
              {editPersonalInfo && (
                <>
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-2">
                      <input
                        type="text"
                        className="inputField"
                        placeholder="Username"
                        {...register("name", {
                          required: "Username is required",
                        })}
                      />
                      <input
                        type="text"
                        className="inputField"
                        placeholder="First Name"
                        {...register("firstName", {
                          required: "First Name is required",
                        })}
                      />
                      <input
                        type="text"
                        className="inputField"
                        placeholder="Last Name"
                        {...register("lastName", {
                          required: "Last Name is required",
                        })}
                      />
                      <input
                        type="text"
                        className="inputField"
                        placeholder="Email"
                        {...register("email", {
                          required: "Email is required",
                        })}
                      />
                      <input
                        type="text"
                        className="inputField"
                        placeholder="Country"
                        {...register("country", {
                          required: "Country is required",
                        })}
                      />
                      <input
                        type="text"
                        className="inputField"
                        placeholder="State"
                        {...register("state", {
                          required: "State is required",
                        })}
                      />
                      <input
                        type="date"
                        className="inputField"
                        placeholder="Date of birth"
                        {...register("dateOfBirth", {
                          required: "Date of birth is required",
                        })}
                      />
                      <button
                        onClick={() => {
                          setEditPersonalInfo(!editPersonalInfo);
                          onSubmit();
                        }}
                        className="buttonSecondary"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* row 1  */}
            <div className="userInfoCol">
              <h2 className="h2 flex items-center">
                <LockClosedIcon className="w-5 h-5 text-teal-300 mr-2" /> Security Info
              </h2>
              {!securityInfo && (
                <>
                  {/* Phone No */}
                  <p>{userData?.phoneNo}</p>
                  {/* 2FA set enabled if twoFa is true else disabled*/}
                  <p>2FA : {userData?.twoFa ? "Enabled" : "Disabled"}</p>
                  {/* Security questions enabled or disabled show enabled if secuirtyQuestion1 and securityQuestion2 has some answers
                   */}
                  <p>
                    Security Questions :{" "}
                    {userData?.securityQuestion1 && userData?.securityQuestion2
                      ? "Enabled"
                      : "Disabled"}
                  </p>
                  <button
                    onClick={enabledEditSecurityInfo}
                    className="flex items-center mt-5 group"
                  >
                    <span className=" text-sm leading-[22.4px] uppercase mr-2.5 group-hover:text-yellow-400">
                      Edit
                    </span>
                    <div className="w-5 group-hover:text-yellow-400">
                      <ArrowLongRightIcon />
                    </div>
                  </button>
                </>
              )}
              {securityInfo && (
                <>
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-2">
                      {/* labe for 2fa and then add checkbox */}
                      <div className="flex items-center">
                        <span className="mr-3">2FA Auth </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            value={watch("twoFa") === "on" ? "off" : "on"}
                            className="sr-only peer"
                            {...register("twoFa", {
                              required: "2FA is required",
                            })}
                          />
                          <div className="w-11 h-6 bg-fbblack-200 after:bg-teal-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gradient-to-r after:from-teal-100 after:to-teal-100/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-900/10"></div>
                        </label>
                      </div>
                      <input
                        type="text"
                        className="inputField"
                        placeholder="Phone No"
                        {...register("phoneNo", {
                          required: "Phone No is required",
                        })}
                      />
                      <div className="flex items-center">
                        <span className="mr-3">Security Questions </span>
                      </div>
                      {/* Add a drop down of questions */}
                      <select
                        className="inputField mb-2 "
                        {...register("securityQuestion1", {
                          required: "Security Question 1 is required",
                        })}
                      >
                        <option
                          className="text-black"
                          value="What is your favorite color?"
                        >
                          What is your favorite color?
                        </option>
                        <option
                          className="text-black"
                          value="What is your favorite food?"
                        >
                          What is your favorite food?
                        </option>
                        <option
                          className="text-black"
                          value="What is your favorite movie?"
                        >
                          What is your favorite movie?
                        </option>
                        <option
                          className="text-black"
                          value="What is your favorite book?"
                        >
                          What is your favorite book?
                        </option>
                        <option
                          className="text-black"
                          value="What is your favorite song?"
                        >
                          What is your favorite song?
                        </option>
                        <option
                          className="text-black"
                          value="What is your favorite sport?"
                        >
                          What is your favorite sport?
                        </option>
                      </select>
                      <input
                        // disabled if securityQuestions value is false
                        type="text"
                        className="inputField"
                        placeholder="Answer Security Question 1"
                        {...register("answerQuestion1", {
                          required: "Security Question 1 is required",
                        })}
                      />
                      <select
                        className="inputField mb-2 "
                        {...register("securityQuestion2", {
                          required: "Security Question 2 is required",
                        })}
                      >
                        <option
                          className="text-black"
                          value="What is your favorite color?"
                        >
                          What is your favorite color?
                        </option>
                        <option
                          className="text-black"
                          value="What is your favorite food?"
                        >
                          What is your favorite food?
                        </option>
                        <option
                          className="text-black"
                          value="What is your favorite movie?"
                        >
                          What is your favorite movie?
                        </option>
                        <option
                          className="text-black"
                          value="What is your favorite book?"
                        >
                          What is your favorite book?
                        </option>
                        <option
                          className="text-black"
                          value="What is your favorite song?"
                        >
                          What is your favorite song?
                        </option>
                        <option
                          className="text-black"
                          value="What is your favorite sport?"
                        >
                          What is your favorite sport?
                        </option>
                      </select>
                      <input
                        type="text"
                        className="inputField"
                        placeholder="Answer Security Question 2"
                        {...register("answerQuestion2", {
                          required: "Security Question 2 is required",
                        })}
                      />
                      <button
                        onClick={() => {
                          setSecurityInfo(!securityInfo);
                          onSubmit();
                        }}
                        className="buttonSecondary"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* row 2  */}
            <div className="userInfoCol">
              <h2 className="h2 flex items-center">
                <BellAlertIcon className="w-5 h-5 text-teal-300 mr-2" /> Notifications
              </h2>
              <div className="space-y-6">
                <div className="flex items-center">
                  <span className="mr-3">Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      // {...register("notifications")}
                      checked={derivedNotificationValue}
                      onChange={handleNotificationChange}
                    />
                    <div className="w-11 h-6 bg-fbblack-200 after:bg-teal-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gradient-to-r after:from-teal-100 after:to-teal-100/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-900/10"></div>
                  </label>
                </div>
                <div className="flex items-center">
                  <span className="mr-3">Email notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    {/* When checked or unchecked update this entry in firestore in real time i.e. emailNotifications ? true: false */}
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register("emailNotifications")}
                    />

                    <div className="w-11 h-6 bg-fbblack-200 after:bg-teal-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gradient-to-r after:from-teal-100 after:to-teal-100/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-900/10"></div>
                  </label>
                </div>

                <div className="flex items-center">
                  <span className="mr-3">SMS notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register("smsNotifications")}
                    />
                    <div className="w-11 h-6 bg-fbblack-200 after:bg-teal-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gradient-to-r after:from-teal-100 after:to-teal-100/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-900/10"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="userInfoCol">
              <h2 className="h2 flex items-center">
                <LinkIcon className="w-5 h-5 text-teal-300 mr-2" /> Linked Accounts
              </h2>
              {!wallets && (
                <>
                  <h3 className="h3 flex items-center">
                    <WalletIcon className="w-5 h-5 text-teal-300 mr-2" /> Wallets
                  </h3>
                  {/* <p className="text-white/60 mb-5">
                    Add your wallet addresses to receive your rewards
                  </p> */}
                  {/* Make it inline with label but goes to another line when small screen
                  */}
                  {/* MetaMask Connected State  */}
                  <div className="linkedItem">
                    <div className="flex flex-row text-white items-center justify-between">
                      <MetaMaskLogo />
                      <span className="hidden md:block md:ml-2">MetaMask</span>
                    </div>
                    <div className="flex flex-row items-center text-white justify-between space-x-2">
                      {address ? truncateAddress(address) : "Not connected"} <DocumentDuplicateIcon className="cursor-pointer hover:text-fbyellow w-6 h-6" />
                    </div>
                    {address ? <button className="buttonPrimary bg-coral-100 px-3 md:px-8" onClick={handleDisconnect}>Disconnect</button> : <button className="buttonPrimary px-3 md:px-8" onClick={handleConnect}>Connect </button>}
                  </div>
                  <h3 className="h3 flex items-center mt-7">
                    <UserCircleIcon className="w-5 h-5 text-teal-300 mr-2" /> Social Logins
                  </h3>
                  {/* Google  */}
                  <div className="linkedItem">
                    <div className="flex flex-row text-white items-center justify-between">
                      <Image className="relative z-10" src={facebook_icon} alt="facebook_icon" layout="intrinsic" />
                      <span className="hidden md:block md:ml-2">Facebook</span>
                    </div>
                    <div className="flex flex-row text-white">
                      {addressE ? truncateAddress(addressE) : "Not connected"} <DocumentDuplicateIcon className="cursor-pointer hover:text-fbyellow w-6 h-6" />
                    </div>
                    <button className="buttonPrimary px-3 md:px-8">Connect </button>
                  </div>
                  {/* Facebook  */}
                  <div className="linkedItem">
                    <div className="flex flex-row text-white items-center justify-between">
                      <Image className="relative z-10" src={google_icon} alt="google_icon" layout="intrinsic" />
                      <span className="hidden md:block md:ml-2">Google</span>
                    </div>
                    <div className="flex flex-row text-white">
                      {addressE ? truncateAddress(addressE) : "Not connected"} <DocumentDuplicateIcon className="cursor-pointer hover:text-fbyellow w-6 h-6" />
                    </div>

                    <button className="buttonPrimary px-3 md:px-8 bg-coral-100">Disconnect </button>
                  </div>

                  {/* Old scope 
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-1">
                      <h3 className="mt-5">ERC-20 Wallet</h3>
                      <p className="truncate">
                        <span className="text-white/60">{userData?.erc20}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-2">
                      <h3 className="mt-5">BNB Wallet</h3>
                      <p>
                        <span className="text-white/60">{userData?.bnb}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={enabledEditWallets}
                    className="flex items-center mt-5 group"
                  >
                    <span className=" text-sm leading-[22.4px] uppercase mr-2.5 group-hover:text-yellow-400">
                      Edit
                    </span>
                    <div className="w-5 group-hover:text-yellow-400">
                      <ArrowLongRightIcon />
                    </div>
                  </button> */}
                </>
              )}
              {wallets && (
                <>
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-2">
                      <input
                        type="text"
                        className="inputField mb-2"
                        placeholder="Enter ERC-20 wallet address"
                        {...register("erc20", {
                          required: "ERC-20 wallet address is required",
                        })}
                      />
                      <input
                        type="text"
                        className="inputField mb-2"
                        placeholder="Enter BNB wallet address"
                        {...register("bnb", {
                          required: "Bnb wallet address is required",
                        })}
                      />
                      <button
                        onClick={() => {
                          setWalletData(!wallets);
                          onSubmit();
                        }}
                        className="flex items-center mt-5 group"
                      >
                        <span className=" text-sm leading-[22.4px] uppercase mr-2.5 group-hover:text-yellow-400">
                          Save
                        </span>
                        <div className="w-5 group-hover:text-yellow-400">
                          <ArrowLongRightIcon />
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </MainLayout>
  );
}