import { FirebaseApp } from "firebase/app";
import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  getFirestore,
  getDocs,
  Firestore,
  doc,
  query,
  Query as FirestoreQuery,
  collection,
  QuerySnapshot,
  onSnapshot,
  where,
  QueryFieldFilterConstraint,
  Unsubscribe,
  setDoc,
} from "firebase/firestore";
import { app } from "./FirebaseConfig";
import Image from "next/image";
import { UserModel } from "../model/User";
import { Geopoint } from "geofire-common";
import { getAuth } from "firebase/auth";
/**
 * Singleton class that controls single/multiple User and Post queries from Cloud Firestore.
 */
export class FirestoreQueryController {
  database: Firestore;
  constructor() {
    this.database = getFirestore(app);
  }

  /**
   * Fetches a single or multiple User or Post without subscribing to Cloud Firestore for changes.
   *
   * @param query_class Query object that will be used by FirebaseQueryController
   * @param type Determines the type of QueryData to be expected after fetching. Expects "user" or "post" and defaults to user on null.
   * @returns UserQueryData if type is "user" or null, and PostQueryData otherwise.
   */
  public async fetch_post_once(
    query_class: Query,
    type?: "user" | null | "post"
  ): Promise<UserQueryData | PostQueryData> {
    const collection_ref = collection(this.database, query_class.collection);
    let q: QuerySnapshot<DocumentData>;

    if (query_class.query) {
      q = await getDocs(query(collection_ref, ...query_class.query));
    } else {
      q = await getDocs(collection_ref);
    }
    let documents: DocumentData[] = [];

    if (query_class instanceof UserQuery) {
      return new UserQueryData(q, collection_ref);
    } else {
      return new PostQueryData(q, collection_ref);
    }
  }

  public async fetch_user_once(
    query_class: UserQuery,
    type?: "user" | null | "post"
  ): Promise<UserQueryData> {
    const collection_ref = collection(this.database, query_class.collection);
    let q: QuerySnapshot<DocumentData>;

    if (query_class.query) {
      q = await getDocs(query(collection_ref, ...query_class.query));
    } else {
      q = await getDocs(collection_ref);
    }
    let documents: DocumentData[] = [];

    return new UserQueryData(q, collection_ref);
  }

  public fetch_subscribe(query_class: Query): FirestoreSubscriptionController {
    return new FirestoreSubscriptionController(query_class, this.database);
  }

  public uploadUserData(
    user: UploadableUserData,
    uid: string,
    onSuccessCallback: () => void,
    onFailureCallback: (error: Error) => void
  ) {
    setDoc(doc(this.database, "users/" + uid), user)
      .then(() => {
        onSuccessCallback();
      })
      .catch((error: Error) => {
        onFailureCallback(error);
      });
  }
}

export interface UploadableUserData {
  f_name: string;
  l_name: string;
  date_of_birth: Date;
  default_location: Geopoint;
  default_location_hash: any;
}

interface Query {
  collection: string;
  query?: QueryFieldFilterConstraint[];
}

export class UserQuery implements Query {
  collection: string;
  single?: boolean;
  query: QueryFieldFilterConstraint[];

  constructor(
    collection: string,
    single?: boolean,
    ...query: QueryFieldFilterConstraint[]
  ) {
    this.collection = collection;
    this.query = query;
    this.single = single;
  }
}

export class PostQuery implements Query {
  collection: string;
  query: QueryFieldFilterConstraint[];

  constructor(collection: string, ...query: QueryFieldFilterConstraint[]) {
    this.collection = collection;
    this.query = query;
  }
}

export interface QueryData {
  documents: QuerySnapshot<DocumentData>;
  reference: CollectionReference;
  getDocuments(): DocumentData[];
}

export class UserQueryData implements QueryData {
  documents: QuerySnapshot<DocumentData>;
  reference: CollectionReference;

  constructor(
    users: QuerySnapshot<DocumentData>,
    reference: CollectionReference
  ) {
    this.documents = users;
    this.reference = reference;
  }

  getDocuments(): DocumentData[] {
    let documents: DocumentData[] = [];

    this.documents.forEach((doc) => {
      documents.push(doc.data());
    });

    return documents;
  }

  createUserModel(): any {
    TODO: "Implement user model in Core/Model/User";
  }
}

export class PostQueryData implements QueryData {
  documents: QuerySnapshot<DocumentData>;
  reference: CollectionReference;

  constructor(
    posts: QuerySnapshot<DocumentData>,
    reference: CollectionReference
  ) {
    this.documents = posts;
    this.reference = reference;
  }
  getDocuments(): DocumentData[] {
    let documents: DocumentData[] = [];

    this.documents.forEach((doc) => {
      documents.push(doc.data());
    });

    return documents;
  }
}

export class FirestoreSubscriptionController {
  private query: Query;
  private q: FirestoreQuery;
  private unsubscribe: Unsubscribe | null;
  private collectionReference: CollectionReference;

  constructor(q: Query, database: Firestore) {
    this.query = q;
    this.unsubscribe = null;
    this.collectionReference = collection(database, q.collection);
    if (this.query.query) {
      this.q = query(this.collectionReference, ...this.query.query);
    } else {
      this.q = query(this.collectionReference);
    }
    return this;
  }

  begin(
    next_callback: (data: UserQueryData | PostQueryData) => void,
    error_callback?: () => void
  ) {
    const callback = (docs: QuerySnapshot<DocumentData>) => {
      if (this.query instanceof UserQuery)
        return next_callback(new UserQueryData(docs, this.collectionReference));
    };
    this.unsubscribe = onSnapshot(this.q, callback, error_callback);
  }

  end() {
    if (this.unsubscribe) {
      this.unsubscribe();
    } else {
      throw new Error(
        "Unsubscribe function not yet available. Did you invoke begin() beforehand?"
      );
    }
  }
}
