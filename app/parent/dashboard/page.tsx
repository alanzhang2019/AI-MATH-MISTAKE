import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function ParentDashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const profiles = await db.studentProfile.findMany({
    where: { parentId: session.user.id },
    include: {
      mistakes: true
    }
  });

  return (
    <div className="space-y-8 text-black">
      <h2 className="text-2xl font-bold">Analytics Overview</h2>
      
      {profiles.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <p>No profiles found. Go to <a href="/select-profile" className="text-blue-600 underline">Switch Profile</a> to create one.</p>
        </div>
      )}

      {profiles.map(profile => (
        <div key={profile.id} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">{profile.name} - Grade {profile.grade}</h3>
          <p>Total Mistakes Recorded: {profile.mistakes.length}</p>
          <p>Resolved Mistakes: {profile.mistakes.filter(m => m.isResolved).length}</p>
          <p className="mt-4 text-gray-500 italic">Knowledge Graphs and AI Evaluation coming in Phase 3...</p>
        </div>
      ))}
    </div>
  );
}
