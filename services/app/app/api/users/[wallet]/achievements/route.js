import { getUserAchievements, getAchievementProgress } from '@/models/achievements.js';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    // Fix the Next.js error by correctly handling potentially async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const wallet = resolvedParams?.wallet;
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    const achievements = await getUserAchievements(wallet);
    const progress = await getAchievementProgress(wallet);
    
    return NextResponse.json({
      achievements,
      progress
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
} 