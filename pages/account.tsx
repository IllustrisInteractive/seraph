import type { NextPage } from "next";
import {
  EmailAuthCredential,
  EmailAuthProvider,
  User,
  getAuth,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AuthenticationManager } from "../core/firebase/Authentication";
import { app } from "../core/firebase/FirebaseConfig";
import { deleteDoc, doc, getFirestore } from "firebase/firestore";

const Account: NextPage = (props: any) => {
  const [user, setUser] = useState<User | undefined>();
  const [deleteVerified, setDelete] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => {
    const authManager = new AuthenticationManager(
      (user) => {
        if (user) {
          setUser(user);
        } else {
          window.location.replace("/");
        }
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    if (props.email) {
      setEmail(props.email);
    }
  }, []);

  useEffect(() => {
    if (
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email) &&
      password.length >= 8
    ) {
      setDelete(true);
    } else {
      setDelete(false);
    }
  }, [email, password]);

  const handleDelete = () => {
    reauthenticateWithCredential(
      getAuth(app).currentUser!,
      EmailAuthProvider.credential(email, password)
    ).then((cred) => {
      let uid = getAuth(app).currentUser?.uid;
      getAuth(app)
        .currentUser?.delete()
        .then(() => {
          deleteDoc(doc(getFirestore(), "users/" + uid));
        });
    });
  };

  return (
    <div className="h-screen w-screen p-16 flex flex-col justify-center items-center bg-blue-200">
      {user && props.delete && (
        <div className="bg-white grow w-full flex space-y-2 flex-col items-center justify-center rounded-lg drop-shadow-lg">
          <p className="font-bold text-4xl">We're sad to see you go.</p>
          <p className="text-xl">
            To delete your account, you must sign in again with your registered
            email and password.
          </p>
          <p className="text-gray-400 w-1/2 text-center pb-8">
            By deleting your account, all of your posts and user data (including
            phone number, if registered) will be removed from SERAPH's database.
            This action is <b>irreversible</b>.
          </p>
          <input
            type="email"
            placeholder="Email Address"
            className="text-xl bg-gray-200 px-4 py-2 w-1/4 rounded shadow-inner"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            value={email}
          />
          <input
            type="password"
            placeholder="Password"
            className="text-xl bg-gray-200 px-4 py-2 w-1/4 rounded shadow-inner"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            value={password}
          />
          <button
            className={`w-1/4 rounded ${
              deleteVerified ? "bg-red-600" : "bg-gray-400 cursor-default"
            } transition font-bold text-white px-4 py-2`}
            onClick={handleDelete}
          >
            Delete Account
          </button>
        </div>
      )}
    </div>
  );
};

export async function getServerSideProps(context: any) {
  const deleteAccount = context.query.delete;
  const forgetPassword = context.query.forget;
  const email = context.query.email;

  if (deleteAccount) {
    return {
      props: {
        delete: true,
        email: email,
      }, // will be passed to the page component as props
    };
  } else if (forgetPassword) {
    return {
      props: {
        forget: true,
        email: email,
      },
    };
  }
}

export default Account;
