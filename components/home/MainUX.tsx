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
  UserQuery,
} from "../../core/firebase/Firestore";
import { AuthenticationManager } from "../../core/firebase/Authentication";
import {
  GoogleMap,
  Marker,
  MarkerF,
  useJsApiLoader,
} from "@react-google-maps/api";
import NewPostModal from "./MainUX/NewPostModal";
import {
  distanceBetween,
  geohashForLocation,
  geohashQueryBounds,
  Geopoint,
} from "geofire-common";
import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  GeoPoint,
  Query,
  QueryDocumentSnapshot,
  Unsubscribe,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  endAt,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  startAt,
  updateDoc,
  where,
} from "firebase/firestore";
import { BeatLoader, CircleLoader, MoonLoader } from "react-spinners";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  getAuth,
  reauthenticateWithPopup,
} from "firebase/auth";
import {
  StorageReference,
  deleteObject,
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";

interface props {
  authManager: AuthenticationManager | undefined;
  user: UserModel;
}

export const MainUX: FunctionComponent<props> = (props) => {
  const [newPostModal, setNewPostModal] = useState(false);
  const [newPostModalOverrides, setNewPostModalOverrides] = useState<any>();
  const [coordinates, setCoordinates] = useState<[number, number]>();
  const [defaultLocation, setDefault] = useState(false);
  const [ready, setReady] = useState(false);
  const [location, setLocation] = useState();
  const [posts, setPostsParent] = useState<DocumentSnapshot[]>();
  const [mapPopUp, setMapPopUp] = useState(false);
  const [userPopupState, setUserPopup] = useState(false);
  const [profile, setProfile] = useState(false);
  const [radius, setRadius] = useState(5);
  const [categoryFilter, setFilter] = useState<
    "incident" | "accident" | "hazard" | "crime" | undefined
  >();
  const [searchQuery, setQuery] = useState<string | undefined>(undefined);
  const [queryDocs, setQueryDocs] =
    useState<QueryDocumentSnapshot<DocumentData>[]>();
  const [queryLoading, setQueryLoading] = useState(false);

  let geocoder: Geocoder;
  let queryController: FirestoreQueryController;
  let router = useRouter();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyA9cJAWTnuOvfK3w_S22YKTkgVYTTbhfzw",
  });

  const [map, setMap] = useState(null);

  const reloadRef = useRef();

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
          <div className="bg-transparent border-black-1 h-full w-1/3">
            {props.user.profilePicture ? (
              <img
                src={props.user.profilePicture}
                className="h-full w-auto object-cover"
              />
            ) : (
              <img src="user.svg" className="h-full w-auto object-cover" />
            )}
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
          <button
            onClick={() => {
              setProfile(true);
            }}
            className="rounded-lg w-full text-left py-2 px-4 hover:bg-gray-300 transition flex flex-row space-x-2 items-center font-bold"
          >
            <img className="p-1 rounded-full bg-gray-200" src="/user.svg" />
            <p>Your Profile</p>
          </button>
          <button
            className="rounded-lg w-full text-left py-2 px-4 hover:bg-gray-300 transition flex flex-row space-x-2 items-center font-bold"
            onClick={() => {
              props.authManager?.signOut();
            }}
          >
            <img className="p-1 rounded-full bg-gray-200" src="/leave.svg" />
            <p>Sign out</p>
          </button>
        </div>
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
        let last_location = new GeoPoint(
          position.coords.latitude,
          position.coords.longitude
        );
        updateDoc(doc(getFirestore(), "users/" + props.user.authUser?.uid), {
          last_location: last_location,
        });
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

  const toggleModal = () => {
    setNewPostModal(!newPostModal);
  };

  useEffect(() => {
    if (searchQuery && searchQuery != "") {
      setQueryLoading(true);
    }
    const queryDebounce = setTimeout(() => {
      if (searchQuery && searchQuery != "") {
        getDocs(collection(getFirestore(), "posts")).then((docs) => {
          let matchingDocs: QueryDocumentSnapshot<DocumentData>[] = [];
          docs.forEach((doc) => {
            if (doc.data().title.includes(searchQuery)) {
              matchingDocs.push(doc);
            } else if (doc.data().content.includes(searchQuery)) {
              matchingDocs.push(doc);
            }
          });
          setQueryDocs(matchingDocs);
          setQueryLoading(false);
        });
      }
    }, 2000);
    return () => clearTimeout(queryDebounce);
  }, [searchQuery]);

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
      let geopointLoc: Geopoint = coordinates;
      updateDoc(doc(getFirestore(), "users/" + props.user.authUser?.uid), {
        location: geopointLoc,
        location_hash: geohashForLocation(geopointLoc),
      });
      props.user.setCurrentLocation(coordinates);
    }
  }, [coordinates]);

  const PhoneVerificationWidget = () => {
    const [number, setNumber] = useState<string>();
    const [verifying, setVerifying] = useState(false);
    const [code, setCode] = useState<string>();
    const [complete, setComplete] = useState(false);

    const createVerificationCode = () => {
      fetch(`/api/verify/${props.user.authUser?.uid}?number=${number}`).then(
        () => {
          setVerifying(true);
        }
      );
    };

    const verifyCode = () => {
      fetch(
        `/api/verify/${props.user.authUser?.uid}?number=${number}&code=${code}`
      )
        .then((result) => result.json())
        .then((data) => {
          if (data.status == "approved") {
            updateDoc(
              doc(getFirestore(), "users/" + props.user.authUser?.uid),
              {
                phone_number: number,
              }
            );
            setVerifying(false);
            setComplete(true);
          }
        });
    };

    return (
      <>
        {complete && (
          <div className="bg-blue-600 grow p-2 text-white text-center font-bold">
            Successfully registered phone number
          </div>
        )}
        {verifying ? (
          <div className="grid grid-cols-2 gap-x-4 mt-4">
            <div className="flex flex-row p-2 bg-gray-200 rounded items-center">
              <input
                key="code"
                className="text-xl appearance-none bg-transparent"
                type="number"
                onChange={(e) => {
                  setCode(e.target.value);
                }}
                placeholder="Verification Code"
              />
            </div>
            <button
              className={` bg-blue-600 text-white font-bold rounded`}
              onClick={() => {
                verifyCode();
              }}
            >
              Enter Verification Code
            </button>
          </div>
        ) : !complete ? (
          <div className="grid grid-cols-2 gap-x-4 mt-4">
            <div className="flex flex-row p-2 bg-gray-200 rounded items-center">
              <p className="text-xl font-bold">+63</p>
              <input
                className="text-xl appearance-none bg-transparent"
                type="number"
                onChange={(e) => {
                  if (e.target.value.length == 10) setNumber(e.target.value);
                  else setNumber(undefined);
                }}
                placeholder="9123456789"
              />
            </div>
            <button
              className={` ${
                number ? "bg-blue-600" : "bg-gray-400 cursor-default"
              } text-white font-bold rounded`}
              onClick={() => {
                if (number) {
                  createVerificationCode();
                }
              }}
            >
              Send Verification Code
            </button>
          </div>
        ) : (
          <></>
        )}
      </>
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "hazard":
        return "bg-orange-400 text-white";
      case "accident":
        return "bg-yellow-300 text-black";
      case "incident":
        return "bg-black text-white";
      case "crime":
        return "bg-red-400 text-white";
      default:
        break;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "hazard":
        return "Hazard";
      case "accident":
        return "Accident";
      case "incident":
        return "Incident";
      case "crime":
        return "Crime";
      default:
        break;
    }
  };

  return (
    <motion.div
      className="flex flex-col grow w-full h-full bg-slate-200"
      transition={{ delayChildren: 0.5, duration: 0.5, ease: easeInOut }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key="main_ux"
      layout="position"
    >
      <AnimatePresence>
        {mapPopUp && (
          <MapFullScreenPopUp
            posts={posts}
            coordinates={coordinates}
            setMapPopUp={setMapPopUp}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {profile && <Profile user={props.user} setProfile={setProfile} />}

        {newPostModal && coordinates && (
          <NewPostModal
            coordinates={coordinates}
            toggleModal={toggleModal}
            user={props.user}
            overrides={newPostModalOverrides}
            reloadRef={reloadRef}
          />
        )}
      </AnimatePresence>
      <motion.div
        className="px-16 py-4 bg-slate-400 grid grid-cols-6 items-center gap-x-4 z-40"
        initial={{ y: "-5vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <p className="font-bold col-span-1 h-12 text-white">
          <img src="vercel.svg" className="h-12 w-auto" />
        </p>
        <div className="relative col-span-3">
          <div className="py-2 px-4 text-white bg-gray-400 rounded-lg relative">
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent w-full text-white appearance-none outline-none"
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
            {!searchQuery && (
              <div className="absolute top-2 pointer-events-none">Search</div>
            )}
          </div>
          {searchQuery != "" && (
            <div className="bg-white absolute rounded-lg drop-shadow-lg overflow-hidden flex flex-col w-full">
              {queryLoading ? (
                <p className="p-4">Now searching for posts...</p>
              ) : (
                <>
                  {" "}
                  {queryDocs?.map((query) => {
                    let post = query.data();
                    let date = new Date(post.timestamp);
                    return (
                      <a
                        className="bg-white hover:bg-gray-100 p-4 flex flex-row"
                        href={`/report/${query.id}`}
                      >
                        <div className="flex flex-col">
                          <p className="font-bold">
                            <span
                              className={`px-4 py-1 ${getCategoryColor(
                                post.category
                              )} text-sm text-white rounded-full`}
                            >
                              {getCategoryName(post.category)}
                            </span>{" "}
                            {post.title}
                          </p>
                          <p className="mt-2">{post.content}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded on {date.toString()}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                  {queryDocs?.length == 0 && (
                    <p className="p-4">
                      Your query did not return any report with a similar title
                      or content.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <div className="col-span-2 flex flex-row">
          <div className="grow" />
          <div
            className="relative bg-slate-100 py-2 px-4 drop-shadow rounded-full cursor-pointer"
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
          <div className=" text-2xl mt-8 space-y-2 rounded-lg flex flex-col">
            <button className="font-bold flex flex-row space-x-6 items-center py-4 bg-transparent hover:bg-slate-100 -ml-8 pl-8 rounded-full">
              <img src="home.svg" className="h-7 w-auto" />
              <p>Home</p>
            </button>
            <button
              onClick={() => {
                setMapPopUp(true);
              }}
              className="flex flex-row space-x-6 items-center py-4 bg-transparent hover:bg-slate-100 -ml-8 pl-8 rounded-full"
            >
              <img src="map.svg" className="h-7 w-auto" />
              <p>Live Map</p>
            </button>
            <button
              className="flex flex-row space-x-6 items-center py-4 bg-transparent hover:bg-slate-100 -ml-8 pl-8 rounded-full"
              onClick={() => {
                setProfile(true);
              }}
            >
              <img src="user-outline.svg" className="h-7 w-auto" />
              <p>Your Profile</p>
            </button>
          </div>
          <div className="flex flex-col mt-16">
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
              setNewPostModalOverrides(undefined);
              setNewPostModal(!newPostModal);
            }}
            layoutId="newPostModal"
            layout="position"
          >
            Create Report
          </motion.button>
          <div className="flex flex-row">
            <p>Filter by Category</p>
            <div className="grow" />
            <p className="mr-2">Show posts within:</p>
            <select
              onChange={(e) => {
                setRadius(Number(e.target.value));
              }}
              className="rounded-lg drop-shadow"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>
          <motion.div className="flex flex-row space-x-4 font-bold text-black">
            <motion.button
              className={`px-4 py-2 rounded-lg ${
                !categoryFilter ? "bg-blue-500 text-white" : "bg-white"
              } grow hover:drop-shadow transition`}
              layoutId="no_filter"
              onClick={() => {
                setFilter(undefined);
              }}
            >
              All
            </motion.button>
            <motion.button
              className={`px-4 py-2 rounded-lg ${
                categoryFilter == "incident"
                  ? "bg-black text-white"
                  : "bg-white"
              } grow hover:drop-shadow transition`}
              layoutId="incident_filter"
              onClick={() => {
                setFilter("incident");
              }}
            >
              Incident
            </motion.button>
            <motion.button
              className={`px-4 py-2 rounded-lg ${
                categoryFilter == "accident"
                  ? "bg-yellow-500 text-white"
                  : "bg-white"
              } grow hover:drop-shadow transition`}
              layoutId="accident_filter"
              onClick={() => {
                setFilter("accident");
              }}
            >
              Accident
            </motion.button>
            <motion.button
              className={`px-4 py-2 rounded-lg ${
                categoryFilter == "hazard"
                  ? "bg-orange-400 text-white"
                  : "bg-white"
              } grow hover:drop-shadow transition`}
              layoutId="hazard_filter"
              onClick={() => {
                setFilter("hazard");
              }}
            >
              Hazard
            </motion.button>
            <motion.button
              className={`px-4 py-2 rounded-lg ${
                categoryFilter == "crime" ? "bg-red-700 text-white" : "bg-white"
              } grow hover:drop-shadow transition`}
              layoutId="crime_filter"
              onClick={() => {
                setFilter("crime");
              }}
            >
              Crime
            </motion.button>
          </motion.div>
          {coordinates && (
            <>
              <FeedManager
                setPostsParent={setPostsParent}
                currentUser_uid={getAuth().currentUser?.uid}
                coordinates={coordinates}
                categoryFilter={categoryFilter}
                setNewPostModalOverrides={setNewPostModalOverrides}
                setNewPostModal={setNewPostModal}
                radius={radius}
                reloadRef={reloadRef}
              />
            </>
          )}
        </div>
        <div className="col-span-2">
          <div className="p-4 rounded-lg drop-shadow mb-4 bg-white flex flex-col">
            {props.user.phoneNumber ? (
              <div className="flex flex-row">
                <div className="flex flex-col">
                  <p className="">User reputation</p>
                  <p className="font-bold text-2xl">0</p>
                </div>
                <div className="grow" />
                <div className="flex flex-col">
                  <p className="">Phone</p>
                  <p className="font-bold text-2xl">Registered</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-row">
                  <img src="" />
                  <div className="flex flex-col">
                    <p className="font-bold text-lg">
                      Hi, friend. Stay safe even when offline.
                    </p>
                    <p>
                      Register your phone number to receive notifications of new
                      reports in your last known location without logging into
                      the app.
                    </p>
                  </div>
                </div>
                <PhoneVerificationWidget />
              </>
            )}
          </div>
          <motion.div
            className="h-1/2 w-full rounded-lg bg-white relative overflow-hidden shadow-inner z-20"
            layout
            layoutId="map"
          >
            {isLoaded && (
              <GoogleMap
                mapContainerClassName="h-full w-full"
                center={center}
                zoom={10}
                onLoad={onLoad}
                onUnmount={onUnmount}
              >
                {posts?.map((doc) => {
                  return (
                    <MarkerF
                      key={doc.id}
                      label={doc.data()!.title}
                      position={
                        new google.maps.LatLng(
                          doc.data()!.location["_lat"],
                          doc.data()!.location["_long"]
                        )
                      }
                    />
                  );
                })}
              </GoogleMap>
            )}
            <div className="absolute bottom-0 bg-gradient-to-t from-gray-700 to-transparent h-1/6 p-4 text-white font-light w-full">
              There are <span className="font-bold">{posts?.length}</span>{" "}
              reports in your area
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Profile = (props: { user: UserModel; setProfile: Function }) => {
  const [ready, setReady] = useState(true);
  const [profileURL, setProfile] = useState<string>();
  const [profilePicture, setProfilePicture] = useState<File>();
  const [f_name, setFName] = useState<string>();
  const [l_name, setLName] = useState<string>();
  const profileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (props.user.profilePicture) {
      setProfile(props.user.profilePicture);
    }
    setFName(props.user._fName);
    setLName(props.user._lName);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="h-screen w-screen fixed flex flex-col justify-center items-center z-50 bg-black bg-opacity-20 p-16"
    >
      <motion.div
        initial={{ y: "50vh" }}
        animate={{ y: 0 }}
        exit={{ y: "50vh" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="bg-slate-100 p-8 rounded-xl drop-shadow-lg h-full w-1/2 flex flex-col"
      >
        <div className="relative h-8">
          <button
            className="absolute right-0 h-full"
            onClick={() => {
              props.setProfile(false);
            }}
          >
            <img src="close.svg" className="h-full w-auto" />
          </button>
        </div>
        <AnimatePresence>
          {ready ? (
            <>
              <div className="h-48 w-48 grow-0 rounded-full self-center relative overflow-hidden group">
                <input
                  type="file"
                  className="hidden"
                  ref={profileRef}
                  accept="images/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setProfilePicture(e.target.files[0]);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    profileRef.current?.click();
                  }}
                  className="absolute top-0 flex items-center justify-center h-full w-full bg-transparent text-transparent group-hover:bg-black group-hover:bg-opacity-25 group-hover:text-white font-bold"
                >
                  Update Picture
                </button>
                {profileURL && !profilePicture && (
                  <img
                    src={profileURL}
                    className="h-full w-auto object-cover"
                  />
                )}
                {!profileURL && !profilePicture && (
                  <img src="user.svg" className="h-full w-auto object-cover" />
                )}
                {profilePicture && (
                  <img
                    src={URL.createObjectURL(profilePicture)}
                    className="h-full w-auto object-cover"
                  />
                )}
              </div>
              <p className="text-2xl font-bold self-center py-2">
                {props.user.getFullName()}
              </p>
              {props.user.phoneNumber ? (
                <div className="self-center">
                  <p className="bg-green-700 text-white px-4 py-1 font-bold rounded-lg">
                    Verified
                  </p>
                </div>
              ) : (
                <div className="self-center">
                  <p className="bg-yellow-600 text-white px-4 py-1 font-bold rounded-lg">
                    Unverified
                  </p>
                </div>
              )}
              <div className="grow grid grid-cols-3 grid-rows-6 gap-y-2 mt-4">
                <div className="col-span-1 row-span-1 font-bold">
                  Login Information
                </div>
                <div className="col-span-2 row-span-1 flex flex-col">
                  <p>
                    {props.user.authUser?.displayName
                      ? "Logged in via Firebase (Google Account)"
                      : "Logged in via Email"}
                  </p>
                  <p>{props.user.authUser?.email}</p>
                </div>
                <div className="col-span-1 row-span-3 font-bold">
                  Basic Information
                </div>
                <div className="col-span-2 row-span-3 flex flex-col">
                  <div className="bg-yellow-400 text-black rounded-lg p-4">
                    For security reasons, the name you registered with, as well
                    as any name changes you perform in the future, will be
                    logged in our database.{" "}
                    <b>Please make sure to use your real name.</b>
                  </div>
                  <div className="grid grid-cols-2 space-y-2">
                    <label className="mt-2">First Name</label>
                    <label>Last Name</label>
                    <input
                      onChange={(e) => {
                        setFName(e.target.value);
                      }}
                      className="p-2 mr-2 rounded-lg bg-white shadow-inner"
                      value={f_name}
                    />
                    <input
                      onChange={(e) => {
                        setLName(e.target.value);
                      }}
                      className="p-2 rounded-lg bg-white shadow-inner"
                      value={l_name}
                    />
                  </div>
                </div>
                <div className="col-span-1 row-span-1 font-bold">
                  Account Actions
                </div>
                <div className="col-span-2 row-span-1">
                  <div className="flex flex-row space-x-4">
                    <button
                      onClick={() => {
                        if (
                          props.user.authUser?.displayName &&
                          confirm(
                            "Are you sure you want to delete your SERAPH account? (Including all posts and comments made). This action cannot be undone."
                          )
                        ) {
                          reauthenticateWithPopup(
                            props.user.authUser!,
                            new GoogleAuthProvider()
                          )
                            .catch(() => {
                              alert(
                                "The Google Account you selected does not match the Google account linked to your SERAPH account."
                              );
                            })
                            .then((user) => {
                              if (user) {
                                user.user.delete().then(() => {
                                  deleteDoc(
                                    doc(
                                      getFirestore(),
                                      "users/" + props.user.authUser?.uid
                                    )
                                  );
                                  window.location.reload();
                                });
                              }
                            });
                        } else {
                          window.location.assign(
                            `/account?delete=true&email=${props.user.authUser?.email}`
                          );
                        }
                      }}
                      className="rounded-lg px-4 py-2 text-white font-bold bg-red-700"
                    >
                      Delete Account
                    </button>
                    <button
                      onClick={() => {
                        deleteDoc(
                          doc(
                            getFirestore(),
                            "users/" + props.user.authUser?.uid
                          )
                        ).then(() => {
                          window.location.reload();
                        });
                      }}
                      className="rounded-lg px-4 py-2 text-white font-bold bg-orange-500"
                    >
                      Reset Account
                    </button>
                  </div>
                </div>
                <div className="col-span-3 row-span-1 grid grid-cols-2 space-x-4">
                  <button
                    onClick={() => {
                      if (profilePicture) {
                        let newProfilePicture = ref(
                          getStorage(),
                          props.user.authUser?.uid + "/" + profilePicture.name
                        );
                        uploadBytes(newProfilePicture, profilePicture).then(
                          (result) => {
                            if (result) {
                              updateDoc(
                                doc(
                                  getFirestore(),
                                  "users/" + props.user.authUser?.uid
                                ),
                                {
                                  f_name: f_name,
                                  l_name: l_name,
                                  profile_picture: result.ref.name,
                                }
                              ).then(() => {
                                window.location.reload();
                              });
                            }
                          }
                        );
                      } else {
                        updateDoc(
                          doc(
                            getFirestore(),
                            "users/" + props.user.authUser?.uid
                          ),
                          {
                            f_name: f_name,
                            l_name: l_name,
                          }
                        ).then(() => {
                          window.location.reload();
                        });
                      }
                    }}
                    className="text-white font-bold rounded-lg drop-shadow bg-blue-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      props.setProfile(false);
                    }}
                    className="text-black font-bold rounded-lg drop-shadow bg-gray-200"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </>
          ) : (
            <motion.div
              exit={{ opacity: 0 }}
              className="grow flex flex-col space-y-4 items-center justify-center"
            >
              <MoonLoader />
              <p className="text-xl">Loading your profile</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const FeedManager = (props: any) => {
  const [posts, setPosts] = useState<any[]>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    reload();
  }, [props.radius]);

  useEffect(() => {
    if (props.coordinates) {
      reload();
    }
  }, [props.coordinates, props.categoryFilter]);

  const reload = () => {
    setLoading(true);
    const bounds = geohashQueryBounds(props.coordinates, 50 * 1000);
    const promises = [];
    let q: Query;

    if (props.categoryFilter) {
      for (const b of bounds) {
        q = query(
          collection(getFirestore(), "posts"),
          where("category", "==", props.categoryFilter),
          orderBy("location_hash"),
          orderBy("timestamp", "desc"),

          startAt(b[0]),
          endAt(b[1])
        );

        promises.push(getDocs(q));
      }
    } else {
      for (const b of bounds) {
        q = query(
          collection(getFirestore(), "posts"),
          orderBy("location_hash"),
          orderBy("timestamp", "desc"),
          startAt(b[0]),
          endAt(b[1])
        );

        promises.push(getDocs(q));
      }
    }

    Promise.all(promises)
      .then((snapshots) => {
        const matchingDocs: any[] = [];

        for (const snap of snapshots) {
          for (const document of snap.docs) {
            const lat = document.data()["location"]["_lat"];
            const lng = document.data()["location"]["_long"];

            // We have to filter out a few false positives due to GeoHash
            // accuracy, but most will match
            const distanceInKm = distanceBetween([lat, lng], props.coordinates);
            const distanceInM = distanceInKm * 1000;
            if (distanceInM <= props.radius * 1000) {
              document.data()["distance"] = distanceInM;
              matchingDocs.push(document);
            }
          }
        }

        return matchingDocs;
      })
      .then((matchingDocs) => {
        setLoading(false);
        setPosts(matchingDocs);
        props.setPostsParent(matchingDocs);
      });
  };

  useEffect(() => {
    props.reloadRef.current = reload;
  }, []);

  return (
    <motion.div className="overflow-y-scroll h-0 grow flex flex-col items-center no-scrollbar">
      {loading && (
        <>
          <CircleLoader className="mb-4" /> <p>Now loading your feed</p>
        </>
      )}
      {!loading &&
        posts &&
        posts.map((postData: any, idx: number) => {
          return (
            <Post
              key={idx}
              currentUser_uid={props.currentUser_uid}
              data={postData.data()}
              id={postData.id}
              coordinates={props.coordinates}
              remove={() => {
                deleteDoc(doc(getFirestore(), "posts/" + postData.id)).then(
                  () => {
                    const mediaRef = ref(getStorage(), postData.id);
                    if (postData.data().media) {
                      listAll(mediaRef).then((list) => {
                        let promises: Promise<void>[] = [];
                        list.items.forEach((item) => {
                          promises.push(deleteObject(item));
                        });

                        Promise.all(promises).then(() => {
                          let postsCopy = [...posts];
                          postsCopy.splice(idx, 1);
                          setPosts(postsCopy);
                          reload();
                        });
                      });
                    } else {
                      let postsCopy = [...posts];
                      postsCopy.splice(idx, 1);
                      setPosts(postsCopy);
                      reload();
                    }
                  }
                );
              }}
              edit={() => {
                props.setNewPostModalOverrides({
                  title: postData.data().title,
                  content: postData.data().content,
                  category: postData.data().category,
                  id: postData.id,
                  replace(data: DocumentSnapshot<DocumentData>) {
                    let postsCopy = [...posts];
                    postsCopy.splice(idx, 1, data);
                    setPosts(postsCopy);
                  },
                });
                props.setNewPostModal(true);
              }}
            />
          );
        })}
      {!loading && posts?.length == 0 && (
        <p className="text-xl font-semibold text-gray-500">
          There are currently no reports in this category within your location.
        </p>
      )}
    </motion.div>
  );
};

interface MediaContentProps {
  url: string;
}

const MediaContent: FunctionComponent<MediaContentProps> = (props) => {
  const [image, setImage] = useState<any>();
  const [video, setVideo] = useState<any>();
  const [fullscreen, setFullscreen] = useState(false);

  const substrings = ["jpg", "png", "webp", "JPG", "PNG", "WEBP"];
  useEffect(() => {
    if (substrings.some((v) => props.url.includes(v))) {
      setImage(true);
    } else {
      setVideo(true);
    }
  }, []);

  if (image) {
    return (
      <div
        className="cursor-pointer"
        onClick={() => {
          setFullscreen(!fullscreen);
        }}
      >
        <img src={props.url} className="h-full w-full object-contain" />
        {fullscreen && (
          <div className="fixed h-screen w-screen p-16 bg-black bg-opacity-40 top-0 left-0 z-50 flex justify-center items-center">
            <img src={props.url} />
            <p className="text-white fixed bottom-8">
              Press anywhere to exit full screen view
            </p>
          </div>
        )}
      </div>
    );
  } else if (video) {
    return (
      <video controls className="h-64 w-auto">
        <source src={props.url} />
      </video>
    );
  }
  return <></>;
};

const Post = (props: any) => {
  const [ownerData, setOwner] = useState<DocumentData | undefined>();
  const [voteState, setVote] = useState<"upvote" | "downvote" | "none">("none");
  const [showComments, setShowComments] = useState(false);
  const [commentVerified, setCommentVerified] = useState(false);
  const [media, setMedia] = useState<string[]>();
  const [distance, setDistance] = useState<string>();
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [ownerProfilePicture, setProfilePicture] = useState<string | null>();

  const shareRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<any>();

  const handleSubmit = () => {
    addDoc(collection(getFirestore(), `comments/${props.id}/rtc`), {
      author_uid: props.currentUser_uid,
      content: commentRef.current.value,
      timestamp: Date.now(),
    }).then(() => {
      commentRef.current.value = "";
    });
  };

  useEffect(() => {
    let distanceInM =
      distanceBetween(
        [props.data.location._lat, props.data.location._long],
        props.coordinates
      ) * 1000;

    if (distanceInM < 1) {
      setDistance(`${distanceInM.toPrecision(2)} m away`);
    } else {
      setDistance(`${(distanceInM / 1000).toPrecision(2)} km away`);
    }

    setUpvotes(props.data.upvotes.length);
    setDownvotes(props.data.downvotes.length);
  }, []);

  const handleComment = (e: any) => {
    let comment: string = e.target.value;
    if (comment.replaceAll(" ", "").length > 0) {
      setCommentVerified(true);
    } else {
      setCommentVerified(false);
    }
  };

  const timeDifferenceString = () => {
    let time = Date.now() - props.data.timestamp;

    var daysDifference = Math.floor(time / 1000 / 60 / 60 / 24);
    time -= daysDifference * 1000 * 60 * 60 * 24;

    var hoursDifference = Math.floor(time / 1000 / 60 / 60);
    time -= hoursDifference * 1000 * 60 * 60;

    var minutesDifference = Math.floor(time / 1000 / 60);
    time -= minutesDifference * 1000 * 60;

    let result = "";

    if (minutesDifference < 15) {
      result = `Now`;
    }
    if (minutesDifference > 0) {
      result = `${minutesDifference}m`;
    }
    if (hoursDifference > 0) {
      result = `${hoursDifference}h `;
    }
    if (daysDifference > 0) {
      result = `${daysDifference}d `;
    }

    return result;
  };
  useEffect(() => {
    let controller = new FirestoreQueryController();
    let query: UserQuery = {
      collection: "users",
      query: [where("__name__", "==", props.data.owner_uid)],
    };
    controller.fetch_user_once(query).then((userDoc) => {
      if (props.data.upvotes.includes(props.currentUser_uid)) {
        setVote("upvote");
      } else if (props.data.downvotes.includes(props.currentUser_uid)) {
        setVote("downvote");
      } else {
        setVote("none");
      }

      if (userDoc && userDoc["profile_picture"]) {
        getDownloadURL(
          ref(
            getStorage(),
            props.data.owner_uid + "/" + userDoc["profile_picture"]
          )
        ).then((url) => {
          setProfilePicture(url);
          setOwner(userDoc);
        });
      } else if (userDoc) {
        setOwner(userDoc);
      }
    });

    if (props.data["media"]) {
      const mediaRef = ref(getStorage(), props.id);
      listAll(mediaRef).then((list) => {
        let promises: Promise<string>[] = [];
        list.items.forEach((item) => {
          promises.push(getDownloadURL(item));
        });

        Promise.all(promises).then((values) => setMedia(values));
      });
    }
  }, []);

  const getCategoryColor = () => {
    switch (props.data.category) {
      case "hazard":
        return "bg-orange-400 text-white";
      case "accident":
        return "bg-yellow-300 text-black";
      case "incident":
        return "bg-black text-white";
      case "crime":
        return "bg-red-400 text-white";
      default:
        break;
    }
  };

  const upvote = () => {
    if (voteState == "upvote") {
      setUpvotes(upvotes - 1);
      setVote("none");
      updateDoc(doc(getFirestore(), "posts/" + props.id), {
        upvotes: arrayRemove(props.currentUser_uid),
      });
    } else if (voteState == "downvote") {
      setUpvotes(upvotes + 1);
      setDownvotes(downvotes - 1);
      setVote("upvote");
      updateDoc(doc(getFirestore(), "posts/" + props.id), {
        downvotes: arrayRemove(props.currentUser_uid),
        upvotes: arrayUnion(props.currentUser_uid),
      });
    } else {
      setUpvotes(upvotes + 1);
      setVote("upvote");
      updateDoc(doc(getFirestore(), "posts/" + props.id), {
        downvotes: arrayRemove(props.currentUser_uid),
        upvotes: arrayUnion(props.currentUser_uid),
      });
    }
  };

  const downvote = () => {
    if (voteState == "downvote") {
      setDownvotes(downvotes - 1);
      updateDoc(doc(getFirestore(), "posts/" + props.id), {
        downvotes: arrayRemove(props.currentUser_uid),
      });
      setVote("none");
    } else if (voteState == "upvote") {
      setDownvotes(downvotes + 1);
      setUpvotes(upvotes - 1);
      updateDoc(doc(getFirestore(), "posts/" + props.id), {
        upvotes: arrayRemove(props.currentUser_uid),
        downvotes: arrayUnion(props.currentUser_uid),
      });
      setVote("downvote");
    } else {
      setDownvotes(downvotes + 1);
      updateDoc(doc(getFirestore(), "posts/" + props.id), {
        upvotes: arrayRemove(props.currentUser_uid),
        downvotes: arrayUnion(props.currentUser_uid),
      });
      setVote("downvote");
    }
  };

  return (
    <div
      key={props.id}
      className="bg-white w-full rounded-lg shadow-lg p-4 mb-4 flex flex-col"
    >
      {ownerData && (
        <>
          <input
            className="hidden"
            type="text"
            ref={shareRef}
            value={"http://localhost:3000/report/" + props.id}
            readOnly
          />
          <div className="flex flex-row space-x-2 relative items-center">
            {" "}
            {/** Post component header */}
            {props.currentUser_uid == props.data.owner_uid && (
              <div className="absolute right-0 flex flex-row justify-center space-x-2">
                <button className="h-6" onClick={props.edit}>
                  <img src="edit.svg" className="h-full w-auto" />
                </button>
                <button
                  className="h-6"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to delete this post titled " +
                          props.data.title
                      )
                    )
                      props.remove();
                  }}
                >
                  <img src="delete.svg" className="h-full w-auto" />
                </button>
              </div>
            )}
            <div className="h-9 w-9 rounded-full">
              {ownerProfilePicture ? (
                <img
                  src={ownerProfilePicture}
                  className="h-full w-auto object-cover"
                />
              ) : (
                <img
                  src="user.svg"
                  className="p-1 h-full w-auto object-cover"
                />
              )}
            </div>
            <div className="flex flex-col h-9 grow">
              <p className="font-bold text-sm">
                {`${ownerData["f_name"]} ${ownerData["l_name"]}`}
              </p>
              <p className="font-bold text-gray-400 text-xs">
                {timeDifferenceString()} - {distance}
              </p>
            </div>
          </div>
          <div className="flex flex-col mt-4">
            <div
              className={`px-4 py-1 rounded-full font-bold text-xs text-center ${getCategoryColor()} w-fit`}
            >
              {props.data["category"].charAt(0).toUpperCase() +
                props.data["category"].slice(1)}
            </div>
            <p className="font-bold my-2 text-xl">{props.data.title}</p>
            <p className="leading-tight grow">{props.data.content}</p>
            <div
              className={`w-full mt-4 grid grid-cols-${media?.length} space-x-2 flex-wrap`}
            >
              {media &&
                media.map((mediaContent) => {
                  return <MediaContent url={mediaContent} />;
                })}
            </div>
          </div>
          <div className="bg-gradient-to-r from-transparent via-gray-300 to-transparent h-[1px] mt-2" />
          <div className="grid grid-cols-4 h-12 -mb-4 -ml-4 -mr-4">
            <button
              className={`flex flex-row space-x-4 items-center justify-center ${
                voteState == "upvote"
                  ? "bg-green-500 text-white"
                  : "hover:bg-gray-200 text-black"
              } transition font-bold`}
              onClick={upvote}
            >
              <img src="upvote.svg" className="fill-white" />
              <p>Upvote</p>
              <p className="px-1 rounded-full bg-white text-black">{upvotes}</p>
            </button>
            <button
              className={`flex flex-row space-x-4 items-center justify-center ${
                voteState == "downvote"
                  ? "bg-red-500 text-white"
                  : "hover:bg-gray-200 text-black"
              } transition font-bold`}
              onClick={downvote}
            >
              <img src="downvote.svg" className="fill-white" />
              <p>Downvote</p>
              <p className="px-1 rounded-full bg-white text-black">
                {downvotes}
              </p>
            </button>
            <button
              className={`hover:bg-gray-200 font-bold`}
              onClick={() => {
                setShowComments(!showComments);
              }}
            >
              Comments
            </button>
            <button
              className={`hover:bg-gray-200 font-bold`}
              onClick={() => {
                shareRef.current?.select();
                shareRef.current?.setSelectionRange(0, 99999);
                navigator.clipboard.writeText(shareRef.current?.value!);
                alert("Shareable link copied to clipboard.");
              }}
            >
              Share
            </button>
          </div>
          {showComments && (
            <>
              <Comments id={props.id} />
              <div className="mt-2 relative">
                <input
                  className="bg-gray-300 shadow-inner rounded py-2 px-4 w-full"
                  onChange={handleComment}
                  placeholder="Write a comment"
                  ref={commentRef}
                />
                {commentVerified && (
                  <button
                    onClick={handleSubmit}
                    className="px-4 rounded bg-blue-600 hover:bg-blue-400 font-bold text-white transition shadow absolute top-2 right-2"
                  >
                    Send
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
      {!ownerData && (
        <motion.div className="flex flex-col items-center">
          <BeatLoader />
          <p>Loading post</p>
        </motion.div>
      )}
    </div>
  );
};

const Comments = (props: any) => {
  const [comments, setComments] = useState<DocumentSnapshot<DocumentData>[]>(
    []
  );
  const [ready, setReady] = useState(false);

  const pushToComments = (docs: DocumentSnapshot[]) => {
    let commentsCopy = [...comments];
    commentsCopy.push(...docs);
    setComments(commentsCopy);
  };
  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(getFirestore(), "comments/" + props.id + "/rtc"),
        orderBy("timestamp", "asc")
      ),
      (snapshot) => {
        let commentsToPush: DocumentSnapshot[] = snapshot.docs;
        pushToComments(commentsToPush);
      }
    );
    return () => {
      unsub();
    };
  }, []);

  return (
    <div className="w-full bg-gray-200 max-h-[400px] rounded mt-6 px-4 py-2 flex flex-col">
      {comments.map((comment) => {
        let data = comment.data();
        return (
          <div key={comment.id} className="flex flex-row">
            <CommentUser key={comment.id} data={data} />
          </div>
        );
      })}
    </div>
  );
};

const CommentUser = (props: any) => {
  const [user, setUser] = useState<DocumentData>();
  useEffect(() => {
    getDoc(doc(getFirestore(), "users/" + props.data.author_uid)).then(
      (document) => {
        if (document.exists()) {
          setUser(document.data());
        }
      }
    );
  }, []);

  return (
    <>
      {user && (
        <p>
          {<span className="font-bold">{user.f_name + " " + user.l_name}</span>}
          : {props.data.content}
        </p>
      )}
    </>
  );
};

const MapFullScreenPopUp = (props: any) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_mapApiKey,
  });

  const [map, setMap] = useState(null);
  const onLoad = useCallback(function callback(map: any) {
    // This is just an example of getting and using the map instance!!! don't just blindly copy!
    const bounds = new window.google.maps.LatLngBounds(
      new google.maps.LatLng({
        lat: props.coordinates[0],
        lng: props.coordinates[1],
      })
    );
    map.fitBounds(bounds);

    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: any) {
    setMap(null);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="h-full w-full p-32 fixed top-0 left-0 bg-black bg-opacity-20 z-50"
    >
      <button
        onClick={() => {
          props.setMapPopUp(false);
        }}
        className="fixed top-12 right-16 bg-white p-4 flex justify-center items-center rounded-full"
      >
        <img src="close.svg" className="" />
      </button>

      <motion.div
        className="h-full w-full rounded-lg bg-white relative overflow-hidden shadow-inner z-60"
        layoutId="map"
      >
        {isLoaded && props.posts && props.coordinates && (
          <GoogleMap
            mapContainerClassName="h-full w-full"
            center={{
              lat: props.coordinates[0],
              lng: props.coordinates[1],
            }}
            zoom={10}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {props.posts.map((doc: any) => {
              return (
                <MarkerF
                  key={doc.id}
                  label={doc.data()!.title}
                  position={
                    new google.maps.LatLng(
                      doc.data()!.location["_lat"],
                      doc.data()!.location["_long"]
                    )
                  }
                />
              );
            })}
          </GoogleMap>
        )}
        <div className="absolute bottom-0 bg-gradient-to-t text-xl from-gray-700 to-transparent p-8 text-white font-light w-full">
          There are <span className="font-bold">{props.posts?.length}</span>{" "}
          reports in your area
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MainUX;
