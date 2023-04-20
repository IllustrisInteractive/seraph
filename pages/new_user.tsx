import { User } from "firebase/auth";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AuthenticationManager } from "../core/firebase/Authentication";
import { UserModel } from "../core/model/User";
import { Geocoder } from "../core/maps/geocoding";
import { GeoPoint } from "firebase/firestore";
import {
  FirestoreQueryController,
  UploadableUserData,
} from "../core/firebase/Firestore";
import { Geohash, geohashForLocation } from "geofire-common";

const NewUser: NextPage = () => {
  const [geolocation, setGeolocation] = useState<Geolocation | null>(null);
  const [showLocationOptions, setLocationOptions] = useState(true);
  const [location, setLocation] = useState<string>("");
  const [num, setNum] = useState(0);
  const [coordinates, setCoordinates] = useState<[number, number]>([0, 0]);
  const [user, setUser] = useState<User | null>();
  const [showCityState, setCityState] = useState(false);
  const [useGPS, setUseGPS] = useState(false);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(1);
  const [form_verified, setVerified] = useState(false);
  const [form, setForm] = useState<any>();
  const router = useRouter();
  const [stateSelection, setStateSelection] = useState<any[]>();
  const [citySelection, setCitySelection] = useState<any[]>();
  const [selectedState, setSelectedState] = useState<any>();
  const [selectedCity, setSelectedCity] = useState<any>();
  let authManager: AuthenticationManager;
  let queryController: FirestoreQueryController =
    new FirestoreQueryController();
  let geocoder: Geocoder = new Geocoder(
    "AIzaSyA9cJAWTnuOvfK3w_S22YKTkgVYTTbhfzw"
  );

  const handleSelect = () => {
    setCityState(true);
  };

  const handleFName = (e: any) => {
    let formCopy = { ...form };
    formCopy["f_name"] = e.target.value;
    setForm(formCopy);
  };

  const handleLName = (e: any) => {
    let formCopy = { ...form };
    formCopy["l_name"] = e.target.value;
    setForm(formCopy);
  };

  const handleDOB = (e: any) => {
    let formCopy = { ...form };
    formCopy["dob"] = e.target.value;
    setForm(formCopy);
  };

  const handleLocation = (latlng: number[]) => {
    let formCopy = { ...form };
    formCopy["default_location"] = new GeoPoint(latlng[0], latlng[1]);
    setForm(formCopy);
  };

  useEffect(() => {
    fetch(`https://psgc.gitlab.io/api/provinces/${selectedState}/cities`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Data: ", data);
        setCitySelection(data);
      });
  }, [selectedState]);

  const uploadUserData = () => {
    let userData: UploadableUserData = {
      f_name: form["f_name"],
      l_name: form["l_name"],
      date_of_birth: form["dob"],
      default_location: form["default_location"],
      default_location_hash: geohashForLocation([
        coordinates[0],
        coordinates[1],
      ]),
    };

    queryController.uploadUserData(
      userData,
      user!.uid,
      () => {
        router.replace("/");
      },
      (error: Error) => {
        router.reload();
      }
    );
  };

  useEffect(() => {
    if (selectedCity) {
      geocoder.addressToCoordinates(selectedCity, (latlng) => {
        setCoordinates([latlng["lat"], latlng["lng"]]);
        let formCopy = { ...form };
        formCopy["default_location"] = new GeoPoint(
          latlng["lat"],
          latlng["lng"]
        );
        setForm(formCopy);
      });
    }
  }, [selectedCity]);

  useEffect(() => {
    if (!user && ready) {
      router.replace("/");
    } else if (ready) {
      let model = new UserModel(
        user!,
        () => {
          router.replace("/");
        },
        () => {}
      );
    }
  }, [user]);

  useEffect(() => {
    if (navigator.geolocation) {
      setGeolocation(navigator.geolocation);
    }
    authManager = new AuthenticationManager(
      (user) => {
        setReady(true);
        setUser(user);
      },
      () => {
        router.replace("/");
      }
    );
    fetch("https://psgc.gitlab.io/api/provinces/", { method: "GET" })
      .then((data) => data.json())
      .then((dataJSON) => {
        dataJSON = dataJSON.sort((a: any, b: any) => {
          if (a.name < b.name) {
            return -1;
          }
        });
        setStateSelection(dataJSON);
      });
  }, []);

  useEffect(() => {});

  useEffect(() => {
    if (
      ready &&
      form["f_name"] &&
      form["l_name"] &&
      form["dob"] &&
      form["default_location"]
    ) {
      setVerified(true);
    }
  }, [form]);

  useEffect(() => {
    if (useGPS) {
      geocoder.geocodeToAddress(
        coordinates,
        (result) => {
          setLocation(result["data"]["results"][0]["formatted_address"]);
          handleLocation([
            result["data"]["results"][0]["geometry"]["location"]["lat"],
            result["data"]["results"][0]["geometry"]["location"]["lng"],
          ]);
        },
        () => {}
      );
    }
  }, [useGPS]);
  return (
    <div className="h-screen w-screen px-16 py-16 bg-blue-50">
      <Head>
        <title>Welcome | SERAPH</title>
      </Head>
      <div className="h-full rounded-lg drop-shadow-xl bg-white grid grid-cols-2 p-8 overflow-hidden">
        <div className="bg-black -m-8 mr-8">
          {/* Picture elements, no UI */}
        </div>
        <div className="h-full flex flex-col">
          <p className="font-bold text-4xl">Welcome to SERAPH</p>
          <p className="text-2xl">Let's set up your account.</p>
          <div className="h-12" />
          <div className="flex flex-col h-2/3 space-y-4">
            <p className="font-bold">Basic Information</p>
            <div className="flex flex-row w-full">
              <input
                placeholder="First Name"
                className="px-4 py-2 rounded shadow col-span-1 w-1/2 mr-2 border-gray-400 border"
                onChange={handleFName}
              />
              <input
                placeholder="First Name"
                className="px-4 py-2 rounded shadow col-span-1 w-1/2 ml-2 border-gray-400 border"
                onChange={handleLName}
              />
            </div>
            <div className="flex flex-col col-span-2 space-y-2">
              <label className="font-bold">Date of Birth</label>
              <input
                type="date"
                className="px-4 py-2 rounded shadow border-gray-400 border"
                onChange={handleDOB}
              />
            </div>
            <div className="flex flex-col col-span-2 space-y-2">
              <label className="font-bold">Location</label>
              <p className="text-gray-400 text-sm">
                By default, SERAPH will use location services. If this is not
                available (ie. The user refused to grant SERAPH access to
                location services) then SERAPH will use the default location you
                registered instead.{" "}
                <span className="font-bold">
                  You can always update this later.
                </span>
              </p>
              {showLocationOptions && (
                <div className="flex flex-row w-full">
                  {geolocation ? (
                    <button
                      onClick={() => {
                        geolocation.getCurrentPosition(
                          (position) => {
                            setUseGPS(true);
                            setLocationOptions(false);
                            setCoordinates([
                              position.coords.latitude,
                              position.coords.longitude,
                            ]);
                          },
                          () => {
                            alert(
                              "Unable to retrieve your location. You may have declined a pop-up requesting for your current location. Check your settings and try again."
                            );
                          }
                        );
                      }}
                      className="hover:scale-105 transition hover:border border-blue-500  flex flex-col w-1/2 items-center justify-center bg-white drop-shadow-lg rounded p-4"
                    >
                      <p className="font-bold">Use location services</p>
                      <p className="text-sm text-gray-400">
                        Use the most precise location data as your default
                        location.
                      </p>
                    </button>
                  ) : (
                    <button className="flex flex-col w-1/2 items-center justify-center bg-white drop-shadow-lg rounded p-4 disabled opacity-80">
                      <p className="font-bold">Use location services</p>
                      <p className="text-sm text-gray-400">
                        Not supported by your browser.
                      </p>
                    </button>
                  )}
                  <div className="h-full border-gray-200 border-l-2 mx-4" />
                  <button
                    onClick={() => {
                      setCityState(true);
                      setLocationOptions(false);
                    }}
                    className="hover:scale-105 transition hover:border border-blue-500 flex flex-col w-1/2 items-center justify-center bg-white drop-shadow-lg rounded p-4"
                  >
                    <p className="font-bold">Enter City and State</p>
                    <p className="text-sm text-gray-400">
                      Use a general location (your city) as your default
                      location.
                    </p>
                  </button>
                </div>
              )}
              {showCityState && (
                <div className="grid grid-cols-2">
                  <label>State</label>
                  <label>City</label>

                  <select
                    onChange={(e) => {
                      alert(e.target.value);
                      setSelectedState(e.target.value);
                    }}
                  >
                    {stateSelection?.map((state) => {
                      return (
                        <option label={state["name"]} value={state["code"]} />
                      );
                    })}
                  </select>
                  <select
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                    }}
                  >
                    {citySelection &&
                      citySelection?.map((city) => {
                        return (
                          <option label={city["name"]} value={city["name"]} />
                        );
                      })}
                  </select>

                  <a
                    onClick={() => {
                      setCityState(false);
                      setLocationOptions(true);
                    }}
                    className="row-span-1 col-span-2 cursor-pointer"
                  >
                    Return to Location Options
                  </a>
                </div>
              )}
              {useGPS && (
                <div className="flex flex-col p-4 bg-white drop-shadow-lg items-center">
                  <p className="text-center">
                    You are currently in{" "}
                    <span className="font-bold">{location}</span>
                  </p>
                  <p className="text-xs mb-4">
                    Latitude: {coordinates[0]}, Longhitude: {coordinates[1]}
                  </p>
                  <a
                    onClick={() => {
                      setLocationOptions(true);
                      setUseGPS(false);
                    }}
                    className="row-span-1 col-span-2 cursor-pointer"
                  >
                    Return to Location Options
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="grow" />
          <button
            className={`py-2 mb-2 font-bold text-white rounded drop-shadow-lg transition ${
              form_verified
                ? "bg-blue-500 hover:bg-blue-400 hover:scale-105"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={() => {
              uploadUserData();
            }}
          >
            Finish setting up account
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewUser;
