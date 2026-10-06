import {
  buildState,
  buyOffer,
  buyPack,
  claimDaily,
  claimPassTier,
  claimSet,
  craftItem,
  requirePlayer,
  syncPlayer,
  unlockPass,
} from "@/lib/game/engine";

export const dynamic = "force-dynamic";

type Body = {
  kind?: string;
  payload?: { setKey?: string; itemKey?: string; tier?: number; packKey?: string; offerKey?: string };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    let player = await requirePlayer();
    player = await syncPlayer(player);

    const kind = body.kind ?? "";
    const payload = body.payload ?? {};

    switch (kind) {
      case "daily": {
        const res = await claimDaily(player);
        if (!res.ok)
          return Response.json({ ok: false, error: res.error, state: await buildState(player) });
        player = res.player;
        const state = await buildState(player);
        return Response.json({
          ok: true,
          toast: `Day ${res.streak} claimed — ${res.reward.label}${
            res.vipDrip ? ` + ${res.vipDrip} 💎 VIP drip` : ""
          }`,
          state,
        });
      }
      case "claim-set": {
        const res = await claimSet(player, payload.setKey ?? "");
        if (!res.ok)
          return Response.json({ ok: false, error: res.error, state: await buildState(player) });
        player = res.player;
        const state = await buildState(player);
        return Response.json({
          ok: true,
          toast: `${res.set.emoji} ${res.set.name} complete! +${res.set.rewardGems} 💎 +${res.set.rewardDust} ✨`,
          state,
        });
      }
      case "craft": {
        const res = await craftItem(player, payload.itemKey ?? "");
        if (!res.ok)
          return Response.json({ ok: false, error: res.error, state: await buildState(player) });
        player = res.player;
        const state = await buildState(player);
        return Response.json({
          ok: true,
          toast: `Forged ${res.item.emoji} ${res.item.name} for ${res.cost} ✨`,
          state,
        });
      }
      case "claim-pass": {
        const res = await claimPassTier(player, Number(payload.tier ?? 0));
        if (!res.ok)
          return Response.json({ ok: false, error: res.error, state: await buildState(player) });
        player = res.player;
        const state = await buildState(player);
        return Response.json({
          ok: true,
          toast: `Tier ${payload.tier} reward unlocked!`,
          state,
        });
      }
      case "unlock-pass": {
        const res = await unlockPass(player);
        if (!res.ok)
          return Response.json({ ok: false, error: res.error, state: await buildState(player) });
        player = res.player;
        const state = await buildState(player);
        return Response.json({
          ok: true,
          toast: "👑 Obsidian Pass unlocked. Every tier is yours now.",
          state,
        });
      }
      case "buy-pack": {
        const res = await buyPack(player, payload.packKey ?? "");
        if (!res.ok)
          return Response.json({ ok: false, error: res.error, state: await buildState(player) });
        player = res.player;
        const state = await buildState(player);
        return Response.json({
          ok: true,
          toast: `+${res.gems.toLocaleString()} 💎${res.doubled ? " (first purchase DOUBLED!)" : ""}`,
          state,
        });
      }
      case "buy-offer": {
        const res = await buyOffer(player, payload.offerKey ?? "");
        if (!res.ok)
          return Response.json({ ok: false, error: res.error, state: await buildState(player) });
        player = res.player;
        const state = await buildState(player);
        return Response.json({
          ok: true,
          toast: `Offer claimed: +${res.offer.gems} 💎 +${res.offer.keys} 🗝️`,
          state,
        });
      }
      case "dismiss-offer": {
        const state = await buildState(player);
        return Response.json({ ok: true, state });
      }
      default:
        return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    console.error("[action]", err);
    return Response.json({ ok: false, error: "Action failed." }, { status: 500 });
  }
}
