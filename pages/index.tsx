import { NextPage } from "next";
import { AuthenticationManager } from "../core/firebase/Authentication";
import { useEffect, useState } from "react";
import { UserModel } from "../core/model/User";
import { useRouter } from "next/router";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import Head from "next/head";
import LoadingElement from "../components/home/loadingElement";
import MainUX from "../components/home/MainUX";

const Home: NextPage = () => {
  const [user, setUser] = useState<UserModel>();
  const [ready, setReady] = useState(false);
  const [authManager, setManager] = useState<AuthenticationManager>();
  const router = useRouter();
  const [slowLoading, setSlowLoadingWarning] = useState(false);

  useEffect(() => {
    setReady(true);
    setManager(
      new AuthenticationManager(
        (fetchedUser) => {
          if (fetchedUser && !user) {
            let model = new UserModel(
              fetchedUser,
              (userModel) => {
                console.log(userModel);
                setUser(userModel);
              },
              (error) => {
                router.replace("/new_user");
              }
            );
          } else if (!fetchedUser) {
            router.replace("/login");
          }
        },
        (error) => {
          console.log(error);
        }
      )
    );

    const timer = setTimeout(() => {
      setSlowLoadingWarning(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="h-screen w-screen flex flex-col items-center">
      <Head>
        <title>SERAPH - Keeping you safe</title>
      </Head>
      <AnimatePresence mode="wait">
        {!user && <LoadingElement />}
      </AnimatePresence>
      {user && <MainUX user={user} authManager={authManager} />}
      {slowLoading && !user && (
        <motion.div
          className="shadow-lg rounded-lg p-4 absolute bottom-8 text-center text-sm font-bold bg-red-600 w-1/3 text-white justify-self-center"
          initial={{ y: "10vh" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          SERAPH is taking longer than usual to load. Don't worry, we're still
          trying, but check your Internet connection if it's spotty.
        </motion.div>
      )}
    </div>
  );
};

export default Home;
