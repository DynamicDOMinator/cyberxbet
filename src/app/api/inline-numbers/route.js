import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

// POST endpoint to add a new inline numbers player
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, numbers, timestamp } = body;

    if (!userId || !numbers) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const inlineNumbersRef = collection(db, "inlineNumbers");
    const docRef = await addDoc(inlineNumbersRef, {
      userId,
      numbers,
      timestamp: timestamp || new Date().toISOString(),
    });

    return NextResponse.json(
      { id: docRef.id, message: "Inline numbers player added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding inline numbers player:", error);
    return NextResponse.json(
      { error: "Failed to add inline numbers player" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch inline numbers players
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const inlineNumbersRef = collection(db, "inlineNumbers");
    let q = inlineNumbersRef;

    if (userId) {
      q = query(inlineNumbersRef, where("userId", "==", userId));
    }

    const querySnapshot = await getDocs(q);
    const players = [];

    querySnapshot.forEach((doc) => {
      players.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching inline numbers players:", error);
    return NextResponse.json(
      { error: "Failed to fetch inline numbers players" },
      { status: 500 }
    );
  }
}
