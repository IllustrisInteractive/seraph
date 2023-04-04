import {
  Auth,
  AuthCredential,
  UserCredential,
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthCredential,
  signOut,
  onAuthStateChanged,
  User,
  NextOrObserver,
} from "firebase/auth";
import { app } from "./FirebaseConfig";

export class AuthenticationManager {
  private auth: Auth;
  private user: User | null;
  private onAuthStateChangedCallback: (user: User | null) => void;
  constructor(onAuthStateChangedCallback: (user: User | null) => void) {
    this.onAuthStateChangedCallback = onAuthStateChangedCallback;
    this.auth = getAuth(app);
    this.user = null;

    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
      this.onAuthStateChangedCallback(user);
    });
  }

  setUser(user: User | null) {
    if (user) this.user = user;
  }

  getAuth() {
    return this.auth;
  }

  authenticateUserWithEmail(
    email: string,
    password: string,
    onErrorCallback: (error: Error) => void
  ) {
    if (!this.user) {
      signInWithEmailAndPassword(this.auth, email, password)
        .then((credential) => {
          this.user = credential.user;
        })
        .catch((error) => {
          onErrorCallback(error);
        });
    }
  }

  authenticateUserWithGoogle(
    onErrorCallback?: (error: Error, credential: OAuthCredential | null) => void
  ) {
    if (!this.user) {
      const provider = new GoogleAuthProvider();
      signInWithPopup(this.auth, provider)
        .then((result) => {
          // This gives you a Google Access Token. You can use it to access the Google API.
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential!.accessToken;
          this.user = result.user;
        })
        .catch((error) => {
          const credential = GoogleAuthProvider.credentialFromError(error);
          if (onErrorCallback) onErrorCallback(error, credential);
        });
    }
  }

  signOut(onErrorCallback?: (error: Error) => {}) {
    signOut(this.auth).catch((error) => {
      if (onErrorCallback) onErrorCallback(error);
    });
  }
}
