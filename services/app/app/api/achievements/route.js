import { getAchievementTypes } from '@/models/achievements.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const achievementTypes = await getAchievementTypes();
    return NextResponse.json(achievementTypes);
  } catch (error) {
    console.error('Error fetching achievement types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievement types' },
      { status: 500 }
    );
  }
} 