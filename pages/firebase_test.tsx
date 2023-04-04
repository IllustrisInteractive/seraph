import { ChangeEventHandler, useEffect, useState } from "react";
import {
  FirestoreQueryController,
  FirestoreSubscriptionController,
  UserQuery,
  QueryData,
  UserQueryData,
} from "../core/firebase/Firestore";
import {
  DocumentData,
  DocumentReference,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import {
  ImageAsset,
  StorageController,
  UploadableAsset,
} from "../core/firebase/Storage";

function FirebaseTest() {
  const [file, setFile] = useState<File | undefined>();

  const setStateFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    setFile(e?.target?.files?.[0]);
  };

  const uploadFile = () => {
    if (file) {
      let controller = new StorageController();
      let asset = new UploadableAsset(file);
      controller.upload(asset, asset.file.name);
    }
  };

  return (
    <>
      <input type="file" onChange={setStateFile} />
      {file && (
        <button onClick={uploadFile} className="p-4 bg-black text-white ml-4">
          Upload
        </button>
      )}
    </>
  );
}

export default FirebaseTest;
