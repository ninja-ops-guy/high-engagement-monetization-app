import {
  buildState,
  maybeSpawnOffer,
  openCrates,
  requirePlayer,
  syncPlayer,
} from "@/lib/game/engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      crateKey?: string;
      count?: number;
    };
    const crateKey = body.crateKey ?? "";
    const count = body.count === 10 ? 10 : 1;

    let player = await requirePlayer();
    player = await syncPlayer(player);

    const outcome = await openCrates(player, crateKey, count);
    if (!outcome.ok) {
      return Response.json(
        { ok: false, error: outcome.error, state: await buildState(player) },
        { status: 200 },
      );
    }

    player = await maybeSpawnOffer(player);
    const state = await buildState(player);
    return Response.json({ ok: true, result: outcome.result, state });
  } catch (err) {
    console.error("[open]", err);
    return Response.json({ ok: false, error: "Failed to open crate." }, { status: 500 });
  }
}
