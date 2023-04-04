import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useAuthState, useSignInWithGoogle } from "react-firebase-hooks/auth";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useEffect, useState } from "react";
import SignInPage from "./login";
import MainUX from "../components/home/MainUX";
import { AnimatePresence } from "framer-motion";
import { app } from "../core/firebase/FirebaseConfig";
import { AuthenticationManager } from "../core/firebase/Authentication";
import { Router, useRouter } from "next/router";

const Home: NextPage = () => {
  const [user, setUser] = useState<User | undefined>();
  const [signIn, showSignIn] = useState(false);

  const router = useRouter();

  const authManager = new AuthenticationManager((user) => {
    if (user) {
      setUser(user);
    } else {
      setUser(undefined);
      showSignIn(true);
    }
  });

  useEffect(() => {
    if (signIn) {
      router.replace("/login");
    }
  }, [user, signIn]);
  return (
    <>
      {user && (
        <button
          onClick={() => {
            authManager.signOut();
          }}
        >
          Sign out
        </button>
      )}{" "}
    </>
  );
};

export default Home;
