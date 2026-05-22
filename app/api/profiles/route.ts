import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const profiles = await db.studentProfile.findMany({
      where: { parentId: session.user.id },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json(profiles);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
