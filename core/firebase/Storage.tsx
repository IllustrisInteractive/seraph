import { app } from "./FirebaseConfig";
import {
  FirebaseStorage,
  StorageError,
  StorageReference,
  UploadMetadata,
  UploadResult,
  UploadTask,
  UploadTaskSnapshot,
  getDownloadURL,
  getMetadata,
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
} from "firebase/storage";

export class StorageController {
  private storage: FirebaseStorage;

  constructor() {
    this.storage = getStorage(app);
  }

  upload(
    file: UploadableAsset,
    reference: string,
    callback?: (result: UploadResult) => {},
    metadata?: UploadMetadata
  ) {
    uploadBytes(ref(this.storage, reference), file.file, metadata).then(
      (result) => {
        if (callback) callback(result);
      }
    );
  }

  async upload_files(
    files: File[],
    reference: string,
    onFinishCallback: Function
  ) {
    const promises: Promise<any>[] = [];
    Array.from(files).forEach((file) => {
      const storageRef = ref(this.storage, reference + "/" + file.name);
      promises.push(uploadBytes(storageRef, file));
    });
    await Promise.all(promises).then(() => {
      onFinishCallback();
    });
  }

  uploadResumable(
    file: UploadableAsset,
    reference: string,
    onStateChangedCallback: (snapshot: UploadTaskSnapshot) => {},
    onErrorCallback?: (error: StorageError) => {},
    onFinishCallback?: (task: UploadTask) => {},
    metadata?: UploadMetadata
  ): UploadTask {
    let uploadTask: UploadTask = uploadBytesResumable(
      ref(this.storage, reference),
      file.file,
      metadata
    );
    uploadTask.on(
      "state_changed",
      (snapshot) => onStateChangedCallback(snapshot),
      (error) => onErrorCallback && onErrorCallback(error),
      () => onFinishCallback && onFinishCallback(uploadTask)
    );
    return uploadTask;
  }

  async downloadImageAsset(reference: string): Promise<ImageAsset | undefined> {
    let metadata = await getMetadata(ref(this.storage, reference));
    if (metadata.contentType && metadata.contentType.includes("image")) {
      let returnedAsset = await getDownloadURL(ref(this.storage, reference));
      return await new ImageAsset(returnedAsset);
    } else return;
  }
}

let UploadableExtensions: string[] = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "webm",
];

export class UploadableAsset {
  file: File;
  extension?: string;

  constructor(file: File) {
    this.file = file;
    this.extension = file.name.split(".").pop();
    if (this.extension && UploadableExtensions.indexOf(this.extension) > -1) {
      return;
    } else if (!this.extension) {
      throw new Error("No Extension");
    } else {
      throw new Error(
        "UploadableAsset has an unsupported File Extension. Extension received: " +
          this.extension
      );
    }
  }
}

interface Asset {
  url: string;
}

export class ImageAsset implements Asset {
  url: string;
  height?: number;
  width?: number;
  element: HTMLImageElement;

  constructor(url: string) {
    this.url = url;
    this.element = new Image();
  }
}
