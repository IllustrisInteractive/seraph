import { NextPage } from "next";
import Head from "next/head";
import { ScriptProps } from "next/script";
import { FunctionComponent, useEffect, useState } from "react";
import { animate, AnimatePresence, easeInOut, motion } from "framer-motion";
import { BeatLoader } from "react-spinners";
import { AuthenticationManager } from "../core/firebase/Authentication";
import { useRouter } from "next/router";

const SignInPage: FunctionComponent = () => {
  const [email, setEmail] = useState(false);
  const [password, setPass] = useState(false);
  const [signingIn, setSigning] = useState(false);

  const router = useRouter();

  let authManager: AuthenticationManager;

  useEffect(() => {
    document.title = "Log In | Seraph";
    authManager = new AuthenticationManager(
      (user) => {
        if (user) {
          router.replace("/");
        }
      },
      () => {}
    );
  }, []);

  function handleEmail(e: any): void {
    if (
      e.target.value.match(
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$/
      )
    )
      setEmail(true);
    else setEmail(false);
  }

  function handleSignIn() {}

  function handleSignInWithGoogle() {
    setSigning(true);
    authManager.authenticateUserWithGoogle((error) => {
      console.log(error);
      setSigning(false);
    });
  }

  function handlePassword(e: any): void {
    if (e.target.value.length > 8) setPass(true);
    else setPass(false);
  }
  return (
    <>
      <motion.div
        className="grid grid-cols-2 h-screen"
        exit={{ opacity: 0, scale: 0.75 }}
        transition={{ duration: 1, ease: easeInOut }}
      >
        <div className="bg-black" />
        <motion.div className="bg-white flex flex-col justify-center items-center">
          <motion.h1 className="text-6xl font-bold w-3/4 text-center">
            Help protect your own community today.
          </motion.h1>
          <motion.div className="h-16" />
          <AnimatePresence mode="wait">
            {!signingIn ? (
              <motion.div
                key="signing_ui"
                className="flex flex-col justify-center items-center w-full"
                initial={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: "-25vw" }}
                transition={{ duration: 1, ease: easeInOut }}
              >
                <form className="flex flex-col w-1/2 space-y-2">
                  <input
                    type="email"
                    placeholder="Email"
                    className="text-lg outline-none py-2 border-b-2 border-gray-300 focus:border-blue-700 transition-colors"
                    onChange={handleEmail}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    onChange={handlePassword}
                    className="text-lg outline-none py-2 border-b-2 border-gray-300 focus:border-blue-700 transition-colors"
                  />
                  <input
                    type="submit"
                    value="Log in"
                    className={`cursor-pointer text-lg font-bold py-2 rounded text-white transition-colors ${
                      email && password
                        ? "bg-blue-700 hover:scale-105 transition-transform"
                        : "bg-gray-400 pointer-events-none"
                    }`}
                    onClick={() => handleSignIn()}
                  />
                  <div className="flex flex-row">
                    <a href="">Create an account</a>
                    <div className="grow" />
                    <a href="">Reset password</a>
                  </div>
                </form>

                <p className="text-sm mt-8 mb-4">
                  or use a faster way to sign in
                </p>
                <button
                  className="mb-4 bg-white rounded-lg drop-shadow-lg flex justify-center items-center h-12 w-1/2"
                  onClick={() => handleSignInWithGoogle()}
                >
                  <img className="h-full" src="/google_btn.svg" />
                  <p className="text-lg mr-4">Continue with Google</p>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="signing_in_progress"
                initial={{ opacity: 0, x: 0 }}
                exit={{ opacity: 0, x: "-25vw" }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: easeInOut }}
                className="flex flex-col justify-center items-center space-y-2 mb-4"
              >
                <BeatLoader />
                <p>Signing you in</p>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.p className="w-2/4 text-center text-sm text-gray-400">
            By signing in, you agree to Seraph's Terms and Conditions and
            Privacy Policy.
          </motion.p>

          <motion.div className="h-8" />
          <motion.a
            className="cursor-pointer"
            onClick={() => {
              router.replace("/");
            }}
          >
            Return to Home Page
          </motion.a>
        </motion.div>
      </motion.div>
    </>
  );
};

export default SignInPage;
