"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useProfileStore, StudentProfile } from "@/lib/store/profile";

export default function SelectProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", grade: "4", teachingStyle: "gentle" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchProfiles();
    }
  }, [status, router]);

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error("Failed to fetch profiles", error);
    }
  };

  const handleSelect = (profile: StudentProfile) => {
    setActiveProfile(profile);
    router.push("/mistake");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: "", grade: "4", teachingStyle: "gentle" });
        fetchProfiles();
      } else {
        alert("Failed to create profile");
      }
    } catch (error) {
      console.error("Error creating profile", error);
    }
  };

  if (status === "loading") return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8">Who is learning?</h1>
      
      <div className="flex flex-wrap gap-6 justify-center">
        {profiles.map((p) => (
          <div 
            key={p.id} 
            onClick={() => handleSelect(p)}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-32 h-32 bg-blue-500 rounded-lg flex items-center justify-center text-4xl font-bold group-hover:ring-4 ring-white transition-all">
              {p.name.charAt(0).toUpperCase()}
            </div>
            <span className="mt-4 text-xl">{p.name}</span>
          </div>
        ))}
        
        <div 
          onClick={() => setShowForm(true)}
          className="flex flex-col items-center cursor-pointer group"
        >
          <div className="w-32 h-32 border-4 border-gray-600 rounded-lg flex items-center justify-center text-4xl font-bold group-hover:border-white transition-all">
            +
          </div>
          <span className="mt-4 text-xl">Add Profile</span>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-gray-800 p-8 rounded-lg w-full max-w-md space-y-4">
            <h2 className="text-2xl font-bold">Create Profile</h2>
            <input 
              type="text" placeholder="Name" required
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <select 
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}
            >
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
            </select>
            <select 
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={formData.teachingStyle} onChange={e => setFormData({...formData, teachingStyle: e.target.value})}
            >
              <option value="gentle">Gentle & Encouraging</option>
              <option value="strict">Strict & Direct</option>
              <option value="socratic">Socratic (Guiding Questions)</option>
            </select>
            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
