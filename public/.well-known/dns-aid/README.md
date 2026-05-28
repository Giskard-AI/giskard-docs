# DNS for AI Discovery (DNS-AID)

This directory publishes the canonical DNS-AID zone fragment for
`docs.giskard.ai` so AI agents can discover the documentation's
agent-skills entry point via DNS.

- Spec: [draft-mozleywilliams-dnsop-dnsaid](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/)
- Underlying RR format: [RFC 9460 (SVCB / HTTPS)](https://www.rfc-editor.org/rfc/rfc9460)

## Records

The zone fragment in [`dns-aid.zone`](./dns-aid.zone):

```
_index._agents.docs.giskard.ai. 3600 IN HTTPS 1 docs.giskard.ai. alpn="h2,http/1.1" port=443 mandatory=alpn,port
```

Once resolved, the target `docs.giskard.ai` exposes the agent-skills
manifest at `/.well-known/agent-skills/index.json`.

## Deploying to Cloudflare DNS

The zone fragment is the source of truth. The records still need to be
created in Cloudflare DNS for `giskard.ai`.

1. Open the Cloudflare dashboard for the `giskard.ai` zone.
2. Add a new DNS record:
   - **Type**: `HTTPS`
   - **Name**: `_index._agents.docs`
   - **Priority**: `1`
   - **Target**: `docs.giskard.ai.`
   - **Params**: `alpn="h2,http/1.1" port=443 mandatory=alpn,port`
   - **TTL**: `3600` (or `Auto`)
3. Enable **DNSSEC** on the zone (Cloudflare dashboard, DNS > Settings).
   This signs the discovery zone so validating resolvers return
   authenticated data, as required by the DNS-AID spec.

## Validating

After the records propagate, verify with DNS-over-HTTPS:

```
curl -s 'https://cloudflare-dns.com/dns-query?name=_index._agents.docs.giskard.ai&type=HTTPS' \
  -H 'accept: application/dns-json' | jq
```

End-to-end validation via the isitagentready.com scanner:

```
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'content-type: application/json' \
  -d '{"url": "https://docs.giskard.ai"}' | jq '.checks.discoverability.dnsAid'
```

A passing run returns `status: "pass"`.
