import assert from "node:assert/strict";
import test from "node:test";
import { deliverCreatorAsset } from "./magic_link_media.ts";

test("creator delivery is gated by verified sign-in", async () => {
  const input = { assetId: "episode-7", creatorId: "creator-3", title: "Night train" };
  await assert.rejects(() => deliverCreatorAsset(input, false), /verified creator/);
  const delivered = await deliverCreatorAsset(input, true);
  assert.equal(delivered.state, "delivered");
});
