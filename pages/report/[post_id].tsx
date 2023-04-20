import { useRouter } from "next/router";
import { use, useCallback, useEffect, useState } from "react";
import { FirestoreQueryController } from "../../core/firebase/Firestore";
import { DocumentData } from "firebase/firestore";
import { Geocoder } from "../../core/maps/geocoding";
import Head from "next/head";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

const DedicatedReportPage = () => {
  const [ready, setReady] = useState(false);
  const [post, setPost] = useState<DocumentData>();
  const [owner, setOwner] = useState<DocumentData>();
  const [location, setLocation] = useState();
  const [coordinates, setCoordinates] = useState<[number, number]>();
  const router = useRouter();
  const { post_id } = router.query;

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyA9cJAWTnuOvfK3w_S22YKTkgVYTTbhfzw",
  });

  const [map, setMap] = useState(null);

  const center = coordinates
    ? {
        lat: post!["location"].latitude,
        lng: post!["location"].longitude,
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

  useEffect(() => {
    if (post_id) {
      let controller: FirestoreQueryController = new FirestoreQueryController();
      controller.fetch_doc_once(post_id, "posts", (result) => {
        if (result.exists()) {
          let geocoder: Geocoder = new Geocoder(
            "AIzaSyA9cJAWTnuOvfK3w_S22YKTkgVYTTbhfzw"
          );
          geocoder.geocodeToAddress(
            [
              result!.data()!["location"].latitude,
              result!.data()!["location"].longitude,
            ],
            (val) => {
              setLocation(val["data"]["results"][0]);
            },
            () => {}
          );
          setPost(result.data());
          setCoordinates([
            result!.data()!["location"].latitude,
            result!.data()!["location"].longitude,
          ]);
        } else router.replace("/");
      });
    }
  }, [post_id]);

  useEffect(() => {
    if (post) {
      let controller: FirestoreQueryController = new FirestoreQueryController();

      controller.fetch_doc_once(post["owner_uid"], "users", (result) => {
        setOwner(result.data());
      });
    }
  }, [post]);

  useEffect(() => {
    if (owner && location && coordinates) setReady(true);
  }, [owner, location, coordinates]);

  return (
    <div className="bg-blue-200 p-16 h-screen w-screen flex flex-col justify-center items-center">
      {ready && (
        <div className="bg-gray-50 grow w-full rounded-lg drop-shadow-lg grid grid-cols-2 overflow-hidden">
          <div className="bg-black" />
          <div className="flex flex-col p-8">
            <div className="py-4 px-8 rounded-lg bg-blue-400 text-white text-lg">
              Help keep your community safe, and more, when you join SERAPH.{" "}
              <a href="/" className="font-bold">
                Sign up now.
              </a>
            </div>
            <p className="text-4xl mt-8 font-bold">{post!.title}</p>
            <div className="flex flex-row space-x-2 items-center">
              <p className="font-light">Posted by </p>

              {owner!.profile_picture ? (
                <img
                  className="h-4 w-4 rounded-full"
                  src={owner!.profile_picture}
                />
              ) : (
                <div className="h-4 w-4 rounded-full bg-black" />
              )}
              <p className="font-bold">{owner!.f_name + " " + owner!.l_name}</p>
            </div>
            <p className="text-lg my-8 grow">{post!.content}</p>
            <div className="h-1/2 grid grid-cols-2 w-full gap-x-4">
              <div className="drop-shadow-lg bg-white rounded-lg p-4 flex flex-col">
                <p className="font-bold text-xl mb-2">Live Discussion</p>
                <div className="grow bg-gray-200 rounded"></div>
              </div>
              {isLoaded && (
                <GoogleMap
                  mapContainerClassName="h-full w-full rounded-lg shadow-inner"
                  center={{
                    lat: post!["location"].latitude,
                    lng: post!["location"].longitude,
                  }}
                  zoom={50}
                  onUnmount={onUnmount}
                >
                  {/* Child components, such as markers, info windows, etc. */}
                  <></>
                </GoogleMap>
              )}
            </div>
          </div>
        </div>
      )}
      {!ready && <>Loading</>}
    </div>
  );
};

export default DedicatedReportPage;
