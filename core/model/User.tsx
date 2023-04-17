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
    if (!this._profilePicture) return undefined;
    else return this.profilePicture;
  }

  private _defaultLocation: [number, number];
  public get defaultLocation(): [number, number] {
    return this._defaultLocation;
  }
  private ready: boolean = false;

  private _phoneNumber: string | undefined = undefined;
  public get phoneNumber() {
    return this._phoneNumber;
  }

  private _currentLocation: [number, number];
  public get currentLocation(): [number, number] {
    return this._currentLocation;
  }

  private _authUser: User | undefined;
  public get authUser(): User | undefined {
    return this._authUser;
  }

  constructor(
    user: User,
    modelReturnFunction: (userModel: UserModel) => void,
    modelErrorFunction: (error: Error) => void
  ) {
    this._currentLocation = [0, 0];
    this._defaultLocation = [0, 0];
    let firestoreController = new FirestoreQueryController();
    let query = new UserQuery("users", true, where("__name__", "==", user.uid));
    firestoreController.fetch_user_once(query).then((user_query) => {
      if (user_query.getDocuments().length > 0) {
        let userDoc = user_query.getDocuments()[0];
        this._fName = userDoc["f_name"];
        this._lName = userDoc["l_name"];
        this._dateOfBirth = new Date(userDoc["dateOfBirth"]);
        this._defaultLocation = [
          userDoc["default_location"]["_lat"],
          userDoc["default_location"]["_long"],
        ];
        this.ready = true;
        this._phoneNumber = userDoc["phone_number"];
        this._authUser = user;
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
      } else {
        modelErrorFunction(new Error("No document"));
      }
    });
  }

  getFullName(): string | undefined {
    if (this._fName && this._lName) {
      return this._fName + " " + this._lName;
    }
  }

  getCoordinates(): [number, number] {
    return this._defaultLocation;
  }

  setCurrentLocation(location: [number, number]) {
    this._currentLocation = location;
  }
}
