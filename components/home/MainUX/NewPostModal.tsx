import { useState, useRef, useEffect, FunctionComponent } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NewPostModal = (props: any) => {
  const [category, setCategory] = useState<
    "accident" | "incident" | "hazard" | "crime" | undefined
  >();
  const [postVerified, setPostVerified] = useState(false);
  const [filesSelected, setFiles] = useState<File[]>();
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFileInput = (e: any) => {
    if (filesSelected && filesSelected?.length + e.target.files.length <= 5) {
      let filesSelectedCopy = [...filesSelected];
      filesSelectedCopy.push(...e.target.files);
      setFiles(filesSelectedCopy);
    } else if (!filesSelected) {
      if (e.target.files.length > 5)
        alert(
          "Only a maximum of 5 media content can be uploaded in one report. Please reduce the number of media to upload."
        );
      else setFiles(e.target.files);
    } else {
      alert(
        "Only a maximum of 5 media content can be uploaded in one report. Please reduce the number of media to upload."
      );
    }
  };

  useEffect(() => {
    if (category) setPostVerified(true);
    else setPostVerified(false);
  }, [category]);

  interface MediaContentProps {
    file: File;
  }

  const MediaContent: FunctionComponent<MediaContentProps> = (props) => {
    if (props.file.type.includes("video")) {
      return (
        <video controls>
          <source src={URL.createObjectURL(props.file)} className="h-full" />
        </video>
      );
    } else {
      return (
        <motion.div className="h-36 overflow-hidden rounded-lg py-2 relative flex justify-center items-center group">
          <img
            src={URL.createObjectURL(props.file)}
            className="object-cover rounded-lg"
          />
          <button className="group-hover:block absolute text-white hidden z-50">
            Remove
          </button>
          <div className="bg-transparent opacity-20 group-hover:bg-black absolute h-full w-full z-40"></div>
        </motion.div>
      );
    }
  };

  const CategoryTag = (props: any) => {
    if (props.category == "incident")
      return (
        <motion.div
          layoutId={category}
          className="flex flex-row text-sm font-bold px-4 py-1 w-fit rounded-full bg-orange-400 text-white items-center space-x-2"
        >
          <p>Incident</p>
          <button
            className="text-orange-400 rounded-full bg-white h-4 w-4 flex justify-center items-center"
            onClick={() => {
              setCategory(undefined);
            }}
          >
            x
          </button>
        </motion.div>
      );
    if (props.category == "accident")
      return (
        <motion.div
          layoutId={category}
          className="flex flex-row text-sm font-bold px-4 py-1 w-fit rounded-full bg-orange-400 text-white items-center space-x-2"
        >
          <p>Accident</p>
          <button
            className="text-orange-400 rounded-full bg-white h-4 w-4 flex justify-center items-center"
            onClick={() => {
              setCategory(undefined);
            }}
          >
            x
          </button>
        </motion.div>
      );
    if (props.category == "crime")
      return (
        <motion.div
          layoutId={category}
          className="flex flex-row text-sm font-bold items-center px-4 py-1 space-x-2 w-fit rounded-full bg-red-600 text-white"
        >
          <p>Crime</p>
          <button
            className="text-red-600 rounded-full bg-white h-4 w-4 flex justify-center items-center"
            onClick={() => {
              setCategory(undefined);
            }}
          >
            x
          </button>
        </motion.div>
      );
    if (props.category == "hazard")
      return (
        <motion.div
          layoutId={category}
          className="flex flex-row text-sm font-bold px-4 py-1 w-fit rounded-full bg-orange-400 text-white items-center space-x-2"
        >
          <p>Hazard</p>
          <button
            className="text-orange-400 rounded-full bg-white h-4 w-4 flex justify-center items-center"
            onClick={() => {
              setCategory(undefined);
            }}
          >
            x
          </button>
        </motion.div>
      );
    return null;
  };
  return (
    <motion.div className="h-screen w-screen fixed flex flex-col justify-center items-center z-50">
      <motion.div
        className="bg-white rounded-xl flex flex-col shadow-lg w-1/2 z-50"
        layoutId="newPostModal"
        layout="position"
      >
        <motion.div className="relative flex flex-row justify-center items-center w-full">
          <p className="text-xl font-bold text-center py-4">Create Report</p>
          <button
            onClick={() => {
              props.toggleModal();
            }}
            className="h-8 w-8 absolute right-8 rounded-full bg-gray-400"
          >
            x
          </button>
        </motion.div>
        <motion.div
          className="text-lg bg-gray-200 flex py-4 px-8 font-bold flex-col"
          layout="position"
          layoutId={category}
        >
          <AnimatePresence>
            {category && <CategoryTag category={category} />}
          </AnimatePresence>
          <motion.div className="flex flex-row">
            <motion.div className="flex flex-col grow">
              <input
                placeholder="Give your report a title"
                className="bg-transparent outline-none"
              />
              <input
                placeholder="Write some details about your report"
                className="mb-8 bg-transparent outline-none font-normal"
              />
            </motion.div>
            <motion.div>
              {!filesSelected && (
                <motion.button
                  layout="position"
                  layoutId="files"
                  onClick={(e) =>
                    fileInput.current && fileInput.current.click()
                  }
                  className="px-4 py-2 rounded-xl hover:bg-white hover:drop-shadow transition flex flex-row items-center space-x-4"
                >
                  <img src="squares-plus.svg" className="h-8 w-8" />
                  <input
                    accept="audio/*,video/*,image/*"
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    ref={fileInput}
                  />
                  <p>Add Media</p>
                </motion.button>
              )}
            </motion.div>
          </motion.div>
          <AnimatePresence>
            {!category && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="text-black flex flex-row space-x-4 bg-gray-200 w-full justify-center"
              >
                <motion.button
                  className="px-4 py-2 rounded-lg bg-white grow hover:drop-shadow transition"
                  layoutId="incident"
                  onClick={() => {
                    setCategory("incident");
                  }}
                >
                  Incident
                </motion.button>
                <motion.button
                  className="px-4 py-2 rounded-lg bg-white grow hover:drop-shadow transition"
                  layoutId="accident"
                  onClick={() => {
                    setCategory("accident");
                  }}
                >
                  Accident
                </motion.button>
                <motion.button
                  className="px-4 py-2 rounded-lg bg-white grow hover:drop-shadow transition"
                  layoutId="hazard"
                  onClick={() => {
                    setCategory("hazard");
                  }}
                >
                  Hazard
                </motion.button>
                <motion.button
                  className="px-4 py-2 rounded-lg bg-white grow hover:drop-shadow transition"
                  layoutId="crime"
                  onClick={() => {
                    setCategory("crime");
                  }}
                >
                  Crime
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          {filesSelected && (
            <motion.div
              layout="position"
              layoutId="files"
              className="grid grid-cols-5 mt-4 gap-x-2"
            >
              {Array.from(filesSelected).map((file: File) => {
                return <MediaContent file={file} />;
              })}
              {filesSelected.length < 5 && (
                <motion.button
                  layout="position"
                  onClick={(e) =>
                    fileInput.current && fileInput.current.click()
                  }
                  className="px-4 py-2 grow rounded-xl hover:bg-white hover:drop-shadow transition flex flex-row justify-center items-center space-x-4"
                >
                  <img src="squares-plus.svg" className="h-8 w-8" />
                  <input
                    accept="audio/*,video/*,image/*"
                    type="file"
                    onChange={handleFileInput}
                    className="hidden grow"
                    multiple
                    ref={fileInput}
                  />
                  <p>Add Media</p>
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>

        <button
          onClick={() => {
            props.toggleModal();
          }}
          className={`mx-8 my-4 py-2 rounded-lg drop-shadow-lg font-bold text-white mx-4 my-2 z-30 transition ${
            postVerified ? "bg-blue-400" : "bg-gray-400 pointer-events-none"
          }`}
        >
          Publish Post
        </button>
      </motion.div>
      <motion.div
        className="h-full w-full fixed bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      ></motion.div>
    </motion.div>
  );
};

export default NewPostModal;
