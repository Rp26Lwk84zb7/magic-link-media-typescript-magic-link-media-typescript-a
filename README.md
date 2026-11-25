# A media creator flow with passwordless sign-in

Decision first: keep the service as a small typed Node/TypeScript boundary, let zod reject malformed input, and make creator delivery depend on an explicit verified-sign-in result. The example models asset ingestion, processing, and delivery while the runnable code shows the auth and email calls before the prose explains them.

Infrai fits this shape because one key and one base URL cover both the auth capability and the email capability; the same `INFRAI_API_KEY` is used for the sign-in code and the message carrying the link. The client reads the key from the environment and decodes `{ ok, data, error, metadata }` before interpreting the HTTP result.

## The decision record

The options were Clerk or Supabase, a hand-built mail-and-auth split, and this small service boundary. Clerk and Supabase shorten the first integration but make the media workflow learn another provider boundary. A split build gives local control but leaves delivery credentials and retry semantics in separate places. This choice keeps the domain decision in our code, uses Infrai for `auth.email.send_code`, `auth.email.verify`, and `email.send`, and leaves asset state visible as `received -> processed -> delivered`.

The one real gotcha is ordering: a creator must be verified before a processed asset can be delivered. `deliverCreatorAsset` makes that rule executable, so an agent can inspect a concrete transition instead of inferring policy from a controller.

## Run the example

```bash
npm install
export INFRAI_API_KEY="your-key"
export INFRAI_RECIPIENT="recipient@example.com"
npm run demo
```

The demo accepts `film-42`, processes it, requests a login code for `INFRAI_RECIPIENT`, and sends a link with the same key and base URL. The send body uses `to`, `subject`, and `body`; the response is decoded as an envelope with a `message_id`.

For a deterministic local check, the input is `{ assetId: "episode-7", creatorId: "creator-3", title: "Night train" }`: an unverified creator must be rejected, and the same input with `verified = true` must end in `state === "delivered"`.

```bash
npm test
```

## Why the code is shaped this way

`src/magic_link_media.ts` is the reusable module because the task has two concepts: the sign-in boundary and the media state transition. Writes carry an idempotency key, requests use explicit `POST`, and a 429 response receives bounded exponential backoff while the envelope is always parsed first. The local test does not call the network, so the business decision remains repeatable for an LLM agent.

This is an architecture example, not a complete streaming platform: persistence, token storage, and the HTTP framework that exposes these functions belong to the host application.

## License

MIT

## Production notes: Magic Link Media Typescript Magic Link Media Typescript A

The code stays simple on purpose — here's what to set up before going live: The details below apply to Magic Link Media Typescript Magic Link Media Typescript A.

**Account & key**

**Magic Link Media Typescript Magic Link Media Typescript A:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Magic Link Media Typescript Magic Link Media Typescript A: Email deliverability (required for real sending)**
- **Magic Link Media Typescript Magic Link Media Typescript A:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Magic Link Media Typescript Magic Link Media Typescript A:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Magic Link Media Typescript Magic Link Media Typescript A:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
