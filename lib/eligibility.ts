export type ListingCheck = {
 status: string; photoChecked: boolean; priceVerified: boolean;
 availableVerified: boolean; specVerified: boolean; ukVerified: boolean;
 price: number; year: number; checkedAt: string;
 modelId?: string; make?: string; model?: string; generation?: string;
 bodyStyle?: string; transmission?: string; factoryTransmission?: boolean; engine?: string;
};
function matchesModelPolicy(l: ListingCheck): boolean {
 if (!Number.isInteger(l.year)) return false;
 if (l.make === 'BMW' && l.model === 'M5' && l.modelId !== 'model-071') return false;
 if (l.modelId === 'model-071') return l.year >= 2007 && l.year <= 2010 &&
  l.make === 'BMW' && l.model === 'M5' && l.generation === 'E61' &&
  l.bodyStyle === 'Touring' && l.engine === '5.0 V10' &&
  l.transmission === 'SMG' && l.factoryTransmission === true;
 if (l.modelId === 'model-072') return l.year >= 2011 && l.year <= 2012 &&
  l.make === 'BMW' && l.model === '1M' && l.generation === 'E82' &&
  l.bodyStyle === 'Coupe' && l.transmission === 'manual' && l.factoryTransmission === true;
 if (l.modelId === 'model-073') return l.year >= 1980 && l.year <= 1991 &&
  l.make === 'Audi' && l.model === 'ur-quattro' && l.generation === 'original' &&
  l.bodyStyle === 'Coupe' && l.transmission === 'manual' && l.factoryTransmission === true;
 return l.year >= 1995 && l.year <= 2010;
}
export function isLiveListing(l: ListingCheck, now: number): boolean {
 const checked = Date.parse(l.checkedAt);
 return l.status === 'available' && l.photoChecked === true &&
 l.priceVerified === true && l.availableVerified === true &&
 l.specVerified === true && l.ukVerified === true &&
 Number.isFinite(l.price) && l.price >= 10000 && l.price <= 100000 &&
 matchesModelPolicy(l) &&
 Number.isFinite(checked) && checked <= now + 60000 && now - checked <= 86400000;
}
