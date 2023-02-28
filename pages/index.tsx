import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useAuthState, useSignInWithGoogle } from "react-firebase-hooks/auth";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useEffect, useState } from "react";
import SignInPage from "../components/home/SignInPage";
import MainUX from "../components/home/MainUX";
import { AnimatePresence } from "framer-motion";

const Home: NextPage = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyBRhKXktJuQPsWMtPp2Ep6r9BIfDgJ9Bp0",
    authDomain: "seraph-f8751.firebaseapp.com",
    projectId: "seraph-f8751",
    storageBucket: "seraph-f8751.appspot.com",
    messagingSenderId: "722676641961",
    appId: "1:722676641961:web:736ab461fa9758663f79b8",
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const [signInWithGoogle, user_cred, loading, error] =
    useSignInWithGoogle(auth);
  const [signIn, showSignIn] = useState(false);
  const [delay, setDelay] = useState(0);
  const [user, user_loading, user_error] = useAuthState(auth);

  useEffect(() => {
    if (!user_loading) {
      if (user) {
        showSignIn(false);
      } else {
        showSignIn(true);
      }
    }
  }, [user_loading]);
  return (
    <>
      <AnimatePresence mode="wait">
        <>
          {
            // This component is displayed if the user is signed in.
            user && <MainUX user={user} auth={auth} app={app} />
          }
          {signIn && (
            <SignInPage
              key="sign_in_ux"
              signInWithGoogle={signInWithGoogle}
              showSignIn={showSignIn}
              loading={loading}
              delay={delay}
            />
          )}
        </>
      </AnimatePresence>
    </>
  );
};

export default Home;
