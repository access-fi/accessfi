import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Inventory purchases must be executed on-chain through User.buyAsset(assetId). This API is deprecated as a purchase authority.',
    },
    { status: 410 }
  );
}
