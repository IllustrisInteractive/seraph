import { motion } from "framer-motion";
import { FunctionComponent } from "react";

const LoadingElement: FunctionComponent = () => {
  return (
    <motion.div
      className="fixed h-screen w-screen flex flex-col justify-center space-y-4 items-center"
      transition={{ ease: "easeInOut" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      key="loading_element"
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
        <b>Did you know?</b> SERAPH can send you notifications of new reports in
        your last known location without logging into the app? Register your
        phone number today to start receiving notifications.
      </motion.p>
    </motion.div>
  );
};

export default LoadingElement;
