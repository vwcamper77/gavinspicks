export type ListingCheck = {
 status: string; photoChecked: boolean; priceVerified: boolean;
 availableVerified: boolean; specVerified: boolean; ukVerified: boolean;
 price: number; year: number; checkedAt: string;
};
export function isLiveListing(l: ListingCheck, now: number): boolean {
 const checked = Date.parse(l.checkedAt);
 return l.status === 'available' && l.photoChecked === true &&
 l.priceVerified === true && l.availableVerified === true &&
 l.specVerified === true && l.ukVerified === true &&
 Number.isFinite(l.price) && l.price >= 10000 && l.price <= 100000 &&
 Number.isInteger(l.year) && l.year >= 1995 && l.year <= 2010 &&
 Number.isFinite(checked) && checked <= now + 60000 && now - checked <= 86400000;
}
