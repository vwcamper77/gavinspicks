export type ListingSort = 'newest'|'oldest'|'price-asc'|'price-desc'|'mileage-asc'|'mileage-desc'|'year-asc'|'year-desc';
type SortableListing = {id:string;firstSeen:string;price:number;mileage:number|null;year:number};
export function sortListings<T extends SortableListing>(listings:readonly T[],sort:ListingSort):T[]{
  return [...listings].sort((a,b)=>{
    const recent=Date.parse(b.firstSeen)-Date.parse(a.firstSeen);
    let difference=0;
    switch(sort){
      case 'oldest': difference=-recent;break;
      case 'price-asc': difference=a.price-b.price;break;
      case 'price-desc': difference=b.price-a.price;break;
      case 'year-asc': difference=a.year-b.year;break;
      case 'year-desc': difference=b.year-a.year;break;
      case 'mileage-asc':case 'mileage-desc':
        if(a.mileage===null&&b.mileage!==null)return 1;
        if(b.mileage===null&&a.mileage!==null)return -1;
        difference=(a.mileage??0)-(b.mileage??0);
        if(sort==='mileage-desc')difference=-difference;
        break;
      default:difference=recent;
    }
    return difference||recent||a.id.localeCompare(b.id);
  });
}
