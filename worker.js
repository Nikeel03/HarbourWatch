// Durban Harbour Watch — relay worker
// Deploy this on Cloudflare Workers (free tier). It holds your aisstream.io
// API key as a secret and forwards ship data to the page — the key never
// reaches anyone's browser.

const BBOX = [[-30.15, 30.75], [-29.65, 31.30]]; // Durban harbour + outer anchorage

export default {
  async fetch(request, env) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("This endpoint only accepts WebSocket connections.", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    // Open our own connection upstream to aisstream.io
    const upstreamResp = await fetch("https://stream.aisstream.io/v0/stream", {
      headers: { Upgrade: "websocket" },
    });
    const upstream = upstreamResp.webSocket;

    if (!upstream) {
      server.send(JSON.stringify({ error: "Could not reach aisstream.io" }));
      server.close(1011, "upstream unavailable");
      return new Response(null, { status: 101, webSocket: client });
    }

    upstream.accept();
    upstream.send(JSON.stringify({
      APIKey: env.AISSTREAM_API_KEY, // set this as a Worker secret, never hard-code it here
      BoundingBoxes: [BBOX],
      FilterMessageTypes: ["PositionReport", "ShipStaticData"],
    }));

    upstream.addEventListener("message", (evt) => {
      try { server.send(evt.data); } catch (e) { /* client gone */ }
    });
    upstream.addEventListener("close", () => { try { server.close(); } catch (e) {} });
    upstream.addEventListener("error", () => { try { server.close(); } catch (e) {} });
    server.addEventListener("close", () => { try { upstream.close(); } catch (e) {} });

    return new Response(null, { status: 101, webSocket: client });
  },
};
