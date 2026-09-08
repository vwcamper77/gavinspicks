export type PredictorInputs = {
  discount: number;
  growth: number;
  spread: number;
  discountRate: number;
  storage: number;
  maintenance: number;
  servicing: number;
  other: number;
  costInflation: number;
  saleFee: number;
  annualMiles: number;
  mileagePenalty: number;
  desirability: number;
  owners: number;
  condition: number;
};

export const defaultInputs: PredictorInputs = {
  discount: 0,
  growth: 0,
  spread: 5,
  discountRate: 4,
  storage: 0,
  maintenance: 500,
  servicing: 600,
  other: 0,
  costInflation: 2,
  saleFee: 0,
  annualMiles: 3000,
  mileagePenalty: 1,
  desirability: 0,
  owners: 0,
  condition: 0,
};

export const inputBounds: Record<keyof PredictorInputs, [number, number]> = {
  discount: [0, 50],
  growth: [-30, 30],
  spread: [0, 20],
  discountRate: [0, 30],
  storage: [0, 100000],
  maintenance: [0, 100000],
  servicing: [0, 100000],
  other: [0, 100000],
  costInflation: [0, 20],
  saleFee: [0, 30],
  annualMiles: [0, 100000],
  mileagePenalty: [0, 20],
  desirability: [-50, 50],
  owners: [-50, 50],
  condition: [-50, 50],
};

export function predict(price: number, raw: PredictorInputs) {
  if (!Number.isFinite(price) || price <= 0)
    throw new Error('A positive asking price is required');
  const input = { ...raw };
  for (const key of Object.keys(inputBounds) as (keyof PredictorInputs)[]) {
    const [min, max] = inputBounds[key];
    input[key] = Math.min(
      max,
      Math.max(min, Number.isFinite(raw[key]) ? raw[key] : defaultInputs[key]),
    );
  }
  const purchase = price * (1 - input.discount / 100);
  const premium =
    (1 + input.desirability / 100) *
    (1 + input.owners / 100) *
    (1 + input.condition / 100);
  const annualCost =
    input.storage + input.maintenance + input.servicing + input.other;
  const years = Array.from({ length: 6 }, (_, year) => {
    // Premium changes phase in over the hold; current asking price already includes existing attributes.
    const adjustment =
      Math.pow(premium, year / 5) *
      Math.pow(
        1 - input.mileagePenalty / 100,
        (input.annualMiles * year) / 10000,
      );
    const value = (growth: number) =>
      price * Math.pow(1 + growth / 100, year) * adjustment;
    const costs = Array.from(
      { length: year },
      (_, i) => annualCost * Math.pow(1 + input.costInflation / 100, i),
    );
    const base = value(input.growth);
    const proceeds = base * (1 - input.saleFee / 100);
    const cumulativeCost = costs.reduce((a, b) => a + b, 0);
    const presentCosts = costs.reduce(
      (sum, cost, i) =>
        sum + cost / Math.pow(1 + input.discountRate / 100, i + 1),
      0,
    );
    return {
      year,
      base,
      low: value(input.growth - input.spread),
      high: value(input.growth + input.spread),
      cumulativeCost,
      proceeds,
      net: proceeds - purchase - cumulativeCost,
      npv:
        proceeds / Math.pow(1 + input.discountRate / 100, year) -
        purchase -
        presentCosts,
    };
  });
  const last = years[5];
  return {
    input,
    purchase,
    years,
    last,
    premium,
    annualCost,
    breakEven: (purchase + last.cumulativeCost) / (1 - input.saleFee / 100),
    breakEvenGrowth:
      (Math.pow(
        (purchase + last.cumulativeCost) /
          (1 - input.saleFee / 100) /
          (price *
            premium *
            Math.pow(
              1 - input.mileagePenalty / 100,
              (input.annualMiles * 5) / 10000,
            )),
        1 / 5,
      ) -
        1) *
      100,
    marketValue: price * Math.pow(1 + input.growth / 100, 5),
    mileageFactor: Math.pow(
      1 - input.mileagePenalty / 100,
      (input.annualMiles * 5) / 10000,
    ),
  };
}

export function historicalGrowth(values: (number | null)[]) {
  if (
    values.length !== 6 ||
    values.some((v) => v === null || !Number.isFinite(v) || v <= 0)
  )
    return null;
  return (Math.pow(values[5]! / values[0]!, 1 / 5) - 1) * 100;
}
