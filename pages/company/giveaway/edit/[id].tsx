import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../context/authcontext';
import { collection, doc, DocumentData, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase';
import toast from 'react-hot-toast';
import Loader from '../../../../components/loader';
import { useUserData } from '../../../../context/userDataHook';
import New from '../../../../components/new';


export default function Edit() {
    const router = useRouter()
    const id = router.query.id
    const { userData } = useUserData();
    const { user, setFormValues, data } = useAuth();
    const [loading, setLoading] = useState(false);
    const [draft, setDraft] = useState<DocumentData[]>([]);



    useEffect(() => {
        // add redirection to users dashboard if userType == user
        if (userData?.userType === "user" && userData?.userType !== undefined && userData?.userType !== null && user?.uid !== undefined && user?.uid !== null) {
            toast.error("You do not have access. Redirecting to users Dashboard");
            window.location.href = "/users/dashboard";
        }
    }, [userData]);

    //fetch data from firestore where documentID is equal to id 
    useEffect(() => {
        const getGiveaways = async () => {
            setLoading(true)
            const q = query(
                collection(db, "giveaway"),
                where("uid", "==", id),
            );
            const querySnapshot = await getDocs(q);
            const temp = querySnapshot.docs.map((doc) => {
                return doc.data()
            });
            setDraft(temp);
            if(temp[0].user_uid !== userData?.uid){
                toast.error("You do not have access to edit this. Redirecting to company Dashboard");
                window.location.href = "/company/dashboard";
                return
            }
            else{
                setFormValues(temp[0]);
                setLoading(false);
            }            
        };
        if(userData)
        getGiveaways();
    }, [id,userData]);

    return (
        <>
            <Loader show={loading}></Loader>
            {
                !loading && (
                    <New />
                )
            }
        </>
    )
}
