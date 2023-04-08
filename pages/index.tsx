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
  const router = useRouter();
  let authManager: AuthenticationManager;

  useEffect(() => {
    setReady(true);
    authManager = new AuthenticationManager(
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
        } else if (!fetchedUser && ready) {
          router.replace("/login");
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }, []);
  return (
    <div className="h-screen w-screen">
      <Head>
        <title>SERAPH - Keeping you safe</title>
      </Head>
      <AnimatePresence mode="wait">
        {!user && <LoadingElement />}
      </AnimatePresence>
      {user && <MainUX user={user} />}
      <button
        onClick={() => {
          authManager.signOut();
        }}
      >
        Sign Out
      </button>
    </div>
  );
};

export default Home;
