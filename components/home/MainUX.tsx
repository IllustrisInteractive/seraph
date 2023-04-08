import { FunctionComponent, useEffect, useState } from "react";
import { UserModel } from "../../core/model/User";
import { easeInOut, motion } from "framer-motion";
import { Geocoder } from "../../core/maps/geocoding";
import { NextRouter, useRouter } from "next/router";
import {
  FirestoreQueryController,
  FirestoreSubscriptionController,
  PostQuery,
} from "../../core/firebase/Firestore";

interface props {
  user: UserModel;
}

export const MainUX: FunctionComponent<props> = (props) => {
  const [coordinates, setCoordinates] = useState<[number, number]>();
  const [location, setLocation] = useState();
  const [feedController, setController] =
    useState<FirestoreSubscriptionController>();

  let geocoder = new Geocoder("AIzaSyA9cJAWTnuOvfK3w_S22YKTkgVYTTbhfzw");
  let queryController: FirestoreQueryController;
  let router = useRouter();

  useEffect(() => {
    queryController = new FirestoreQueryController();
    setController(queryController.fetch_subscribe(new PostQuery("posts")));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        setCoordinates([
          props.user.defaultLocation![0],
          props.user.defaultLocation![1],
        ]);
      }
    );
  }, []);

  useEffect(() => {
    if (coordinates) {
      geocoder.geocodeToAddress(
        coordinates,
        (result) => {
          setLocation(result["data"]["results"][0]["formatted_address"]);
        },
        () => {}
      );
    }
  }, [coordinates]);
  return (
    <motion.div
      className="flex flex-col h-screen bg-gray-200"
      transition={{ delayChildren: 0.5, duration: 0.5, ease: easeInOut }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key="main_ux"
    >
      <motion.div
        className="px-16 py-4 bg-gray-100 grid grid-cols-6 items-center gap-x-4"
        initial={{ y: "-5vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <p className="font-bold col-span-1 text-xl">SERAPH</p>
        <div className="bg-gray-400 py-2 px-4 col-span-3 rounded-lg shadow-inner text-white">
          Search
        </div>
        <div className="col-span-2 flex flex-row">
          <div className="grow" />
          <div className="">{props.user.getFullName()}</div>
        </div>
      </motion.div>
      <motion.div className="px-16 py-4 grow grid grid-cols-6 gap-x-4">
        <motion.div
          className="col-span-1"
          initial={{ x: "-10vw", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: easeInOut }}
        >
          <div className="bg-white font-bold text-2xl space-y-4 rounded-lg px-4 py-2 flex flex-col">
            <div>Home</div>
            <div>Live Map</div>
            <div>Notifications</div>
            <div>Settings</div>
          </div>
          <div className="flex flex-col mt-4">
            <p className="text-xs">Your current location</p>
            <p className="text-lg leading-tight font-bold">{location}</p>
            <button
              className="text-sm text-gray-400 text-left"
              onClick={() => {
                setCoordinates([
                  props.user.defaultLocation![0],
                  props.user.defaultLocation![1],
                ]);
              }}
            >
              Switch to default location
            </button>
          </div>
        </motion.div>
        <div className="col-span-3">Hi</div>
        <div className="col-span-2">
          <div className="h-1/2 w-full rounded-lg bg-white relative overflow-hidden shadow-inner">
            <div className="absolute bottom-0 bg-gradient-to-t from-gray-700 to-transparent h-1/6 p-4 text-white font-light w-full">
              There are <span className="font-bold">0</span> reports in your
              area
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MainUX;
