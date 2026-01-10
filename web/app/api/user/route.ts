/**
 * User Profile API Routes
 * GET - Get user profile by wallet address
 * POST - Create/Update user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, userProfiles } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema
const userProfileSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  userContractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address').optional(),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['buyer', 'seller', 'both']),
  dataToSell: z.string().optional(),
  dataToBuy: z.string().optional(),
});

// GET /api/user?address=0x...
export async function GET(request: NextRequest) {
  try {
    // Runtime check for database URL
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.walletAddress, address.toLowerCase()))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found', exists: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: profile[0], exists: true });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user
export async function POST(request: NextRequest) {
  try {
    // Runtime check for database URL
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validate input
    const validated = userProfileSchema.parse(body);

    // Normalize addresses to lowercase
    const walletAddress = validated.walletAddress.toLowerCase();
    const userContractAddress = validated.userContractAddress?.toLowerCase();

    // Check if profile already exists
    const existing = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.walletAddress, walletAddress))
      .limit(1);

    let profile;

    if (existing.length > 0) {
      // Update existing profile
      const updated = await db
        .update(userProfiles)
        .set({
          ...validated,
          walletAddress,
          userContractAddress,
          updatedAt: new Date(),
          onboardingCompleted: true,
        })
        .where(eq(userProfiles.walletAddress, walletAddress))
        .returning();

      profile = updated[0];
    } else {
      // Create new profile
      const inserted = await db
        .insert(userProfiles)
        .values({
          ...validated,
          walletAddress,
          userContractAddress,
          onboardingCompleted: true,
        })
        .returning();

      profile = inserted[0];
    }

    return NextResponse.json({ profile, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error saving user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
