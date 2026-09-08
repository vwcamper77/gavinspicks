'use client';

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
  historicalGrowth,
  inputBounds,
  predict,
  type PredictorInputs,
} from '@/lib/future-predictor';

type Car = {
  id: string;
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
    'storage',
    'Storage (£ / year)',
    'Illustrative £1,200 budget. Enter your garage or storage quote.',
  ],
  [
    'maintenance',
    'Repairs & maintenance (£ / year)',
    'Illustrative £1,500 reserve; excludes scheduled servicing.',
  ],
  [
    'servicing',
    'Scheduled servicing (£ / year)',
    'Illustrative £1,000 budget. Replace with a specialist quote for this car.',
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
    'Illustrative deduction from the eventual sale price.',
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

function Calculator({ car, year }: { car: Car; year: number }) {
  const prefix = useId();
  const [inputs, setInputs] = useState(defaultInputs);
  const [history, setHistory] = useState<(number | null)[]>(
    Array(6).fill(null),
  );
  const [sources, setSources] = useState<string[]>(Array(6).fill(''));
  const result = predict(car.price, inputs);
  const growth = historicalGrowth(history);
  const historyReady =
    growth !== null && sources.every((s) => /^https?:\/\/\S+$/.test(s));
  const maxValue =
    Math.max(
      ...result.years.map((y) => y.high),
      ...history.map((v) => v || 0),
    ) * 1.12;
  const x = (index: number) => 66 + index * 61;
  const y = (value: number) => 224 - (value / maxValue) * 180;
  const path = (key: 'low' | 'base' | 'high') =>
    result.years
      .map((r, i) => `${i ? 'L' : 'M'}${x(i + 5)},${y(r[key])}`)
      .join(' ');
  const historicalPath = history
    .map((value, i) =>
      value === null
        ? ''
        : `${i > 0 && history[i - 1] !== null ? 'L' : 'M'}${x(i)},${y(value)}`,
    )
    .join(' ');
  const last = result.last;
  return (
    <div className="predictor-body">
      <div className="predictor-evidence">
        Scenario calculator · Low evidence confidence · No verified five-year
        price series
      </div>
      <div className="predictor-results" aria-live="polite" aria-atomic="true">
        <div>
          <span>Base resale in {year + 5}</span>
          <strong>{money(last.base)}</strong>
          <small>
            {money(last.low)}–{money(last.high)} scenario range
          </small>
        </div>
        <div>
          <span>Five-year ownership budget</span>
          <strong>{money(last.cumulativeCost)}</strong>
          <small>Storage + repairs + servicing + other</small>
        </div>
        <div>
          <span>Net gain / loss after costs</span>
          <strong className={last.net < 0 ? 'predictor-negative' : ''}>
            {money(last.net)}
          </strong>
          <small>Sale proceeds less purchase and ownership</small>
        </div>
      </div>
      <p className="predictor-verdict">
        Under your assumptions, this car’s resale value{' '}
        {last.base > car.price + 1
          ? 'rises'
          : last.base < car.price - 1
            ? 'falls'
            : 'stays flat'}{' '}
        by {((last.base / car.price - 1) * 100).toFixed(1)}% over five years.{' '}
        {last.net < 0
          ? 'It does not cover the purchase and ownership costs.'
          : 'It covers the entered purchase and ownership costs.'}{' '}
        This is a scenario outcome, not a data-qualified prediction.
      </p>
      <section
        className="predictor-chart"
        aria-label="Five-year history and five-year forecast"
      >
        <h3>Where has it been? Where could it go?</h3>
        {/* SVG is the semantic graphic; an img would lose accessible data points. */}
        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role */}
        <svg
          viewBox="0 0 730 270"
          role="img"
          aria-label={`Price graph from ${year - 5} to ${year + 5}. Historical series ${history.some((v) => v !== null) ? 'contains user-entered values' : 'unavailable'}. Base resale ${money(last.base)}; downside ${money(last.low)}; upside ${money(last.high)}.`}
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
            HISTORY · USER ENTERED
          </text>
          <text x="405" y="20">
            FUTURE · SCENARIOS
          </text>
          {!history.some((v) => v !== null) && (
            <text x="215" y="125" textAnchor="middle">
              Verified history unavailable
            </text>
          )}
          <path
            d={historicalPath}
            fill="none"
            stroke="#65756d"
            strokeWidth="2"
          />
          {history.map(
            (v, i) =>
              v !== null && (
                <circle key={i} cx={x(i)} cy={y(v)} r="4" fill="#65756d">
                  <title>
                    {year - 5 + i}: {money(v)} (user entered)
                  </title>
                </circle>
              ),
          )}
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
          <circle cx={x(5)} cy={y(car.price)} r="4" fill="#154b3b">
            <title>Current asking price {money(car.price)}</title>
          </circle>
          {Array.from({ length: 11 }, (_, i) => (
            <text key={i} x={x(i)} y="246" textAnchor="middle">
              {year - 5 + i}
            </text>
          ))}
        </svg>
        <div className="predictor-legend">
          <span>Grey: entered history</span>
          <span>Terracotta: downside</span>
          <span>Green: base</span>
          <span>Gold: upside</span>
        </div>
        <p>
          Scroll the graph sideways on a small screen to see all years. Future
          lines start at today’s asking price, not a verified market valuation.
          Missing historical years are left blank. Historical guide values and
          asking prices may differ.
        </p>
      </section>
      <details className="predictor-section" open>
        <summary>Adjust your five-year assumptions</summary>
        <p>
          All defaults below are illustrative planning assumptions. Premiums
          start at zero because the asking price already reflects this car’s
          current attributes. Enter only the change you expect over the next
          five years.
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
                  key === 'annualMiles' ||
                  ['storage', 'maintenance', 'servicing', 'other'].includes(key)
                    ? 1
                    : 0.1
                }
                value={inputs[key]}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  setInputs((previous) => ({
                    ...previous,
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
        <button
          className="predictor-action"
          onClick={() => setInputs(defaultInputs)}
        >
          Reset assumptions
        </button>
      </details>
      <details className="predictor-section">
        <summary>Past five years: values, sources and trend</summary>
        <p>
          No verified annual series is available for this exact variant. Enter
          six annual GBP values for a consistent UK model, gearbox and
          condition, using the same annual valuation date. Add a source URL for
          each observation. Entries stay in this calculator while it is open;
          they are not independently verified or published.
        </p>
        <div className="predictor-history">
          {history.map((value, i) => (
            <div key={i}>
              <label>
                {year - 5 + i} value (£)
                <input
                  type="number"
                  min="1"
                  max="10000000"
                  placeholder="No data"
                  value={value ?? ''}
                  onChange={(e) => {
                    const n = e.target.valueAsNumber;
                    setHistory((old) =>
                      old.map((v, j) =>
                        j === i
                          ? Number.isFinite(n) && n > 0
                            ? Math.min(10000000, n)
                            : null
                          : v,
                      ),
                    );
                  }}
                />
              </label>
              <label>
                Source URL
                <input
                  type="url"
                  placeholder="https://…"
                  value={sources[i]}
                  onChange={(e) =>
                    setSources((old) =>
                      old.map((v, j) => (j === i ? e.target.value : v)),
                    )
                  }
                />
              </label>
            </div>
          ))}
        </div>
        <p>
          {growth === null
            ? 'Five-year annualised change: unavailable until all six values are entered.'
            : `User-entered annualised change: ${growth.toFixed(2)}%. ${historyReady ? 'Source references supplied; not independently verified.' : 'Add a valid source URL for every year before using this trend.'}`}
        </p>
        <button
          className="predictor-action"
          disabled={
            !historyReady || growth === null || growth < -30 || growth > 30
          }
          onClick={() => {
            if (historyReady && growth !== null)
              setInputs((old) => ({ ...old, growth }));
          }}
        >
          Use entered trend as base scenario
        </button>
        {growth !== null && (growth < -30 || growth > 30) && (
          <p>
            Trend exceeds the calculator’s −30% to +30% annual range; check the
            values and comparability.
          </p>
        )}
        <p>
          Past growth does not establish future growth.{' '}
          <a
            href="https://www.hagerty.co.uk/valuation/tool/"
            target="_blank"
            rel="noreferrer"
          >
            Research UK guide values ↗
          </a>
        </p>
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
        <h3>Evidence behind this car</h3>
        <p>
          <strong>Quantitative:</strong> {money(car.price)} advertised;{' '}
          {car.mileage === null
            ? 'mileage unknown'
            : `${car.mileage.toLocaleString('en-GB')} advertised miles`}
          ; {car.gearbox}.{' '}
          <a href={car.url} target="_blank" rel="noreferrer">
            Seller’s advert ↗
          </a>{' '}
          · checked{' '}
          {new Date(car.checkedAt).toLocaleDateString('en-GB', {
            timeZone: 'Europe/London',
          })}
          .
        </p>
        <p>
          <strong>Qualitative:</strong> {car.notes}
        </p>
        <p>
          <strong>Not yet evidenced:</strong> matched UK completed sales across
          five years, owner count, independent mechanical condition, complete
          servicing invoices and measured premium coefficients. Seller
          photography checks are not a mechanical inspection. No statistical
          confidence score or investment rating is assigned.
        </p>
      </section>
    </div>
  );
}

export default function FuturePredictor({
  car,
  year,
}: {
  car: Car;
  year: number;
}) {
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
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
        <small>5-year value · ownership costs · price drivers</small>
      </DialogTrigger>
      <DialogContent className="predictor-popup" initialFocus={titleRef}>
        <DialogTitle ref={titleRef} tabIndex={-1}>
          Gavlar’s Future Predictors
        </DialogTitle>
        <DialogDescription>
          {car.title} · Five years of ownership, every assumption visible.
        </DialogDescription>
        {open && <Calculator car={car} year={year} />}
      </DialogContent>
    </Dialog>
  );
}
