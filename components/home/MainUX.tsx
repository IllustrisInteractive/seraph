import { Auth, User, signOut } from "firebase/auth";
import { NextPage } from "next";
import { ScriptProps } from "next/script";
import { FunctionComponent, useEffect, useState } from "react";
import { easeInOut, motion } from "framer-motion";
import Image from "next/image";
import { MdSearch } from "react-icons/md";
import { RiArrowDropDownLine } from "react-icons/ri";
import { FirebaseApp, getApp } from "firebase/app";
import { doc, getFirestore } from "firebase/firestore";
import { useDocumentOnce } from "react-firebase-hooks/firestore/";

interface UserProps {
  user: User;
  auth: Auth;
  app: FirebaseApp;
}

const MainUX: FunctionComponent<UserProps> = (props) => {
  const [ux, setUX] = useState(false);
  const [profile, setProfile] = useState(false);
  const [overlay, setOverlay] = useState(0);
  const [phone, setPhone] = useState(true);
  const [snapshot, loading, error, reload] = useDocumentOnce(
    doc(getFirestore(props.app), "users", props.user.uid)
  );

  useEffect(() => {
    if (!loading) {
      if (snapshot?.data())
        snapshot?.data()!["phone"] ? setPhone(true) : setPhone(false);
      else setPhone(false);
    }
  }, [snapshot]);
  const showProfile = () => {
    if (!profile) setOverlay(0.1);
    else setOverlay(0);

    setProfile(!profile);
  };
  return (
    <motion.div
      className="w-screen h-screen relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: easeInOut }}
    >
      <div
        className={`w-full h-full top-0 left-0 bg-black ${
          overlay > 0 ? "absolute" : "hidden"
        }`}
        style={{ opacity: overlay }}
        onClick={() => showProfile()}
      />
      <motion.div className="grid grid-cols-5 px-16 h-20 items-center bg-gray-100">
        <div>SERAPH</div>
        <div className="col-span-3 bg-gray-400 px-4 py-2 text-white flex flex-row items-center space-x-4 rounded-lg">
          <MdSearch />
          <input
            type="search"
            className="outline-none text-black bg-gray-400 overflow-hidden grow"
          />
        </div>
        <button
          className={`justify-self-end flex flex-row items-center space-x-4 px-4 py-2 hover:bg-white transition-shadow ${
            profile ? "bg-white drop-shadow-lg relative" : ""
          }`}
          onClick={() => {
            showProfile();
          }}
        >
          <img src={props.user.photoURL!} className="h-8 w-8 rounded-full" />
          <p>{props.user.displayName}</p>
          <RiArrowDropDownLine size={32} />
        </button>
        {profile && (
          <div className="absolute top-20 z-50 right-16 bg-white rounded-lg overflow-hidden flex flex-col">
            <div className="flex flex-row space-x-2 p-4 bg-gray-100">
              <img
                src={props.user.photoURL!}
                className="h-16 w-16 rounded-full"
              />
              <div className="flex flex-col">
                <p className="text-xs">Signed in as</p>
                <p className="font-bold">{props.user.displayName}</p>
                <p className="text-sm">{props.user.email}</p>
              </div>
            </div>
            <div className="flex flex-col space-y-4 py-2">
              <button onClick={() => {}}>Account Settings</button>
              <button
                onClick={async () => {
                  await signOut(props.auth);
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </motion.div>
      <motion.div className="grid grid-cols-5 px-16 py-4">
        <motion.div className=""></motion.div>
        <motion.div className="col-span-3">
          {!phone && (
            <div className="flex flex-col bg-white drop-shadow-lg rounded-lg p-4">
              <p className="font-bold text-2xl">
                You don't have a phone number registered.
              </p>
              <p className="font-light text-md">
                Add a phone number to your account to receive reports via SMS,
                even without opening Seraph.
              </p>
              <div className="flex flex-row items-center text-4xl">
                <div className="border-b-2 mr-4">+63</div>
                <input
                  type="text"
                  placeholder="9123456789"
                  className="outline-none border-b-2 border-transparent"
                />
              </div>
            </div>
          )}
        </motion.div>
        <motion.div className=""></motion.div>
      </motion.div>
    </motion.div>
  );
};

export default MainUX;
