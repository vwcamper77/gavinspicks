'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG exposes a labelled graphic. */
import { useId, useRef, useState } from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  defaultInputs,
  inputBounds,
  predict,
  type PredictorInputs,
} from '@/lib/future-predictor';
import {
  marketProfile,
  chartSales,
  ownershipAppeal,
} from '@/lib/market-evidence';
type Car = {
  id: string;
  modelId?: string;
  title: string;
  price: number;
  mileage: number | null;
  url: string;
  checkedAt: string;
  notes: string;
  gearbox: string;
};
const money = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);
const fields: [keyof PredictorInputs, string, string][] = [
  [
    'discount',
    'Purchase discount (%)',
    'Negotiated reduction from the asking price.',
  ],
  [
    'growth',
    'Annual market change (%)',
    '0% is a neutral scenario, not a researched forecast.',
  ],
  [
    'spread',
    'Scenario spread (percentage points)',
    'Downside/base/upside use market change minus/plus this amount. Not a confidence interval.',
  ],
  [
    'discountRate',
    'Discount rate (% per year)',
    'Converts future cash flows to today’s money; separate from purchase discount.',
  ],
  [
    'maintenance',
    'Repairs & maintenance (£ / year)',
    'Editable annual repair allowance, separate from scheduled servicing.',
  ],
  [
    'servicing',
    'Scheduled servicing (£ / year)',
    'Model-specific planning budget; replace with a specialist quote including periodic major services.',
  ],
  [
    'other',
    'Other ownership costs (£ / year)',
    'Add insurance, tax, fuel and finance interest; defaults to £0 and excludes them.',
  ],
  [
    'costInflation',
    'Annual cost increase (%)',
    'Applied to all recurring budgets from year two.',
  ],
  [
    'saleFee',
    'Selling costs (%)',
    '0% assumes a private sale. Enter commission if using an auction or intermediary.',
  ],
  [
    'annualMiles',
    'Miles driven per year',
    'Added to the advertised odometer reading, where known.',
  ],
  [
    'mileagePenalty',
    'Value loss per added 10,000 miles (%)',
    'Illustrative 1% sensitivity, compounded; not an observed market coefficient.',
  ],
  [
    'desirability',
    'Desirability premium change (%)',
    'Five-year change versus today: rarity, specification and buyer demand.',
  ],
  [
    'owners',
    'Owner / provenance premium change (%)',
    'Five-year change versus today. Owner count and provenance are not verified.',
  ],
  [
    'condition',
    'Condition / history premium change (%)',
    'Five-year change versus today. Requires inspection and service invoices.',
  ],
];

