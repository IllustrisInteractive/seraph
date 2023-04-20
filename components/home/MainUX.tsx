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
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import NewPostModal from "./MainUX/NewPostModal";
import { distanceBetween, geohashQueryBounds } from "geofire-common";
import {
  DocumentData,
  DocumentReference,
  Query,
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  startAt,
  where,
} from "firebase/firestore";
import { BeatLoader, CircleLoader } from "react-spinners";

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
  const [categoryFilter, setFilter] = useState<
    "incident" | "accident" | "hazard" | "crime" | undefined
  >();

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

  const toggleModal = () => {
    setNewPostModal(!newPostModal);
  };

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
      props.user.setCurrentLocation(coordinates);
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
      <AnimatePresence>
        {newPostModal && (
          <NewPostModal toggleModal={toggleModal} user={props.user} />
        )}
      </AnimatePresence>
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
          <p>Filter by Category</p>
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
                coordinates={coordinates}
                categoryFilter={categoryFilter}
              />
            </>
          )}
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

const FeedManager = (props: any) => {
  const [posts, setPosts] = useState<any[]>();
  const [loading, setLoading] = useState(false);
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
            if (distanceInM <= 50 * 1000) {
              let data = document.data();
              data["distance"] = distanceInM;
              matchingDocs.push(data);
            }
          }
        }

        return matchingDocs;
      })
      .then((matchingDocs) => {
        setLoading(false);
        setPosts(matchingDocs);
      });
  };

  return (
    <motion.div className="w-full flex flex-col items-center">
      {loading && (
        <>
          <CircleLoader className="mb-4" /> <p>Now loading your feed</p>
        </>
      )}
      {!loading &&
        posts &&
        posts.map((postData: any) => {
          return <Post data={postData} />;
        })}
    </motion.div>
  );
};

const Post = (props: any) => {
  const [ownerData, setOwner] = useState<DocumentData | null>(null);

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
      setOwner(userDoc);
    });
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
  return (
    <div className="bg-white w-full rounded-lg shadow-lg p-4 mb-4 flex flex-col overflow-hidden">
      {ownerData && (
        <>
          <div className="flex flex-row space-x-2">
            {" "}
            {/** Post component header */}
            <div className="h-9 w-9 rounded-full bg-black">
              {/** Profile picture placeholder */}
            </div>
            <div className="flex flex-col h-9 grow">
              <p className="font-bold text-sm">
                {`${ownerData["f_name"]} ${ownerData["l_name"]}`}
              </p>
              <p className="font-bold text-gray-400 text-xs">
                {timeDifferenceString()} - {props.data.distance / 1000} km away
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
            <div
              className={`px-2 py-1 rounded-full font-bold text-xs text-center ${getCategoryColor()} w-fit`}
            >
              {props.data["category"].charAt(0).toUpperCase() +
                props.data["category"].slice(1)}
            </div>
            <p className="font-bold text-xl">{props.data.title}</p>
            <p className="leading-tight mt-2 grow">{props.data.content}</p>
          </div>
          <div className="bg-gradient-to-r from-transparent via-gray-300 to-transparent h-[1px] mt-2" />
          <div className="grid grid-cols-3 h-12 -mb-4 -ml-4 -mr-4">
            <button className="hover:bg-gray-200 font-bold">Upvote</button>
            <button className="hover:bg-gray-200 font-bold">Downvote</button>
            <button className="hover:bg-gray-200 font-bold">Comments</button>
          </div>
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

export default MainUX;

<div className="bg-white rounded-lg shadow-lg p-4 flex flex-col overflow-hidden">
  <div className="flex flex-row space-x-2">
    {" "}
    {/** Post component header */}
    <div className="h-9 w-9 rounded-full bg-black">
      {/** Profile picture placeholder */}
    </div>
    <div className="flex flex-col h-9 grow">
      <p className="font-bold text-sm">Test Account</p>
      <p className="font-bold text-gray-400 text-xs">2h - 0.3km away</p>
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
      Caption here. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      Praesent placerat metus ac consequat elementum. Aenean tincidunt ut elit
      vitae porttitor. Nulla quam nulla, gravida nec velit non, tristique ornare
      diam.
    </p>
  </div>
  <div className="bg-gradient-to-r from-transparent via-gray-300 to-transparent h-[1px] mt-2" />
  <div className="grid grid-cols-3 h-12 -mb-4 -ml-4 -mr-4">
    <button className="hover:bg-gray-200 font-bold">Upvote</button>
    <button className="hover:bg-gray-200 font-bold">Downvote</button>
    <button className="hover:bg-gray-200 font-bold">Comments</button>
  </div>
</div>;
