# Parent Dashboard, Authentication, and Knowledge Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Parent Dashboard subsystem including NextAuth authentication, Prisma/SQLite data persistence, Student Profile selection, and AI-driven Knowledge Analytics.

**Architecture:** We will build this iteratively: first setting up the database layer (Prisma + SQLite), then the authentication layer (NextAuth), followed by the Parent Onboarding/Profile selection UI. Once the Auth/Profile core is stable, we update the existing Student Mode (`/mistake`, `/classroom`) to persist data to the DB instead of local JSON. Finally, we build the Parent Dashboard with Knowledge Graphs and AI Evaluation.

**Tech Stack:** Next.js (App Router), TypeScript, Prisma, SQLite, NextAuth.js (Auth.js v5), TailwindCSS, Recharts (for radar charts).

---

## File Structure

- **Database:**
  - `prisma/schema.prisma`: Core data model definition.
  - `lib/db.ts`: Prisma client singleton.
- **Auth:**
  - `app/api/auth/[...nextauth]/route.ts`: NextAuth endpoints.
  - `auth.ts`: NextAuth configuration and providers.
- **Parent Routes:**
  - `app/auth/login/page.tsx`: Parent login UI.
  - `app/parent/layout.tsx`: Protected layout with PIN verification check.
  - `app/parent/pin/page.tsx`: PIN entry UI.
  - `app/parent/onboarding/page.tsx`: Initial setup (create first student).
  - `app/parent/dashboard/page.tsx`: The main analytics dashboard.
- **Student Selection:**
  - `app/select-profile/page.tsx`: Netflix-style profile selector.
  - `lib/store/profile.ts`: Zustand store for currently active student profile.
- **API Routes:**
  - `app/api/profiles/route.ts`: Endpoint to manage profiles.
  - `app/api/parent/evaluation/route.ts`: Endpoint to trigger weekly AI evaluation.
- **Integrations:**
  - `lib/mistake/openmaic/build-requirement.ts`: Update prompt to request Knowledge Tags.

---

### Task 1: Initialize Prisma and Database Schema (Completed)
### Task 2: Setup NextAuth Configuration (Completed)
### Task 3: Auth UI and Registration Logic (Completed)

---

### Phase 2: Profile Selection & Parent Dashboard UI

### Task 4: Profile API and Zustand Store

**Files:**
- Create: `app/api/profiles/route.ts`
- Create: `lib/store/profile.ts`

- [ ] **Step 1: Create Profile API**
Create `app/api/profiles/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const profiles = await db.studentProfile.findMany({
    where: { parentId: session.user.id },
    orderBy: { createdAt: 'asc' }
  });
  
  return NextResponse.json(profiles);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { name, grade, teachingStyle } = await req.json();
  if (!name || !grade || !teachingStyle) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const profile = await db.studentProfile.create({
    data: {
      parentId: session.user.id,
      name,
      grade: parseInt(grade, 10),
      teachingStyle
    }
  });

  return NextResponse.json(profile);
}
```

- [ ] **Step 2: Create Zustand Store**
Create `lib/store/profile.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StudentProfile {
  id: string;
  parentId: string;
  name: string;
  grade: number;
  teachingStyle: string;
  avatarUrl: string | null;
}

interface ProfileState {
  activeProfile: StudentProfile | null;
  setActiveProfile: (profile: StudentProfile | null) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      activeProfile: null,
      setActiveProfile: (profile) => set({ activeProfile: profile }),
    }),
    {
      name: 'mistake-active-profile',
    }
  )
);
```

- [ ] **Step 3: Commit**
```bash
git add app/api/profiles/route.ts lib/store/profile.ts
git commit -m "feat: add profile API and zustand store"
```

### Task 5: Profile Selection UI

**Files:**
- Create: `app/select-profile/page.tsx`

- [ ] **Step 1: Create Profile Selection Page**
Create `app/select-profile/page.tsx`:
```typescript
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
    const res = await fetch("/api/profiles");
    if (res.ok) {
      const data = await res.json();
      setProfiles(data);
    }
  };

  const handleSelect = (profile: StudentProfile) => {
    setActiveProfile(profile);
    router.push("/mistake");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      fetchProfiles();
    }
  };

  if (status === "loading") return <div>Loading...</div>;

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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
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
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-600 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 rounded">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add app/select-profile/page.tsx
git commit -m "feat: add profile selection UI"
```

### Task 6: Parent Dashboard Layout and Auth Provider Setup

Since NextAuth's `useSession` requires a `SessionProvider` at the root (or layout) level, we need to add it.

**Files:**
- Create: `components/providers/session-provider.tsx`
- Modify: `app/layout.tsx`
- Create: `app/parent/layout.tsx`
- Create: `app/parent/dashboard/page.tsx`

- [ ] **Step 1: Create Session Provider**
Create `components/providers/session-provider.tsx`:
```typescript
"use client";
import { SessionProvider } from "next-auth/react";

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 2: Update Root Layout**
Modify `app/layout.tsx`:
Import `NextAuthProvider` and wrap `children`:
```typescript
// Add to imports
import { NextAuthProvider } from '@/components/providers/session-provider';

// In RootLayout, wrap AccessCodeGuard with NextAuthProvider
// ...
          <I18nProvider>
            <NextAuthProvider>
              <ServerProvidersInit />
              <AccessCodeGuard>{children}</AccessCodeGuard>
              <Toaster position="top-center" />
            </NextAuthProvider>
          </I18nProvider>
// ...
```

- [ ] **Step 3: Create Parent Layout**
Create `app/parent/layout.tsx`:
```typescript
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Parent Dashboard</h1>
        <div className="flex gap-4">
          <a href="/select-profile" className="text-blue-600 hover:underline">Switch Profile</a>
        </div>
      </nav>
      <main className="p-6 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create Parent Dashboard Stub**
Create `app/parent/dashboard/page.tsx`:
```typescript
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
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Analytics Overview</h2>
      
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
```

- [ ] **Step 5: Commit**
```bash
git add components/providers/ app/layout.tsx app/parent/
git commit -m "feat: setup parent dashboard layout and session provider"
```

---
*Note: Phase 3 will cover integrating `MistakeRecord` creation into the Student Mode (`/mistake`) and building the AI Knowledge Graph Analytics.*