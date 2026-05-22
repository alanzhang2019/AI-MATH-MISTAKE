# Design Spec: Parent Dashboard, Authentication, and Knowledge Analytics

## 1. Overview
This specification outlines the architecture and user flow for the Parent Dashboard subsystem in the AI Math Mistake Machine. It transitions the application from a single-user local prototype to a multi-profile, data-persistent platform. The goal is to allow parents to manage multiple student profiles securely and view AI-driven analytics regarding their children's learning progress.

## 2. Authentication & Account Strategy
- **Framework**: NextAuth.js (Auth.js)
- **Model**: "Parent-Driven Binding"
  - Only parents have root accounts (via email/password or OAuth providers).
  - A single Parent account acts as an umbrella for one or more Student Profiles.
  - The student interface does not require authentication; it relies on the active profile selected by the parent.

## 3. Data Model (Prisma / SQLite)

### Core Tables
1. **User (Parent)**
   - `id`: UUID
   - `email`: String (Unique)
   - `passwordHash`: String
   - `createdAt`: DateTime

2. **StudentProfile**
   - `id`: UUID
   - `parentId`: UUID (Foreign Key to User)
   - `name`: String
   - `grade`: Integer
   - `teachingStyle`: String
   - `avatarUrl`: String (Optional)

3. **MistakeRecord**
   - `id`: UUID
   - `studentId`: UUID (Foreign Key to StudentProfile)
   - `problemText`: String
   - `studentAnswer`: String
   - `correctAnswer`: String
   - `imageUrl`: String (Optional)
   - `isResolved`: Boolean (Did they pass the follow-up quiz?)
   - `createdAt`: DateTime

4. **KnowledgeConcept (Tag)**
   - `id`: UUID
   - `name`: String (e.g., "Fractions", "Equations")

5. **MistakeConcept (Join Table)**
   - Maps `MistakeRecord` to `KnowledgeConcept`

## 4. User Flows

### A. Initialization & Profile Selection
1. Parent visits the app and logs in via NextAuth.
2. Parent is presented with a "Profile Selector" screen (similar to Netflix).
3. Parent selects a child's profile or creates a new one.
4. The app enters "Student Mode".

### B. Student Mode (Restricted)
1. The student interacts with the core loop: Take photo -> AI Diagnosis -> Learn -> Quiz.
2. Quiz results (`isResolved`) and extracted knowledge tags are saved to the database associated with the active `studentId`.
3. To exit Student Mode and view analytics, a user must click "Parent Dashboard" and enter the Parent's PIN/Password.

### C. Parent Dashboard (Protected Route `/parent/dashboard`)
1. **Knowledge Radar/Graph**: Visualizes the student's mastery of different `KnowledgeConcept`s over the last 30 days based on `isResolved` rates.
2. **Weekly AI Evaluation**: 
   - Triggered periodically (e.g., once a week or manually by the parent).
   - The system aggregates the week's `MistakeRecord`s and their tags.
   - A batch prompt is sent to the LLM (e.g., Kimi) to generate a personalized, pedagogical summary.
   - The summary highlights weak points and offers actionable coaching advice for the parent.

## 5. Technical Considerations
- **ORM**: Prisma will be used to manage the SQLite database schema and migrations.
- **Security**: Route middleware must protect all `/parent/*` routes, verifying the NextAuth session.
- **LLM Integration**: The prompt for the Weekly Evaluation must be strictly scoped to avoid token limit overflow (truncate history if necessary, focusing on the last N mistakes).
