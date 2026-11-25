import { acceptAsset, processAsset, deliverAsset, requestSignIn, infrai } from "./magic_link_media.ts";

const asset = processAsset(acceptAsset({ assetId: "film-42", creatorId: "studio-9", title: "Signal at dusk" }));
console.log({ asset, next: "deliver after verify" });
if (process.env.INFRAI_API_KEY) {
  const recipient = process.env.INFRAI_RECIPIENT;
  if (!recipient) throw new Error("INFRAI_RECIPIENT is required when INFRAI_API_KEY is set");
  const login = await requestSignIn({ email: recipient, locale: "en" });
  await infrai.email.send(login.email, "https://stream.example.com/sign-in");
  console.log(deliverAsset(asset, true));
} else {
  console.log("Set INFRAI_API_KEY to run the sign-in request and email delivery.");
}
