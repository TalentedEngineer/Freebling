import React, { useEffect } from "react";
import PreviewData from "../../../../components/PreviewData";
import { useAuth } from "../../../../context/authcontext";

export default function index() {
    const {data } = useAuth();

    // console.log(data) when it changes
    useEffect(() => {
        console.log(data);
    },[data])   

  return (
    <>
      <PreviewData data={data}/>
    </>
  );
}
