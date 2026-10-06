import { buildState, maybeSpawnOffer, requirePlayer, syncPlayer } from "@/lib/game/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let player = await requirePlayer();
    player = await syncPlayer(player);
    player = await maybeSpawnOffer(player);
    const state = await buildState(player);
    return Response.json({ ok: true, state });
  } catch (err) {
    console.error("[state]", err);
    return Response.json({ ok: false, error: "Failed to load game." }, { status: 500 });
  }
}
