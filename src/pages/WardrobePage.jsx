import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { uploadImage } from "../lib/uploadImage";
import { supabase } from "../lib/supabase";

const categories = ["All", "Tops", "Bottoms", "Shoes", "Outerwear", "Accessories", "Dresses"];

export default function WardrobePage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "Tops", color: "", preview: null, file: null });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const fileRef = useRef();

  // Fetch wardrobe items from Firestore on load
  useEffect(() => {
    if (!user) return;

    const fetchItems = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "users", user.uid, "wardrobe"),
          orderBy("uploadedAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch wardrobe:", err);
        setError("Failed to load wardrobe. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [user]);

  const filtered = activeCategory === "All" ? items : items.filter(i => i.category === activeCategory);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setNewItem(p => ({ ...p, preview: e.target.result, file }));
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
    setShowModal(true);
  };

  // Upload to Supabase Storage + save metadata to Firestore
  const handleAdd = async () => {
    if (!newItem.name || !newItem.file) return;

    try {
      setUploading(true);
      setError(null);

      const imageURL = await uploadImage(newItem.file, user.uid);

      const docRef = await addDoc(collection(db, "users", user.uid, "wardrobe"), {
        imageURL,
        name: newItem.name,
        category: newItem.category,
        color: newItem.color,
        uploadedAt: serverTimestamp(),
      });

      setItems(p => [{
        id: docRef.id,
        imageURL,
        name: newItem.name,
        category: newItem.category,
        color: newItem.color,
      }, ...p]);

      setNewItem({ name: "", category: "Tops", color: "", preview: null, file: null });
      setShowModal(false);

    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Check your Supabase bucket settings.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Delete from Firestore + Supabase Storage
  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    try {
      setDeletingId(item.id);

      // 1. Delete from Firestore
      await deleteDoc(doc(db, "users", user.uid, "wardrobe", item.id));

      // 2. Delete from Supabase Storage
      // URL format: .../object/public/wardrobe/USER_ID/FILENAME
      const urlParts = item.imageURL.split("/wardrobe/");
      if (urlParts[1]) {
        const filePath = decodeURIComponent(urlParts[1]);
        await supabase.storage.from("wardrobe").remove([filePath]);
      }

      // 3. Remove from local state
      setItems(p => p.filter(i => i.id !== item.id));

    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete item. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setNewItem({ name: "", category: "Tops", color: "", preview: null, file: null });
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#28251d]">My Wardrobe</h2>
          <p className="text-xs text-[#7a7974]">{items.length} items</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#01696f] text-white text-sm rounded-xl hover:bg-[#0c4e54] transition-all"
        >
          ➕ Add Item
        </button>
      </div>

      {/* Error Banner */}
      {error && !showModal && (
        <div className="bg-[#fdeef4] border border-[#e0ced7] text-[#a12c7b] text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all
              ${activeCategory === cat
                ? "bg-[#01696f] text-white"
                : "bg-white border border-[#dcd9d5] text-[#7a7974] hover:border-[#01696f] hover:text-[#01696f]"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => setShowModal(true)}
        className={`border-2 border-dashed rounded-2xl py-8 flex flex-col items-center gap-2 cursor-pointer transition-all
          ${dragging ? "border-[#01696f] bg-[#e8f4f4]" : "border-[#dcd9d5] hover:border-[#01696f] hover:bg-[#f7f6f2]"}`}
      >
        <span className="text-3xl">👗</span>
        <p className="text-sm font-medium text-[#28251d]">Drag & drop clothes here</p>
        <p className="text-xs text-[#7a7974]">or click to browse</p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#ece9e4]">
              <div className="aspect-square bg-[#f3f0ec] animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-[#f3f0ec] rounded-full animate-pulse w-3/4" />
                <div className="h-3 bg-[#f3f0ec] rounded-full animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <span className="text-4xl">👗</span>
          <p className="text-sm font-medium text-[#28251d]">Your wardrobe is empty</p>
          <p className="text-xs text-[#7a7974]">Add your first clothing item to get started</p>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-[#ece9e4] hover:shadow-md transition-all group relative"
            >
              {/* ✅ Delete button — appears on hover */}
              <button
                onClick={() => handleDelete(item)}
                disabled={deletingId === item.id}
                className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center hidden group-hover:flex transition-all hover:bg-[#fdeef4] shadow-sm border border-[#ece9e4]"
                title="Delete item"
              >
                {deletingId === item.id
                  ? <span className="text-xs animate-spin inline-block text-[#a12c7b]">⟳</span>
                  : <span className="text-xs text-[#a12c7b] font-bold">✕</span>
                }
              </button>

              <div className="aspect-square overflow-hidden bg-[#f7f6f2]">
                {/* ✅ Dimming overlay while deleting */}
                {deletingId === item.id && (
                  <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                    <span className="text-xs text-[#7a7974]">Deleting...</span>
                  </div>
                )}
                <img
                  src={item.imageURL}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-[#28251d] truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#7a7974]">{item.category}</span>
                  <span className="text-xs bg-[#f3f0ec] text-[#7a7974] px-2 py-0.5 rounded-full">{item.color}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-[#28251d] mb-4">Add Clothing Item</h3>

            {error && (
              <div className="bg-[#fdeef4] border border-[#e0ced7] text-[#a12c7b] text-xs rounded-xl px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-[#dcd9d5] rounded-xl aspect-square flex items-center justify-center cursor-pointer hover:border-[#01696f] transition-all mb-4 overflow-hidden"
            >
              {newItem.preview
                ? <img src={newItem.preview} className="w-full h-full object-cover" alt="preview" />
                : <div className="flex flex-col items-center gap-2 text-[#7a7974]">
                    <span className="text-3xl">📷</span>
                    <p className="text-xs">Click to upload photo</p>
                  </div>
              }
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Item name (e.g. White Linen Shirt)"
                value={newItem.name}
                onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                className="w-full text-sm border border-[#dcd9d5] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#01696f] transition-colors"
              />
              <select
                value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                className="w-full text-sm border border-[#dcd9d5] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#01696f] transition-colors bg-white"
              >
                {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                type="text"
                placeholder="Color (e.g. White)"
                value={newItem.color}
                onChange={e => setNewItem(p => ({ ...p, color: e.target.value }))}
                className="w-full text-sm border border-[#dcd9d5] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#01696f] transition-colors"
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={resetModal}
                className="flex-1 py-2.5 rounded-xl border border-[#dcd9d5] text-sm text-[#7a7974] hover:bg-[#f7f6f2] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={uploading || !newItem.name || !newItem.file}
                className="flex-1 py-2.5 rounded-xl bg-[#01696f] text-white text-sm hover:bg-[#0c4e54] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {uploading
                  ? <><span className="animate-spin inline-block">⟳</span> Uploading...</>
                  : "Add to Wardrobe"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}