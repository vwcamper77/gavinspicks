'use client';
import logos from '@/data/manufacturer-logos.json';
import {LayoutGrid} from 'lucide-react';
type Props={makes:Array<{name:string;count:number}>;value:string;onChange:(make:string)=>void};
export default function ManufacturerFilter({makes,value,onChange}:Props){
 const total=makes.reduce((sum,make)=>sum+make.count,0);
 return <section className="manufacturer-filter" aria-label="Filter available cars by manufacturer"><p className="manufacturer-label">FIND YOUR MAKE</p><div className="manufacturer-menu" role="group" aria-label="Manufacturer"><button type="button" aria-pressed={!value} onClick={()=>onChange('')}><LayoutGrid size={32}/><span>All makes <small>{total}</small></span></button>{makes.map(make=><button type="button" key={make.name} aria-pressed={value===make.name} onClick={()=>onChange(make.name)}>{logos[make.name as keyof typeof logos]?<img src={logos[make.name as keyof typeof logos]} alt="" width={56} height={40}/>:<span className="make-initial">{make.name.slice(0,2)}</span>}<span>{make.name} <small>{make.count}</small></span></button>)}</div></section>
}
