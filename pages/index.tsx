import { NextPage } from "next";
import { AuthenticationManager } from "../core/firebase/Authentication";
import { useState } from "react";
import { UserModel } from "../core/model/User";
import { useRouter } from "next/router";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";

const Home: NextPage = () => {
  const [user, setUser] = useState<UserModel>();
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const authManager = new AuthenticationManager((fetchedUser) => {
    if (fetchedUser && !user) {
      let model = new UserModel(fetchedUser, (userModel) => {
        console.log(userModel);
        setUser(userModel);
      });
    }
  });
  return (
    <div className="h-screen w-screen">
      <AnimatePresence>
        {!user && (
          <motion.div
            className="fixed h-screen w-screen flex flex-col justify-center space-y-4 items-center"
            transition={{ ease: "easeInOut" }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.p
              className="font-bold text-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: "easeInOut", duration: 0.5 }}
            >
              Now loading SERAPH...
            </motion.p>
            <motion.p
              className="text-gray-700 text-xl w-1/2 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: "easeInOut", delay: 0.15, duration: 0.5 }}
            >
              <b>Did you know?</b> SERAPH can send you notifications of new
              reports in your last known location without logging into the app?
              Register your phone number today to start receiving notifications.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
