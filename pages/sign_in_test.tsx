import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { app } from "../core/firebase/FirebaseConfig";
import { AuthenticationManager } from "../core/firebase/Authentication";
import { UserModel } from "../core/model/User";
import {
  FirestoreQueryController,
  UserQuery,
} from "../core/firebase/Firestore";
import { where } from "firebase/firestore";

const SignInTest = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>();
  const [userModel, setModel] = useState<UserModel>();

  let authManager = new AuthenticationManager((user: User | null) => {
    setUser(user);
    setLoading(false);
  });

  const signInWithGoogle = () => {
    authManager.authenticateUserWithGoogle((error, authCredential) => {
      setLoading(false);
      console.log(error);
    });
  };

  useEffect(() => {
    if (user && !userModel) {
      let model = new UserModel(user, (userModel) => {
        console.log(userModel);
        setModel(userModel);
      });
    }
  }, [user]);
  if (loading) return <>Loading...</>;
  else
    return (
      <>
        {userModel && (
          <div className="flex flex-col">
            <p>Hi, {userModel.getFullName()}</p>
            <img src={userModel.profilePicture?.url} />
          </div>
        )}{" "}
        {!user && (
          <button onClick={signInWithGoogle}>Sign in with Google</button>
        )}
      </>
    );
};

export default SignInTest;
