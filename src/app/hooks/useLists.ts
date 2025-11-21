// src/app/hooks/useLists.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export type UserList = {
  id: string;
  name: string;
  items: string[];
  createdAt?: Date;
};

type UseListsResult = {
  lists: UserList[];
  loading: boolean;
  error: string | null;
  createList: (name: string) => Promise<string>;
  deleteList: (listId: string) => Promise<void>;
  addToList: (listId: string, contentId: string) => Promise<void>;
  removeFromList: (listId: string, contentId: string) => Promise<void>;
};

export function useLists(): UseListsResult {
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, "users", user.uid, "lists");

    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const data: UserList[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data() as any;
          return {
            id: docSnap.id,
            name: d.name ?? "",
            items: (d.items ?? []) as string[],
            createdAt: d.createdAt?.toDate?.(),
          };
        });
        setLists(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading lists", err);
        setError("No se pudieron cargar las listas");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const createList = useCallback(async (name: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");

    const ref = collection(db, "users", user.uid, "lists");
    const docRef = await addDoc(ref, {
      name,
      items: [],
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  }, []);

  const deleteList = useCallback(async (listId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");

    const ref = doc(db, "users", user.uid, "lists", listId);
    await deleteDoc(ref);
  }, []);

  const addToList = useCallback(async (listId: string, contentId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");

    const ref = doc(db, "users", user.uid, "lists", listId);
    await updateDoc(ref, {
      items: arrayUnion(contentId),
    });
  }, []);

  const removeFromList = useCallback(
    async (listId: string, contentId: string) => {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado");

      const ref = doc(db, "users", user.uid, "lists", listId);
      await updateDoc(ref, {
        items: arrayRemove(contentId),
      });
    },
    []
  );

  return {
    lists,
    loading,
    error,
    createList,
    deleteList,
    addToList,
    removeFromList,
  };
}
