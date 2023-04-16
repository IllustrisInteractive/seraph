import {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { UserModel } from "../../core/model/User";
import { AnimatePresence, easeInOut, motion } from "framer-motion";
import { Geocoder } from "../../core/maps/geocoding";
import { NextRouter, useRouter } from "next/router";
import {
  FirestoreQueryController,
  FirestoreSubscriptionController,
  PostQuery,
} from "../../core/firebase/Firestore";
import { AuthenticationManager } from "../../core/firebase/Authentication";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

interface props {
  authManager: AuthenticationManager | undefined;
  user: UserModel;
}

export const MainUX: FunctionComponent<props> = (props) => {
  const [newPostModal, setNewPostModal] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number]>();
  const [defaultLocation, setDefault] = useState(false);
  const [ready, setReady] = useState(false);
  const [location, setLocation] = useState();
  const [userPopupState, setUserPopup] = useState(false);

  let geocoder: Geocoder;
  let queryController: FirestoreQueryController;
  let router = useRouter();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyA9cJAWTnuOvfK3w_S22YKTkgVYTTbhfzw",
  });

  const [map, setMap] = useState(null);

  const center = coordinates
    ? {
        lat: coordinates[0],
        lng: coordinates[1],
      }
    : { lat: 0, lng: 0 };

  const onLoad = useCallback(function callback(map: any) {
    // This is just an example of getting and using the map instance!!! don't just blindly copy!
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);

    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: any) {
    setMap(null);
  }, []);

  const userPopup = () => {
    return (
      <motion.div
        initial={{ y: "-10vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "-10vh", opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex flex-col absolute top-8 right-0 bg-white w-56 shadow-lg rounded-lg overflow-hidden"
      >
        <div className="bg-gray-400 w-full h-20 max-h-24 items-center space-x-2 flex flex-row">
          <div className="bg-black h-full w-1/3">
            {/** Profile picture placeholder */}
          </div>
          <div className="flex flex-col text-white pr-2">
            <p className="text-xs font-light">Logged in as</p>
            <p className="font-bold">{props.user.getFullName()}</p>
            <p className="text-xs">
              {props.user.phoneNumber
                ? props.user.phoneNumber
                : "Phone not registered"}
            </p>
          </div>
        </div>
        <div className="flex flex-col space-y-4 px-2 py-2">
          <button className="rounded-lg w-full text-left py-2 px-4 hover:bg-gray-300 transition flex flex-row space-x-2 items-center font-bold">
            <img className="p-1 rounded-full bg-gray-200" src="/user.svg" />
            <p>Your Profile</p>
          </button>
          <button className="rounded-lg w-full text-left py-2 px-4 hover:bg-gray-300 transition flex flex-row space-x-2 items-center font-bold">
            <img className="p-1 rounded-full bg-gray-200" src="/user.svg" />
            <p>Settings</p>
          </button>
          <button className="rounded-lg w-full text-left py-2 px-4 hover:bg-gray-300 transition flex flex-row space-x-2 items-center font-bold">
            <img className="p-1 rounded-full bg-gray-200" src="/user.svg" />
            <p>Feedback & Report</p>
          </button>
          <button
            className="rounded-lg w-full text-left py-2 px-4 hover:bg-gray-300 transition flex flex-row space-x-2 items-center font-bold"
            onClick={() => {
              props.authManager?.signOut();
            }}
          >
            <img className="p-1 rounded-full bg-gray-200" src="/user.svg" />
            <p>Sign out</p>
          </button>
        </div>
      </motion.div>
    );
  };

  const NewPostModal = () => {
    const [category, setCategory] = useState<
      "accident" | "incident" | "hazard" | "crime" | undefined
    >();
    const [postVerified, setPostVerified] = useState(false);
    const [filesSelected, setFiles] = useState<File[]>();
    const fileInput = useRef<HTMLInputElement>(null);

    const handleFileInput = (e: any) => {
      if (filesSelected && filesSelected?.length + e.target.files.length <= 5) {
        let filesSelectedCopy = [...filesSelected];
        filesSelectedCopy.push(...e.target.files);
        setFiles(filesSelectedCopy);
      } else if (!filesSelected) {
        if (e.target.files.length > 5)
          alert(
            "Only a maximum of 5 media content can be uploaded in one report. Please reduce the number of media to upload."
          );
        else setFiles(e.target.files);
      } else {
        alert(
          "Only a maximum of 5 media content can be uploaded in one report. Please reduce the number of media to upload."
        );
      }
    };

    useEffect(() => {
      if (category) setPostVerified(true);
      else setPostVerified(false);
    }, [category]);

    interface MediaContentProps {
      file: File;
    }

    const MediaContent: FunctionComponent<MediaContentProps> = (props) => {
      if (props.file.type.includes("video")) {
        return (
          <video controls>
            <source src={URL.createObjectURL(props.file)} className="h-full" />
          </video>
        );
      } else {
        return (
          <motion.div className="h-36 overflow-hidden rounded-lg py-2 relative flex justify-center items-center group">
            <img
              src={URL.createObjectURL(props.file)}
              className="object-cover rounded-lg"
            />
            <button className="group-hover:block absolute text-white hidden z-50">
              Remove
            </button>
            <div className="bg-transparent opacity-20 group-hover:bg-black absolute h-full w-full z-40"></div>
          </motion.div>
        );
      }
    };

    const CategoryTag = (props: any) => {
      if (props.category == "incident")
        return (
          <motion.div
            layoutId={category}
            className="flex flex-row text-sm font-bold px-4 py-1 w-fit rounded-full bg-orange-400 text-white items-center space-x-2"
          >
            <p>Incident</p>
            <button
              className="text-orange-400 rounded-full bg-white h-4 w-4 flex justify-center items-center"
              onClick={() => {
                setCategory(undefined);
              }}
            >
              x
            </button>
          </motion.div>
        );
      if (props.category == "accident")
        return (
          <motion.div
            layoutId={category}
            className="flex flex-row text-sm font-bold px-4 py-1 w-fit rounded-full bg-orange-400 text-white items-center space-x-2"
          >
            <p>Accident</p>
            <button
              className="text-orange-400 rounded-full bg-white h-4 w-4 flex justify-center items-center"
              onClick={() => {
                setCategory(undefined);
              }}
            >
              x
            </button>
          </motion.div>
        );
      if (props.category == "crime")
        return (
          <motion.div
            layoutId={category}
            className="flex flex-row text-sm font-bold items-center px-4 py-1 space-x-2 w-fit rounded-full bg-red-600 text-white"
          >
            <p>Crime</p>
            <button
              className="text-red-600 rounded-full bg-white h-4 w-4 flex justify-center items-center"
              onClick={() => {
                setCategory(undefined);
              }}
            >
              x
            </button>
          </motion.div>
        );
      if (props.category == "hazard")
        return (
          <motion.div
            layoutId={category}
            className="flex flex-row text-sm font-bold px-4 py-1 w-fit rounded-full bg-orange-400 text-white items-center space-x-2"
          >
            <p>Hazard</p>
            <button
              className="text-orange-400 rounded-full bg-white h-4 w-4 flex justify-center items-center"
              onClick={() => {
                setCategory(undefined);
              }}
            >
              x
            </button>
          </motion.div>
        );
      return null;
    };
    return (
      <motion.div className="h-screen w-screen fixed flex flex-col justify-center items-center z-50">
        <motion.div
          className="bg-white rounded-xl flex flex-col shadow-lg w-1/2 z-50"
          layoutId="newPostModal"
          layout="position"
        >
          <motion.div className="relative flex flex-row justify-center items-center w-full">
            <p className="text-xl font-bold text-center py-4">Create Report</p>
            <button
              onClick={() => {
                setNewPostModal(!newPostModal);
              }}
              className="h-8 w-8 absolute right-8 rounded-full bg-gray-400"
            >
              x
            </button>
          </motion.div>
          <motion.div
            className="text-lg bg-gray-200 flex py-4 px-8 font-bold flex-col"
            layout="position"
            layoutId={category}
          >
            <AnimatePresence>
              {category && <CategoryTag category={category} />}
            </AnimatePresence>
            <motion.div className="flex flex-row">
              <motion.div className="flex flex-col grow">
                <input
                  placeholder="Give your report a title"
                  className="bg-transparent outline-none"
                />
                <input
                  placeholder="Write some details about your report"
                  className="mb-8 bg-transparent outline-none font-normal"
                />
              </motion.div>
              <motion.div>
                {!filesSelected && (
                  <motion.button
                    layout="position"
                    layoutId="files"
                    onClick={(e) =>
                      fileInput.current && fileInput.current.click()
                    }
                    className="px-4 py-2 rounded-xl hover:bg-white hover:drop-shadow transition flex flex-row items-center space-x-4"
                  >
                    <img src="squares-plus.svg" className="h-8 w-8" />
                    <input
                      accept="audio/*,video/*,image/*"
                      type="file"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                      ref={fileInput}
                    />
                    <p>Add Media</p>
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
            <AnimatePresence>
              {!category && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="text-black flex flex-row space-x-4 bg-gray-200 w-full justify-center"
                >
                  <motion.button
                    className="px-4 py-2 rounded-lg bg-white grow hover:drop-shadow transition"
                    layoutId="incident"
                    onClick={() => {
                      setCategory("incident");
                    }}
                  >
                    Incident
                  </motion.button>
                  <motion.button
                    className="px-4 py-2 rounded-lg bg-white grow hover:drop-shadow transition"
                    layoutId="accident"
                    onClick={() => {
                      setCategory("accident");
                    }}
                  >
                    Accident
                  </motion.button>
                  <motion.button
                    className="px-4 py-2 rounded-lg bg-white grow hover:drop-shadow transition"
                    layoutId="hazard"
                    onClick={() => {
                      setCategory("hazard");
                    }}
                  >
                    Hazard
                  </motion.button>
                  <motion.button
                    className="px-4 py-2 rounded-lg bg-white grow hover:drop-shadow transition"
                    layoutId="crime"
                    onClick={() => {
                      setCategory("crime");
                    }}
                  >
                    Crime
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
            {filesSelected && (
              <motion.div
                layout="position"
                layoutId="files"
                className="grid grid-cols-5 mt-4 gap-x-2"
              >
                {Array.from(filesSelected).map((file: File) => {
                  return <MediaContent file={file} />;
                })}
                {filesSelected.length < 5 && (
                  <motion.button
                    layout="position"
                    onClick={(e) =>
                      fileInput.current && fileInput.current.click()
                    }
                    className="px-4 py-2 grow rounded-xl hover:bg-white hover:drop-shadow transition flex flex-row justify-center items-center space-x-4"
                  >
                    <img src="squares-plus.svg" className="h-8 w-8" />
                    <input
                      accept="audio/*,video/*,image/*"
                      type="file"
                      onChange={handleFileInput}
                      className="hidden grow"
                      multiple
                      ref={fileInput}
                    />
                    <p>Add Media</p>
                  </motion.button>
                )}
              </motion.div>
            )}
          </motion.div>

          <button
            onClick={() => {
              setNewPostModal(!newPostModal);
            }}
            className={`mx-8 my-4 py-2 rounded-lg drop-shadow-lg font-bold text-white mx-4 my-2 z-30 transition ${
              postVerified ? "bg-blue-400" : "bg-gray-400 pointer-events-none"
            }`}
          >
            Publish Post
          </button>
        </motion.div>
        <motion.div
          className="h-full w-full fixed bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        ></motion.div>
      </motion.div>
    );
  };

  const requestCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates([position.coords.latitude, position.coords.longitude]);
        setDefault(false);
      },
      () => {
        alert(
          "SERAPH was unable to access your precise location at the moment. If you accidentally refused location access please update your permissions/settings then click 'Switch to precise location' again."
        );
        setCoordinates(props.user.getCoordinates());
        setDefault(true);
      }
    );
  };

  useEffect(() => {
    queryController = new FirestoreQueryController();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates([position.coords.latitude, position.coords.longitude]);
        setDefault(false);
      },
      () => {
        setCoordinates(props.user.getCoordinates());
        setDefault(true);
      }
    );
    setReady(true);
  }, []);

  useEffect(() => {
    if (coordinates && ready) {
      geocoder = new Geocoder("AIzaSyA9cJAWTnuOvfK3w_S22YKTkgVYTTbhfzw");
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
      className="flex flex-col grow w-full h-full bg-gray-200"
      transition={{ delayChildren: 0.5, duration: 0.5, ease: easeInOut }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key="main_ux"
      layout="position"
    >
      <AnimatePresence>{newPostModal && <NewPostModal />}</AnimatePresence>
      <motion.div
        className="px-16 py-4 bg-gray-100 grid grid-cols-6 items-center gap-x-4 z-40"
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
          <div
            className="relative"
            onClick={() => {
              setUserPopup(!userPopupState);
            }}
          >
            {props.user.getFullName()}
            <AnimatePresence>{userPopupState && userPopup()}</AnimatePresence>
          </div>
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
                if (defaultLocation) {
                  requestCurrentLocation();
                } else {
                  setCoordinates(props.user.getCoordinates());
                  setDefault(true);
                }
              }}
            >
              Switch to {defaultLocation ? "precise" : "default"} location
            </button>
          </div>
        </motion.div>
        <div className="col-span-3 flex flex-col space-y-4">
          {/**Main feed */}
          <motion.button
            className="bg-white rounded-lg p-4 shadow-lg"
            onClick={() => {
              setNewPostModal(!newPostModal);
            }}
            layoutId="newPostModal"
            layout="position"
          >
            Create Report
          </motion.button>
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col overflow-hidden">
            <div className="flex flex-row space-x-2">
              {" "}
              {/** Post component header */}
              <div className="h-9 w-9 rounded-full bg-black">
                {/** Profile picture placeholder */}
              </div>
              <div className="flex flex-col h-9 grow">
                <p className="font-bold text-sm">Test Account</p>
                <p className="font-bold text-gray-400 text-xs">
                  2h - 0.3km away
                </p>
              </div>
              <div className="flex flex-row space-x-4 items-center">
                <div className="flex flex-row space-x-2 items-center font-bold text-green-500">
                  ^ <p>0</p>
                </div>
                <div className="flex flex-row space-x-2 items-center font-bold text-red-500">
                  ^ <p>0</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col mt-4">
              <div className="px-2 py-1 rounded-full font-bold text-xs text-center text-white bg-orange-400 w-fit">
                Hazard
              </div>
              <p className="font-bold text-xl">
                Heavy construction work along Nia Rd., Carsadang Bago.
              </p>
              <p className="leading-tight mt-2">
                Caption here. Lorem ipsum dolor sit amet, consectetur adipiscing
                elit. Praesent placerat metus ac consequat elementum. Aenean
                tincidunt ut elit vitae porttitor. Nulla quam nulla, gravida nec
                velit non, tristique ornare diam.
              </p>
            </div>
            <div className="bg-gradient-to-r from-transparent via-gray-300 to-transparent h-[1px] mt-2" />
            <div className="grid grid-cols-3 h-12 -mb-4 -ml-4 -mr-4">
              <button className="hover:bg-gray-200 font-bold">Upvote</button>
              <button className="hover:bg-gray-200 font-bold">Downvote</button>
              <button className="hover:bg-gray-200 font-bold">Comments</button>
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <div className="h-1/2 w-full rounded-lg bg-white relative overflow-hidden shadow-inner z-20">
            {isLoaded && (
              <GoogleMap
                mapContainerClassName="h-full w-full"
                center={center}
                zoom={10}
                onLoad={onLoad}
                onUnmount={onUnmount}
              >
                {/* Child components, such as markers, info windows, etc. */}
                <></>
              </GoogleMap>
            )}
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
