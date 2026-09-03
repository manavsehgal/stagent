# G-103 DigitalOcean Marketplace Relay Host 1-Click

Status: deferred by operator on 2026-07-21. Preserve this research contract,
but do not execute it while G-107 establishes the provider-neutral deployment
playbook and prioritized cross-cloud release sequence. Image implementation,
vendor enrollment, and Marketplace submission remain separately gated.

## Outcome

Produce an authoritative go/no-go and implementation package for making Relay
Host discoverable as a DigitalOcean Marketplace Droplet 1-Click. A customer
should be able to create one customer-owned Relay Host from the DigitalOcean
control panel, finish Relay onboarding in the browser, and then operate the same
npm-delivered Host and digest-pinned Relay Cell contract proven by G-085.

The research must decide whether Marketplace is only a convenient installation
channel or also becomes a billing and license-fulfillment channel. It must not
submit a vendor application, create a public listing, build a paid snapshot, or
introduce an online entitlement service without separate operator authority.

## Product and fulfillment decision

Compare three concrete offers:

1. **Standard Droplet 1-Click, existing Relay fulfillment.** The image installs
   Relay Core/Host in its normal locked state. DigitalOcean bills only the
   infrastructure; customers buy Relay Host from Orionfold and install the
   existing signed offline license. This is the preferred first hypothesis
   because it preserves G-095 and the accepted Website catalog/issuer contract.
2. **DigitalOcean licensed Droplet.** DigitalOcean bills the software add-on and
   injects an activation credential. This requires an Orionfold-operated
   entitlement service and DigitalOcean lifecycle integration for provision,
   deprovision, plan changes, suspension, replay and reconciliation. Treat this
   as a separate architecture and commercial decision, not a listing detail.
3. **Listing-led deploy handoff.** Marketplace discovery sends the customer to
   Orionfold's existing checkout/deploy guidance if the native 1-Click or
   billing constraints cannot preserve Relay's security and recovery contract.

The decision package must compare customer friction, conversion, revenue share
and billing ownership, offline/customer-owned behavior, support burden, outage
coupling, license recovery/transfer, regional availability, implementation
cost, and compatibility with the accepted free-versus-licensed product promise.

## Authoritative research questions

- Which current DigitalOcean Marketplace program and category fits Relay Host:
  Droplet 1-Click, licensed Droplet, or another supported offer?
- What vendor enrollment, legal entity, team role, tax, support, security,
  maintenance and listing-review information does DigitalOcean require?
- Which supported base OS, image, cloud-init, SSH, filesystem, boot, package,
  firewall, cleanup, validation and first-boot requirements apply at submission?
- How are preview listings, image revisions, version updates, emergency security
  rebuilds, deprecation, customer migrations and rollbacks managed?
- What must be disclosed about included Relay/npm/OCI versions, minimum and
  recommended Droplet sizes, exposed ports, BYOK inference, optional same-Host
  Ollama, backups, data ownership, telemetry, support and separate Relay fees?
- Can the normal Website-issued signed license remain the sole paid entitlement,
  or does Marketplace policy require native DigitalOcean billing for this kind
  of listing?

Research is dated and cites only current DigitalOcean Marketplace, vendor,
image, API and legal sources plus the accepted Relay contracts. Conflicting or
unclear requirements become named questions for DigitalOcean rather than
assumptions.

## Preparation work

### 1. Vendor and operating readiness

- Prepare the Orionfold legal/company profile, product summary, ownership,
  emergency/security and customer-support contacts, support hours and escalation
  path, privacy/security links, license terms and supported territories.
- Identify the minimum DigitalOcean team and Vendor Portal roles. Keep build,
  listing-edit and submission authority separate; record who can approve public
  copy and who can publish.
- Define the vulnerability-response, urgent-rebuild, supported-version,
  deprecation and customer-migration commitments before promising them publicly.

### 2. Repeatable image pipeline

- Start from DigitalOcean's current `droplet-1-clicks` Packer scaffold and a
  supported Ubuntu LTS image. Pin the released Relay npm version, Relay Cell
  manifest-list digest, installer inputs and checksums.
- Install only the machine prerequisites and released Relay artifacts required
  by the accepted Host topology. Do not bake a license, API key, customer data,
  SSH host/user keys, temporary credentials, local repository state or mutable
  `stable` image reference into the snapshot.
- Write DigitalOcean's required application name/version metadata, include a
  bounded per-instance first-boot service, customer-facing MOTD/status, and
  idempotent initialization that is safe across reboot and retry.
- Apply current package updates, supported repositories, cloud-init and SSH
  requirements, UFW/default-deny ingress, application tags, initialization
  login guard, cleanup, and the latest canonical Marketplace validation script.
- Generate a build manifest containing source revision, npm version, OCI digest,
  base-image identity, SBOM/provenance, validation result, snapshot ID and
  cleanup receipt. A version update must be one repeatable command/workflow, not
  a hand-maintained snapshot.

### 3. First-run customer experience

- Provision one Host per Droplet; Host controls only its resident Cells. Do not
  imply Fleet Controller or cross-Host authority.
