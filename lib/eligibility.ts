import models from '../data/models.json' with {type:'json'};

export type ListingCheck = {
 id?: string; url?: string;
 status: string; photoChecked: boolean; priceVerified: boolean;
 availableVerified: boolean; specVerified: boolean; ukVerified: boolean;
 price: number; year: number; checkedAt: string; mileage?: number | null; ownerCount?: number | null;
 modelId?: string; make?: string; model?: string; generation?: string;
 bodyStyle?: string; transmission?: string; factoryTransmission?: boolean; engine?: string;
};
const mileageLimitedMakes = new Set(['renault','subaru','mitsubishi']);
const mileageLimitedModels = new Set(models.filter(m=>mileageLimitedMakes.has(m.make.toLowerCase())).map(m=>m.id));
function matchesMileagePolicy(l: ListingCheck): boolean {
 if (!mileageLimitedModels.has(l.modelId ?? '') && !mileageLimitedMakes.has(l.make?.trim().toLowerCase() ?? '')) return true;
 return typeof l.mileage === 'number' && Number.isFinite(l.mileage) && l.mileage >= 0 && l.mileage < 30000 &&
  typeof l.ownerCount === 'number' && Number.isInteger(l.ownerCount) && l.ownerCount >= 1 && l.ownerCount <= 2;
}
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
// Owner's editorial decisions apply to these specific cars, not the entire models.
// Keep across feed imports; only the owner can reverse these exclusions.
const editorialExclusions = [
 {id:'vision-vn06lwy', host:'visioncarsales.co.uk', path:'/vehicle/name/bmw-z4-z4-m-roadster'},
 {id:'bp-10652', host:'bpcarsalesltd.co.uk', path:'/used/cars/honda-s2000-20-roadster-2dr-10652'},
];
function isEditoriallyExcluded(l: ListingCheck): boolean {
 if (editorialExclusions.some(e=>e.id===l.id)) return true;
 if (!l.url) return false;
 try {
  const u=new URL(l.url);
  return editorialExclusions.some(e=>e.host===u.hostname.replace(/^www\./,'') && e.path===u.pathname.replace(/\/+$/,''));
 } catch { return false; }
}
export function isLiveListing(l: ListingCheck, now: number): boolean {
 const checked = Date.parse(l.checkedAt);
 return !isEditoriallyExcluded(l) && l.status === 'available' && l.photoChecked === true &&
 l.priceVerified === true && l.availableVerified === true &&
 l.specVerified === true && l.ukVerified === true &&
 Number.isFinite(l.price) && l.price >= 10000 && l.price <= 100000 &&
 matchesModelPolicy(l) && matchesMileagePolicy(l) &&
 Number.isFinite(checked) && checked <= now + 60000 && now - checked <= 86400000;
}
