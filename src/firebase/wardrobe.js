import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "./config";

export async function uploadClothingItem(userId, file, metadata) {
  // 1. Upload image to Firebase Storage
  const storageRef = ref(storage, `images/${userId}/wardrobe/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const imageURL = await getDownloadURL(storageRef);

  // 2. Save metadata to Firestore
  const docRef = await addDoc(collection(db, "users", userId, "wardrobe"), {
    imageURL,
    name: metadata.name,
    category: metadata.category,
    color: metadata.color,
    tags: metadata.tags || [],
    uploadedAt: serverTimestamp(),
  });

  return { id: docRef.id, imageURL };
}