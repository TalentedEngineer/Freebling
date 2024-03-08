import React, { useEffect, useRef, useState } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import SideBar from "../../../components/SideBar";
import toast from "react-hot-toast";
import { SignupType, useUserData } from "../../../context/userDataHook";
import Loader from "../../../components/loader";
import Image from "next/image";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import CardGiveaway from "../../../components/CardGiveaway";
import { db, storage } from "../../../firebase";
import {
  collection,
  doc,
  DocumentData,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useForm } from "react-hook-form";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import ImageCropper from "../../../components/ImageCopper";
import MainLayout from "../../../components/Layouts/MainLayout";

export default function profilePage() {
  const { userData, updateUserData } = useUserData();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [giveaways, setGiveaways] = useState<DocumentData[]>([]);
  const [filteredData, setRefilteredData] = useState<DocumentData[]>([]);
  const methods = useForm<SignupType>({ mode: "onBlur" });
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
  const [imageLoading, setImageLoading] = useState(false);
  const [croppedImage, setCroppedImage] = useState<any | null | undefined>();
  const handleClick = (event: any) => {
    // 👉️ ref could be null here
    if (inputRef.current != null) {
      inputRef.current.click();
    }
  };
  // add a loader until it gets the userData
  useEffect(() => {
    if (userData === undefined) {
      setLoading(true);
    } else {
      setLoading(false);
    }
    // add redirection to users dashboard if userType == user
    if (userData?.userType === "user") {
      toast.error("You do not have access. Redirecting to users Dashboard");
      window.location.href = "/users/dashboard";
    } else {
      setTimeout(() => {
        if (userData) {
          setValue("company_name", userData?.company_name);
          setValue("website", userData?.website);
          setSelectedImage(userData?.imgUrl);
          setImageToPost(userData?.imgUrl);
        }
      }, 1);
    }
  }, [userData]);

  useEffect(() => {
    if (userData?.uid === undefined) return;
    getGiveaways();
  }, [userData?.uid]);

  const getGiveaways = async () => {
    const q = query(
      collection(db, "giveaway"),
      where("user_uid", "==", userData?.uid)
    );
    const querySnapshot = await getDocs(q);
    const temp = querySnapshot.docs.map((doc) => doc.data());
    setLoading(false);
    setGiveaways(temp);
    const liveEvents = temp.filter((item: any) => {
      const endDate = new Date(item?.endDate);
      const startDate = new Date(item?.startDate);
      const today = new Date();
      const ended = endDate.getTime() - today.getTime();
      const endingInDays = Math.floor(ended / (1000 * 60 * 60 * 24));
      const starting = startDate.getTime() - today.getTime();
      return item && endingInDays >= 0 && starting <= 0;
    });
    setRefilteredData(liveEvents);
  };

  const handleTabChange = (index: number) => {
    setTabIndex(index);
    if (index === 0) {
      // filter data by live events whose endDate is greater than zero and start data is not tomorrow
      const liveEvents = giveaways.filter((item: any) => {
        const endDate = new Date(item?.endDate);
        const startDate = new Date(item?.startDate);
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
          toast.error(
            "Please upload an image with a 1:1 aspect ratio."
          );
          setCroppedImage(file);
          setImageLoading(true);
          return;
        } else {
          setSelectedImage(file);
          setImageChanged(true);
          setImageToPost(URL.createObjectURL(file));
        }
      };
    }
  };
  // handle crop image
  const handleCrop = (image: any) => {
    const croppedImageFile = new File([image], Math.random().toString(36).substring(2, 15)+".png");
    setSelectedImage(croppedImageFile);
    setImageChanged(true);
    setImageToPost(URL.createObjectURL(croppedImageFile));
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
    setImageToPost(userData?.imgUrl);
  };
  useEffect(() => {
    if (imageChanged) {
      uploadPhoto();
    }
  }, [imageChanged]);

  // upload the photo
  async function uploadPhoto() {
    if (selectedImage) {
      const storageRef = ref(storage, `/files/${selectedImage.name}`); // progress can be paused and resumed. It also exposes progress updates. // Receives the storage reference and the file to upload.
      const uploadTask = uploadBytesResumable(storageRef, selectedImage);
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
            setSelectedImage(url);
            setLoading(false);
            setImageChanged(false);
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
                toast.success("Profile Image Is Updated");
                reset();
                updateUserData();
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
        // update state after getting response
        updateUserData();

        toast.success("Profile Updated");
        reset();
        setLoading(false);
      } catch (e: any) {
        toast.error(e);
        setLoading(false);
      }
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <ProtectedRoute>
        <Loader show={loading}></Loader>
          <div className="mx-auto max-w-6xl">
            {/* profile top */}
            <div className="flex flex-row w-full items-center">
              <div className="flex flex-col flex-1 items-center md:flex md:flex-row md:space-x-10">
                <div className="relative flex flex-col items-center justify-center w-full max-w-[192px] py-5 space-y-2">
                  {selectedImage && (
                    <>
                      <Image className="rounded-full"
                        src={imageToPost}
                        alt="company profile or logo"
                        width={192}
                        height={192}
                      />

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
                      {/* add an xmark.png on the right with respect to above image */}
                      <div className="border rounded-md cursor-pointer absolute flex-col justify-center">
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
                    </>
                  )}
                </div>

                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between py-2 text-white/60 font-medium text-sm md:text-xl">
                    {!editMode && (
                      <div className="">
                        <h3 className="text-xl font-Ubuntu-Bold text-white w-full md:text-2xl lg:w-auto">
                          {userData?.company_name || "Company Name"}
                        </h3>{" "}
                        {userData?.website || "Website"}
                      </div>
                    )}
                    {editMode && (
                      <div className="flex flex-col w-full py-1">
                        <input
                          type="text"
                          className="inputField"
                          placeholder="Company Name"
                          {...register("company_name", {
                            required: "Company Name is required",
                          })}
                        />
                        <input
                          type="text"
                          className="inputField"
                          placeholder="Website"
                          {...register("website", {
                            required: "Website is required",
                          })}
                        />
                      </div>
                    )}
                    <div className="text-xl font-Ubuntu-Bold text-teal-900 md:text-[48px] lg:w-auto text-center">
                      {userData?.followers?.length || 0}
                      <span className="block font-Ubuntu-Regular text-base md:text-lg text-white/60 mt-3">
                        Followers
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-center space-y-5 md:space-y-0 md:space-x-8">
                    {!editMode && (
                      <button
                        onClick={() => {
                          setEditMode(!editMode);
                        }}
                        className="buttonPrimary m-0 py-1 w-full md:max-w-[200px]"
                      >
                        Edit
                      </button>
                    )}
                    {editMode && (
                      <button
                        type="submit"
                        onClick={() => {
                          setEditMode(!editMode);
                          onSubmit();
                        }}
                        className="buttonPrimary m-0 py-1 w-full md:max-w-[200px]"
                      >
                        Save
                      </button>
                    )}
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
                    <CardGiveaway key={index} giveaway={giveaway} status="Live"/>
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
    </ProtectedRoute>
  </MainLayout>
  );
}
