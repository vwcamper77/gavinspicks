import Link from 'next/link';

const rejectionRules = [
  'No old or stale adverts, including pages that are merely still indexed by search engines.',
  'No SOLD, RESERVED, DEPOSIT TAKEN, UNDER OFFER, unavailable or withdrawn cars.',
  'No POA listings.',
  'No completed auction pages or historical sale-result pages.',
  'No dead, removed, 404/410 or archive-only links.',
  'A dealer page remaining online is not proof that the car is still for sale.',
  'Current availability must be positively verified from the live advert, seller inventory or equivalent current-sale control.',
  'Listing photos must be checked where available for SOLD, RESERVED, DEPOSIT TAKEN, UNDER OFFER or similar banners/overlays.',
  'For manual-only targets, interior photographs must support the manual claim where photos permit.',
  'Reject F1, E-Gear, Tiptronic, PDK, SMG or other automated-manual/automatic cars when the watchlist target requires a genuine manual.',
  'Factory-original manual status must be distinguished from later conversions. Conversions are excluded unless a target explicitly allows them.',
  'Do not resurface an old advert simply because it has been newly indexed, cached or rediscovered.',
  'Duplicates and recycled dealer adverts are excluded unless there is a material new change such as a genuine relist or price reduction.',
  'If current availability, price, specification or gearbox cannot be verified strongly enough, do not publish or alert.'
];

const sources = [
  'Auto Trader UK',
  'eBay UK',
  'Gumtree UK',
  'PistonHeads',
  'Car & Classic',
  'Collecting Cars',
  'Bonhams Cars / The Market',
  'Classic Trader',
  'Facebook groups and publicly indexed owner posts',
  '911UK',
  'FerrariChat',
  'LamborghiniTalk and marque-owner forums',
  'Specialist marque and independent dealer current-stock pages'
];

const alertRules = [
  'A genuinely new qualifying live car appears.',
  'A previously unavailable car is genuinely relisted with fresh live-sale evidence.',
  'A meaningful price reduction occurs on a car that is still positively verified as available.',
  'A material availability or specification change occurs on an existing watchlist car.'
];

export default function RulesPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Gavin's Picks</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Watch Rules</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            The standard every discovered car must pass before it is shown as a credible live opportunity or used for an alert.
          </p>
        </div>
        <Link href="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
          Back to watchlist
        </Link>
      </div>

      <section className="mb-10 rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">Hard rejection rules</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Any one of these is enough to reject a candidate from the live feed.
        </p>
        <ul className="mt-5 space-y-3">
          {rejectionRules.map((rule) => (
            <li key={rule} className="flex gap-3 text-sm leading-6 sm:text-base">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-foreground" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-xl border p-6">
          <h2 className="text-2xl font-semibold">Sources searched</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The search is deliberately broad because rare analogue cars often surface outside mainstream classifieds.
          </p>
          <ul className="mt-5 space-y-2 text-sm leading-6 sm:text-base">
            {sources.map((source) => (
              <li key={source}>— {source}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border p-6">
          <h2 className="text-2xl font-semibold">When an alert is allowed</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Frequency does not override quality. No material change means no alert.
          </p>
          <ul className="mt-5 space-y-3">
            {alertRules.map((rule) => (
              <li key={rule} className="flex gap-3 text-sm leading-6 sm:text-base">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">Manual gearbox verification</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          Where a watchlist target requires a genuine manual, advert wording alone is not enough. The workflow should inspect interior images for the gear lever and, where visible, three pedals. Ferrari F1, Lamborghini E-Gear, Porsche Tiptronic/PDK, BMW SMG and comparable automated transmissions are rejected. If a car has been converted to manual, it must be identified as a conversion and is excluded unless the target specifically permits conversions.
        </p>
      </section>

      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">Evidence hierarchy</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          The originating seller's current inventory and live advert are the highest authority. Search-result snippets, cached pages, old auction results and retained dealer URLs are discovery clues only and never sufficient evidence that a car is currently purchasable.
        </p>
      </section>
    </main>
  );
}
