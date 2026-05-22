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
  - `app/api/parent/evaluation/route.ts`: Endpoint to trigger weekly AI evaluation.
- **Integrations:**
  - `lib/mistake/openmaic/build-requirement.ts`: Update prompt to request Knowledge Tags.

---

### Task 1: Initialize Prisma and Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`

- [ ] **Step 1: Install Prisma dependencies**

```bash
npm install @prisma/client
npm install prisma --save-dev
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 2: Define Prisma Schema**
Edit `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String           @id @default(uuid())
  email        String           @unique
  passwordHash String
  pin          String?          // 4-digit PIN for parent dashboard
  createdAt    DateTime         @default(now())
  profiles     StudentProfile[]
}

model StudentProfile {
  id            String          @id @default(uuid())
  parentId      String
  parent        User            @relation(fields: [parentId], references: [id], onDelete: Cascade)
  name          String
  grade         Int
  teachingStyle String
  avatarUrl     String?
  mistakes      MistakeRecord[]
  createdAt     DateTime        @default(now())
}

model MistakeRecord {
  id            String          @id @default(uuid())
  studentId     String
  student       StudentProfile  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  problemText   String
  studentAnswer String
  correctAnswer String
  imageUrl      String?
  isResolved    Boolean         @default(false)
  createdAt     DateTime        @default(now())
  concepts      KnowledgeConcept[] @relation("MistakeToConcept")
}

model KnowledgeConcept {
  id       String          @id @default(uuid())
  name     String          @unique
  mistakes MistakeRecord[] @relation("MistakeToConcept")
}
```

- [ ] **Step 3: Generate Client and Push Schema**

```bash
npx prisma db push
npx prisma generate
```

- [ ] **Step 4: Create DB Singleton**
Create `lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

export const db = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = db
```

- [ ] **Step 5: Commit**
```bash
git add prisma/ lib/db.ts package.json package-lock.json .env
git commit -m "feat: initialize prisma and define schema"
```

### Task 2: Setup NextAuth Configuration

**Files:**
- Install: `bcryptjs`
- Create: `auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Install Auth Dependencies**
```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Create Auth Config**
Create `auth.ts`:
```typescript
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "./lib/db"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await db.user.findUnique({
          where: { email: credentials.email as string }
        })
        
        if (!user) return null
        
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string, 
          user.passwordHash
        )
        
        if (passwordsMatch) return { id: user.id, email: user.email }
        return null
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    }
  }
})
```

- [ ] **Step 3: Create Auth API Route**
Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

- [ ] **Step 4: Commit**
```bash
git add auth.ts app/api/auth/ package.json package-lock.json
git commit -m "feat: setup nextauth with credentials provider"
```

### Task 3: Auth UI and Registration Logic

**Files:**
- Create: `app/auth/login/page.tsx`
- Create: `app/api/auth/register/route.ts`

- [ ] **Step 1: Create Register API**
Create `app/api/auth/register/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return new NextResponse("Email already exists", { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { email, passwordHash },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
```

- [ ] **Step 2: Create Login/Register Page UI**
Create `app/auth/login/page.tsx`:
```typescript
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return alert("Registration failed");
    }
    
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      alert("Invalid credentials");
    } else {
      router.push("/select-profile");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isRegister ? "Parent Registration" : "Parent Login"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded"
            required
          />
          <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">
            {isRegister ? "Register" : "Login"}
          </button>
        </form>
        <button 
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-4 text-sm text-blue-600"
        >
          {isRegister ? "Already have an account? Login" : "Need an account? Register"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add app/auth/ app/api/auth/register/
git commit -m "feat: implement auth login and registration UI"
```

*(Note: The plan focuses on establishing the DB and Auth fundamentals first, as requested. Subsequent tasks for Profile Selection, Parent Dashboard PIN, and Knowledge Analytics will be detailed in follow-up plans once this core foundation is merged.)*
