import { User } from "firebase/auth";
import {
  FirestoreQueryController,
  UserQuery,
  UserQueryData,
} from "../firebase/Firestore";
import { where } from "firebase/firestore";
import { ImageAsset, StorageController } from "../firebase/Storage";

export class UserModel {
  private _fName: string | undefined = undefined;
  public get fName(): string | undefined {
    if (!this.fName) throw new Error("UserModel is not yet ready.");
    else return this._fName;
  }
  private _lName: string | undefined = undefined;
  public get lName(): string | undefined {
    if (!this.lName) throw new Error("UserModel is not yet ready.");
    else return this._lName;
  }

  private _dateOfBirth: Date | undefined = undefined;
  public get dateOfBirth(): Date | undefined {
    if (!this.dateOfBirth) throw new Error("UserModel is not yet ready.");
    else return this.dateOfBirth;
  }

  private _profilePicture: ImageAsset | undefined = undefined;
  public get profilePicture(): ImageAsset | undefined {
    if (!this._profilePicture) throw new Error("UserModel is not yet ready.");
    else return this.profilePicture;
  }
  private ready: boolean = false;

  constructor(user: User, modelReturnFunction: (userModel: UserModel) => void) {
    let firestoreController = new FirestoreQueryController();
    let query = new UserQuery("users", true, where("__name__", "==", user.uid));
    firestoreController.fetch_user_once(query).then((user_query) => {
      let userDoc = user_query.getDocuments()[0];
      this._fName = userDoc["f_name"];
      this._lName = userDoc["l_name"];
      this._dateOfBirth = new Date(userDoc["dateOfBirth"]);
      this.ready = true;
      let storageController = new StorageController();
      if (userDoc["profile_picture"]) {
        (async () => {
          this._profilePicture = await storageController.downloadImageAsset(
            userDoc["profile_picture"]
          );
          modelReturnFunction(this);
        })();
      } else {
        this._profilePicture = new ImageAsset("default_picture.png");
        modelReturnFunction(this);
      }
    });
  }

  getFullName(): string | undefined {
    if (this._fName && this._lName) {
      return this._fName + " " + this._lName;
    }
  }
}