- Present the assigned URL/IP, first-admin path, license-install path, service
  status and recovery/help links without exposing a reusable secret in logs or
  Marketplace metadata.
- Keep Relay Cells, Docker, SQLite and optional model runtimes private. Expose
  only tightly scoped SSH and authenticated HTTPS, matching G-081/G-085.
- Name incomplete initialization and failure states. Retrying first boot must be
  safe; failure must leave an operator-visible log and recovery procedure.

### 4. Listing and commercial assets

- Prepare the listing name, short/long description, category, icon, screenshots,
  software/version inventory, architecture diagram, documentation and support
  URLs, minimum/recommended sizes, regions/architectures and release notes.
- State separately what DigitalOcean charges for infrastructure, what Relay
  software is free, what the paid Relay Host entitlement unlocks, where it is
  purchased, and what BYOK/model costs remain the customer's responsibility.
- Reconcile every claim with `_IDEAS/host-cell-fulfill.md` and accepted G-085
  evidence before Website or Marketplace publication.

### 5. Preview, conformance and submission

- Validate the Packer template and image locally without provider mutation;
  lint scripts, scan secrets/vulnerabilities, verify pinned inputs and test
  failure/retry/cleanup logic.
- With separate spend authority, build a disposable snapshot and run the latest
  Marketplace image validator. Prove a clean Marketplace-style Droplet through
  first boot, browser onboarding, license activation, one/two managed Cells,
  capacity refusal, reboot, export/recovery, update/rollback and zero-orphan
  cleanup. Reuse the G-085 suite rather than creating a weaker duplicate.
- Create a private preview listing only after vendor enrollment and preview
  authorization. Record review feedback, revisions and final evidence.
- Public submission, acceptance of vendor terms, listing copy, pricing/billing
  integration and publication are independent operator gates.

## Dependencies and release-train placement

- Read-only research and local template design may start immediately.
- G-085 is a conformance prerequisite for image claims and paid provider proof.
- A public Host-capable npm/GitHub release and the accepted signed Relay Cell
  digest are hard prerequisites for a distributable image.
- G-095 and `_IDEAS/host-cell-fulfill.md` remain authoritative for the existing
  offline license and customer promise. Any DigitalOcean-native paid license is
  a new fulfillment architecture requiring its own TDR, threat model, Website
  contract and implementation goal.
- Marketplace availability is a channel increment after the DigitalOcean beta;
  it does not block G-085 or the first Website-hosted Relay Host launch.

## Verification and completion evidence

G-103 is complete when it produces:

1. a dated, source-linked Marketplace requirements and vendor-readiness matrix;
2. a signed-off fulfillment recommendation among the three options above;
3. a repository gap audit against G-085, G-095, the release pipeline and Website
   handoff, with each gap assigned to Relay, Website, operator or DigitalOcean;
4. a codebase-grounded implementation plan with exact surfaces, vertical slices,
   regression budget, provider/browser proof, update/rollback and rescue path;
5. a locally validated Packer/template spike or an explicit evidence-backed
   reason it should wait, with no paid resource or public listing required;
6. bounded follow-on goals for image production, vendor/listing preparation,
   preview conformance and publication if the recommendation is go; and
7. a go, revise or no-go receipt that states what customer promise is safe.

## Operator gates

- Vendor enrollment, Vendor Portal/team permissions and acceptance of terms.
- The fulfillment choice if it changes current Website checkout/offline licensing.
- Any DigitalOcean token, paid image/Droplet/snapshot build or account mutation.
- Public product/support/security claims, pricing, screenshots and listing copy.
- Private preview submission, Marketplace review response, public submission,
  publication, promotion and ongoing support commitment.
- Any new hosted entitlement service, customer telemetry or third-party billing
  dependency.

## Stop and rescue

Stop after two materially different attempts fail on the same DigitalOcean
requirement or if Marketplace rules conflict with Relay's customer-owned data,
offline-lapse, recovery or free-versus-paid contract. Preserve the requirement
matrix and local template evidence, delete only label-scoped paid resources when
authorized, and return a revise/no-go recommendation. Do not weaken the accepted
Host/Cell boundary merely to satisfy a distribution channel.

## Primary sources to refresh at execution

- [DigitalOcean Marketplace vendor enrollment and resources](https://marketplace.digitalocean.com/vendors)
- [DigitalOcean Marketplace Vendor Terms](https://www.digitalocean.com/legal/marketplace-vendor-terms)
- [DigitalOcean `droplet-1-clicks` Packer templates](https://github.com/digitalocean/droplet-1-clicks)
- [DigitalOcean Droplet 1-Click developer guide](https://github.com/digitalocean/droplet-1-clicks/blob/master/DEVELOPER-GUIDE.md)
- [DigitalOcean `marketplace-partners` image requirements and validator](https://github.com/digitalocean/marketplace-partners)
- [DigitalOcean Marketplace License Add-On integration](https://marketplace.digitalocean.com/vendors/license-integration-docs)
- [DigitalOcean Vendor Portal permissions](https://docs.digitalocean.com/platform/teams/roles/permissions/vendor_portal/)
- [DigitalOcean 1-Click Applications API](https://docs.digitalocean.com/reference/api/reference/1-click-applications/)
