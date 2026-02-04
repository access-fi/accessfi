import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { proofTypes } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  try {
    const rows = await db
      .select()
      .from(proofTypes)
      .where(
        address
          ? or(eq(proofTypes.isPublic, true), eq(proofTypes.createdBy, address))
          : eq(proofTypes.isPublic, true)
      );

    return NextResponse.json({ items: rows });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load proof types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      description,
      kind,
      blueprintId,
      isPublic,
      createdBy,
    } = body;

    if (!id || !title || !description || !kind || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: id, title, description, kind, createdBy' },
        { status: 400 }
      );
    }

    if (kind === 'zkemail' && !blueprintId) {
      return NextResponse.json(
        { error: 'Missing blueprintId for zkemail proof type' },
        { status: 400 }
      );
    }

    const now = new Date();

    await db.insert(proofTypes).values({
      id,
      title,
      description,
      kind,
      blueprintId: blueprintId || null,
      isPublic: Boolean(isPublic),
      createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create proof type' },
      { status: 500 }
    );
  }
}