function Calculator({ car, asOf }: { car: Car; asOf: string }) {
  const year = new Date(asOf).getUTCFullYear();
  const prefix = useId();
  const profile = marketProfile(car);
  const initial = {
    ...defaultInputs,
    servicing: profile?.servicing ?? 600,
    maintenance: profile?.lowMaintenance ?? 500,
  };
  const [inputs, setInputs] = useState(initial);
  const [usability, setUsability] = useState(profile?.usability ?? 5);
  const [fun, setFun] = useState(profile?.fun ?? 5);
  const [useWeight, setUseWeight] = useState(50);
  const [drivingDays, setDrivingDays] = useState(100);
  const result = predict(car.price, inputs);
  const last = result.last;
  const low = predict(car.price, {
    ...inputs,
    maintenance: profile?.lowMaintenance ?? 500,
  });
  const high = predict(car.price, {
    ...inputs,
    maintenance: profile?.highMaintenance ?? 2000,
  });
  const appeal = ownershipAppeal(usability, fun, useWeight);
  const sales = chartSales(profile?.sales ?? [], asOf);
  const start = new Date(asOf);
  start.setUTCFullYear(year - 5);
  const end = new Date(asOf);
  end.setUTCFullYear(year + 5);
  const dateX = (date: string) =>
    66 +
    ((new Date(date).getTime() - start.getTime()) /
      (end.getTime() - start.getTime())) *
      610;
  const x = (i: number) => {
    const d = new Date(asOf);
    d.setUTCFullYear(year - 5 + i);
    return dateX(d.toISOString());
  };
  const maxValue =
    Math.max(...result.years.map((r) => r.high), ...sales.map((s) => s.price)) *
    1.12;
  const y = (v: number) => 224 - (v / maxValue) * 180;
  const path = (key: 'low' | 'base' | 'high') =>
    result.years
      .map((r, i) => `${i ? 'L' : 'M'}${x(i + 5)},${y(r[key])}`)
      .join(' ');
  return (
    <div className="predictor-body">
      <div className="predictor-evidence">
        {sales.length} matched UK sale{' '}
        {sales.length === 1 ? 'observation' : 'observations'} in the past five
        years ·{' '}
        {profile ? `Researched ${profile.checkedAt}` : 'Research pending'} ·
        Scenario assumptions, not a fitted forecast
      </div>
      <section
        className="predictor-chart"
        aria-label="Five-year sale history and five-year scenarios"
      >
        <h3>Past sale prices → possible future values</h3>
        <svg
          viewBox="0 0 730 270"
          role="img"
          aria-label={`Five-year price chart: ${sales.length} matched UK completed sales; current asking price ${money(car.price)}; base year-five value ${money(last.base)}. Individual sales and source details follow.`}
        >
          <rect x="66" y="28" width="305" height="196" fill="#f0f2ef" />
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line
                x1="66"
                x2="676"
                y1={y(maxValue * f)}
                y2={y(maxValue * f)}
                stroke="#d6ddd9"
              />
              <text x="59" y={y(maxValue * f) + 4} textAnchor="end">
                £{Math.round((maxValue * f) / 1000)}k
              </text>
            </g>
          ))}
          <line
            x1={x(5)}
            x2={x(5)}
            y1="25"
            y2="224"
            stroke="#819188"
            strokeDasharray="4 4"
          />
          <text x="83" y="20">
            HISTORY · COMPLETED SALES
          </text>
          <text x="405" y="20">
            FUTURE · ASSUMPTIONS
          </text>
          {!sales.length && (
            <text x="215" y="125" textAnchor="middle">
              Matched UK price data unavailable
            </text>
          )}
          {sales.map((s) => (
            <circle
              key={s.url}
              cx={dateX(s.date)}
              cy={y(s.price)}
              r="5"
              fill="#65756d"
            >
              <title>
                {s.date}: {money(s.price)} · {s.fees} · {s.note}
              </title>
            </circle>
          ))}
          {(['low', 'base', 'high'] as const).map((key) => (
            <path
              key={key}
              d={path(key)}
              fill="none"
              stroke={
                key === 'base'
                  ? '#154b3b'
                  : key === 'low'
                    ? '#ad573f'
                    : '#ae7a28'
              }
              strokeWidth={key === 'base' ? 3 : 2}
              strokeDasharray={key === 'base' ? undefined : '6 4'}
            />
          ))}
          <circle cx={x(5)} cy={y(car.price)} r="5" fill="#154b3b">
            <title>
              Current asking price {money(car.price)}; not a completed sale
            </title>
          </circle>
          {Array.from({ length: 11 }, (_, i) => (
            <text key={i} x={x(i)} y="246" textAnchor="middle">
              {year - 5 + i}
            </text>
          ))}
        </svg>
        <div className="predictor-legend">
          <span>Grey dots: individual sales</span>
          <span>Terracotta: downside</span>
          <span>Green: base</span>
          <span>Gold: upside</span>
        </div>
        <p>
          Same calendar date each year; sale dots use exact dates within the
          rolling five-year window. Dots are not joined: these are different
          cars, not a like-for-like price index. Future lines start at this
          advert’s asking price, which may exceed achievable market value. No
          invented values fill missing years.
        </p>
      </section>
      <div className="predictor-results" aria-live="polite">
        <div>
          <span>Possible resale in {year + 5}</span>
          <strong>{money(last.base)}</strong>
          <small>
            {money(last.low)}–{money(last.high)} scenario range
          </small>
        </div>
        <div>
          <span>Net after service & maintenance*</span>
          <strong className={last.net < 0 ? 'predictor-negative' : ''}>
            {money(last.net)}
          </strong>
          <small>
            Gross value change: {money(last.base - result.purchase)}
          </small>
        </div>
        <div>
          <span>Your ownership appeal</span>
          <strong>{appeal.toFixed(1)} / 10</strong>
          <small>
            Usability {usability}/10 · fun {fun}/10 · subjective
          </small>
        </div>
      </div>
      <p className="predictor-verdict">
        {last.net >= 0
          ? 'This scenario covers the purchase and entered costs.'
          : `This scenario leaves a ${money(-last.net)} ownership cost over five years.`}{' '}
        {appeal >= 7
          ? 'Strong personal ownership appeal can still make it a rewarding car to keep and drive.'
          : 'Use the practicality and fun settings to judge how well it fits your life.'}{' '}
        Financial break-even needs {result.breakEvenGrowth.toFixed(1)}% annual
        market growth under these assumptions.
      </p>
      <section className="predictor-section" aria-label="Market scenarios">
        <h3>Where could the market move?</h3>
        <div className="predictor-options">
          {[
            [-3, 'Softer demand'],
            [0, 'Flat market'],
            [3, 'Recovery'],
            [6, 'Strong demand'],
          ].map(([rate, label]) => (
            <button
              key={rate}
              className="predictor-action"
              aria-pressed={inputs.growth === rate}
              onClick={() => setInputs((v) => ({ ...v, growth: Number(rate) }))}
            >
              {label} · {Number(rate) > 0 ? '+' : ''}
              {rate}% / yr
            </button>
          ))}
        </div>
        <p>
          These are editable what-if rates, with equal visibility and no
          assigned probabilities. Scarcity, specification and provenance may
          support demand; the purchase price and individual condition matter.
          Sparse auction observations cannot establish an annual market trend.
        </p>
      </section>
      <details className="predictor-section" open>
        <summary>Past sales, differences and sources</summary>
        <p>
          Achieved prices as published. Buyer fees are identified where
          established; mileage, condition, gearbox, upgrades and selling venue
          can make large differences. Research is a sample, not the complete
          market.
        </p>
        {profile?.sales.map((s) => (
          <article className="predictor-sale" key={s.url}>
            <div>
              <strong>
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: s.currency,
                  maximumFractionDigits: 0,
                }).format(s.price)}
              </strong>
              <span>
                {s.date} ·{' '}
                {s.mileage === null
                  ? 'Mileage not established'
                  : `${s.mileage.toLocaleString('en-GB')} miles`}{' '}
                ·{' '}
                {s.match === 'variant'
                  ? 'Same variant; different car'
                  : s.match === 'overseas'
                    ? 'Overseas context only'
                    : 'Related specification; not charted'}
              </span>
            </div>
            <p>
              {s.note} {s.fees}.
            </p>
            <a href={s.url} target="_blank" rel="noreferrer">
              Read sale evidence ↗
            </a>
          </article>
        ))}
        {(!profile || !profile.sales.length || profile.researchNote) && (
          <p>
            {profile?.researchNote ??
              'No sufficiently matched completed sale price established yet. This is a research gap, not evidence of no demand.'}{' '}
            {profile?.researchSource && (
              <a href={profile.researchSource} target="_blank" rel="noreferrer">
                Research source ↗
              </a>
            )}
          </p>
        )}
      </details>
      <section className="predictor-section">
        <h3>Own it. Use it. Enjoy it.</h3>
        <p>
          {profile?.appealReason ??
            'Set the scores after considering passenger space, luggage, access, comfort, weather suitability and the driving experience you want.'}
        </p>
        <div className="predictor-inputs">
          <label>
            Usability · {usability}/10
            <input
              aria-label="Usability score"
              type="range"
              min="1"
              max="10"
              value={usability}
              onChange={(e) => setUsability(Number(e.target.value))}
            />
            <small>
              1: occasional-use compromise · 10: fits everyday needs.
            </small>
          </label>
          <label>
            Fun · {fun}/10
            <input
              aria-label="Fun score"
              type="range"
              min="1"
              max="10"
              value={fun}
              onChange={(e) => setFun(Number(e.target.value))}
            />
            <small>
              1: little personal appeal · 10: a drive you look forward to.
            </small>
          </label>
          <label>
            Usability weighting · {useWeight}%
            <input
              aria-label="Usability weighting"
              type="range"
              min="0"
              max="100"
              step="10"
              value={useWeight}
              onChange={(e) => setUseWeight(Number(e.target.value))}
            />
            <small>Remaining {100 - useWeight}% goes to fun.</small>
          </label>
          <label>
            Days driven each year
            <input
              aria-label="Days driven each year"
              type="number"
              min="1"
              max="365"
              value={drivingDays}
              onChange={(e) =>
                setDrivingDays(
                  Math.min(365, Math.max(1, e.target.valueAsNumber || 1)),
                )
              }
            />
            <small>
              Annual mileage is set separately below; keep both consistent.
            </small>
          </label>
        </div>
        <p className="predictor-verdict">
          {last.net < 0
            ? `${money(-last.net / (drivingDays * 5))} per driving day to enjoy it, based on the modelled net ownership cost.`
            : `The scenario shows a ${money(last.net)} surplus alongside ${drivingDays * 5} driving days.`}{' '}
          Fuel, tax, insurance and finance are excluded unless added below.
        </p>
        <p>
          Starting scores are editorial suggestions about the model, not
          road-test results or measured reliability. Adjust them for your needs
          and this particular car. Appeal = usability × {useWeight}% + fun ×{' '}
          {100 - useWeight}%. Enjoyment complements the financial result; it
          never changes the predicted sale price or turns a cash loss into
          profit.
        </p>
      </section>
      <section className="predictor-section">
        <h3>Servicing plus a maintenance factor</h3>
        <p>
          Garage / storage: £0. First-year servicing budget:{' '}
          {money(inputs.servicing)}. Budgets below are illustrative planning
          allowances, not specialist quotes or probabilities of failure.
        </p>
        <div className="predictor-options">
          {[
            ['Low maintenance', profile?.lowMaintenance ?? 500],
            ['High maintenance', profile?.highMaintenance ?? 2000],
          ].map(([label, value]) => (
            <button
              key={label}
              className="predictor-action"
              aria-pressed={inputs.maintenance === value}
              onClick={() =>
                setInputs((v) => ({ ...v, maintenance: Number(value) }))
              }
            >
              {label} · {money(Number(value))}/yr
            </button>
          ))}
        </div>
        <div className="predictor-results">
          <div>
            <span>Low maintenance · five-year net</span>
            <strong>{money(low.last.net)}</strong>
          </div>
          <div>
            <span>High maintenance · five-year net</span>
            <strong>{money(high.last.net)}</strong>
          </div>
          <div>
            <span>Selected five-year cost budget</span>
            <strong>{money(last.cumulativeCost)}</strong>
            <small>*Plus any optional costs and selling fee you enter.</small>
          </div>
        </div>
        <p>
          Low maintenance assumes a sorted example with modest repairs; high
          maintenance allows more work. Neither caps actual repair bills. Annual
          service budgets should include an allowance for periodic major
          services. Defaults assume no selling commission.
        </p>
      </section>
      <section className="predictor-section">
        <h3>How rare is it in the UK?</h3>
        <strong className="predictor-rarity">
          {profile?.rarity.label ?? 'UK allocation not established'}
        </strong>
        <p>
          {profile?.rarity.note ??
            'Original deliveries need researching for this exact variant.'}{' '}
          {profile?.rarity.source && (
            <a href={profile.rarity.source} target="_blank" rel="noreferrer">
              Rarity source ↗
            </a>
          )}
        </p>
        <p>
          UK supply, worldwide production and cars remaining today are different
          measures. Scarcity alone does not prove buyer demand or add an
          automatic price premium.
        </p>
      </section>
      <details className="predictor-section">
        <summary>Adjust every financial assumption</summary>
        <p>
          All rates and budgets are editable assumptions. Premiums are changes
          from today’s attributes, which are already reflected in the asking
          price. No model-specific premium coefficient has been statistically
          established.
        </p>
        <div className="predictor-inputs">
          {fields.map(([key, label, hint]) => (
            <label key={key} htmlFor={`${prefix}-${key}`}>
              <span>{label}</span>
              <input
                id={`${prefix}-${key}`}
                type="number"
                min={inputBounds[key][0]}
                max={inputBounds[key][1]}
                step={
                  ['annualMiles', 'maintenance', 'servicing', 'other'].includes(
                    key,
                  )
                    ? 1
                    : 0.1
                }
                value={inputs[key]}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  setInputs((v) => ({
                    ...v,
                    [key]: Number.isFinite(n)
                      ? Math.min(
                          inputBounds[key][1],
                          Math.max(inputBounds[key][0], n),
                        )
                      : 0,
                  }));
                }}
              />
              <small>{hint}</small>
            </label>
          ))}
        </div>
        <button className="predictor-action" onClick={() => setInputs(initial)}>
          Reset financial assumptions
        </button>
      </details>
      <details className="predictor-section" open>
        <summary>Every pound explained</summary>
        <dl className="predictor-breakdown">
          <div>
            <dt>Advertised asking price</dt>
            <dd>{money(car.price)}</dd>
          </div>
          <div>
            <dt>Purchase discount ({inputs.discount}%)</dt>
            <dd>−{money(car.price - result.purchase)}</dd>
          </div>
          <div>
            <dt>Assumed purchase price</dt>
            <dd>{money(result.purchase)}</dd>
          </div>
          <div>
            <dt>Year-five value after market growth only</dt>
            <dd>{money(result.marketValue)}</dd>
          </div>
          <div>
            <dt>Desirability change ({inputs.desirability}%)</dt>
            <dd>{money((result.marketValue * inputs.desirability) / 100)}</dd>
          </div>
          <div>
            <dt>Owner / provenance change ({inputs.owners}%)</dt>
            <dd>
              {money(
                (result.marketValue *
                  (1 + inputs.desirability / 100) *
                  inputs.owners) /
                  100,
              )}
            </dd>
          </div>
          <div>
            <dt>Condition / history change ({inputs.condition}%)</dt>
            <dd>
              {money(
                (result.marketValue *
                  (1 + inputs.desirability / 100) *
                  (1 + inputs.owners / 100) *
                  inputs.condition) /
                  100,
              )}
            </dd>
          </div>
          <div>
            <dt>Added-mileage adjustment</dt>
            <dd>
              {money(
                result.marketValue *
                  result.premium *
                  (result.mileageFactor - 1),
              )}
            </dd>
          </div>
          <div>
            <dt>Base resale value</dt>
            <dd>{money(last.base)}</dd>
          </div>
          <div>
            <dt>Selling costs ({inputs.saleFee}%)</dt>
            <dd>−{money(last.base - last.proceeds)}</dd>
          </div>
          <div>
            <dt>Net sale proceeds</dt>
            <dd>{money(last.proceeds)}</dd>
          </div>
          <div>
            <dt>Ownership budgets over five years</dt>
            <dd>−{money(last.cumulativeCost)}</dd>
          </div>
          <div>
            <dt>Net gain / loss after purchase</dt>
            <dd>{money(last.net)}</dd>
          </div>
          <div>
            <dt>Net present value at {inputs.discountRate}%</dt>
            <dd>{money(last.npv)}</dd>
          </div>
          <div>
            <dt>Resale needed to break even (undiscounted)</dt>
            <dd>{money(result.breakEven)}</dd>
          </div>
          <div>
            <dt>Odometer after five years</dt>
            <dd>
              {car.mileage === null
                ? `Unknown start + ${(inputs.annualMiles * 5).toLocaleString('en-GB')} miles`
                : `${(car.mileage + inputs.annualMiles * 5).toLocaleString('en-GB')} miles`}
            </dd>
          </div>
        </dl>
        <div className="predictor-table-wrap">
          <table>
            <caption>Annual forecast and cumulative ownership cost (£)</caption>
            <thead>
              <tr>
                <th>Year</th>
                <th>Downside</th>
                <th>Base</th>
                <th>Upside</th>
                <th>Ownership</th>
              </tr>
            </thead>
            <tbody>
              {result.years.slice(1).map((r) => (
                <tr key={r.year}>
                  <th>{year + r.year}</th>
                  <td>{money(r.low)}</td>
                  <td>{money(r.base)}</td>
                  <td>{money(r.high)}</td>
                  <td>{money(r.cumulativeCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Resale = asking price × (1 + annual market change)^years × premium
          changes^(years ÷ 5) × (1 − mileage loss)^(added miles ÷ 10,000).
          Premium factors multiply in the order shown. Purchase discount changes
          your cost, not the market value. Budgets rise annually; cash costs
          occur at year-end. Net present value discounts sale proceeds and each
          year’s costs, then subtracts the purchase price. Figures are rounded
          for display. No purchase fees, taxes, fuel, insurance or finance costs
          are included unless entered in Other.
        </p>
      </details>

      <section className="predictor-section">
        <h3>This particular car</h3>
        <p>
          {money(car.price)} advertised ·{' '}
          {car.mileage?.toLocaleString('en-GB') ?? 'Unknown'} miles ·{' '}
          {car.gearbox}.{' '}
          <a href={car.url} target="_blank" rel="noreferrer">
            Seller’s advert ↗
          </a>
        </p>
        <p>{car.notes}</p>
        <p>
          Advert checked {car.checkedAt.slice(0, 10)}. Mechanical condition,
          complete invoices and ownership provenance still need checking for
          this car. Editorial appeal is not a mechanical inspection.
        </p>
      </section>
    </div>
  );
}
export default function FuturePredictor({
  car,
  asOf,
}: {
  car: Car;
  asOf: string;
}) {
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const profile = marketProfile(car);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="predictor-trigger"
        aria-label={`Open Gavlar’s Future Predictors for ${car.title}`}
      >
        <span>
          <TrendingUp size={18} />
          Gavlar’s Future Predictors
          <ArrowUpRight size={17} />
        </span>
        <small>5-year value · past sales · UK rarity</small>
        <small>
          {profile
            ? `Usability ${profile.usability}/10 · fun ${profile.fun}/10 · editorial`
            : 'Usability & fun · personalise your scores'}
        </small>
      </DialogTrigger>
      <DialogContent className="predictor-popup" initialFocus={titleRef}>
        <DialogTitle ref={titleRef} tabIndex={-1}>
          Gavlar’s Future Predictors
        </DialogTitle>
        <DialogDescription>
          {car.title} · The money, the market and the joy of owning it.
        </DialogDescription>
        {open && <Calculator car={car} asOf={asOf} />}
      </DialogContent>
    </Dialog>
  );
}
