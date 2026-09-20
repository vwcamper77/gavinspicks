'use client';

import {useState} from 'react';
import {Table, TableHeader, TableRow, TableHead, TableBody, TableCell} from '@/components/ui/table';
import {formatDuration, observedDuration, sortPastFinds, type PastFind, type HistorySort} from '@/lib/listing-history';

const date = (value?: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London'})
  : 'Not recorded';
const money = (value: number) => new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP', maximumFractionDigits: 0}).format(value);
const statusLabel = (status: string) => status === 'sold' ? 'Sold' : status === 'deposit-taken' ? 'Deposit taken' : 'Unavailable';

export default function PastFinds({cars, query}: {cars: PastFind[]; query: string}) {
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<HistorySort>('fastest');
  const matches = sortPastFinds(cars.filter(car =>
    (status === 'all' || car.status === status) &&
    `${car.label} ${car.source}`.toLowerCase().includes(query.toLowerCase())
  ), sort);
  return <section aria-label="Past finds and listing durations">
    <div className="section-line"><span>{matches.length} PAST FINDS</span><span>From finding a car to its status changing</span></div>
    <p className="footnote">See how long each car stayed on our radar. Time tracked runs from first found to the first recorded sold, deposit or unavailable check. These are observation times, not the seller’s original listing date or exact sale time. An unavailable advert may have been withdrawn without selling.</p>
    <div className="browse-sort history-controls">
      <label>Show<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All past finds</option><option value="sold">Confirmed sold</option><option value="deposit-taken">Deposit taken</option><option value="unavailable">Unavailable</option></select></label>
      <label>Sort by<select value={sort} onChange={event => setSort(event.target.value as HistorySort)}><option value="fastest">Shortest time tracked</option><option value="slowest">Longest time tracked</option><option value="recent">Latest status change</option></select></label>
    </div>
    <output className="history-result">{matches.length} {matches.length === 1 ? 'car' : 'cars'} · {matches.filter(car => observedDuration(car) !== null).length} with recorded timing</output>
    <Table className="history-table">
      <caption className="sr-only">Past finds, discovery dates, observed status changes and time tracked. All dates use UK time.</caption>
      <TableHeader><TableRow><TableHead>CAR / LAST ASK</TableHead><TableHead>FIRST FOUND</TableHead><TableHead>STATUS FIRST OBSERVED</TableHead><TableHead>TIME TRACKED</TableHead><TableHead>OUTCOME</TableHead></TableRow></TableHeader>
      <TableBody>{matches.map(car => <TableRow key={car.id}>
        <TableCell><a href={car.url} target="_blank" rel="noreferrer">{car.label} ↗</a><small>{car.source.replace('www.', '')}</small><small>{car.lastAskingPrice != null ? `${money(car.lastAskingPrice)} asking price` : 'Last asking price not recorded'}</small></TableCell>
        <TableCell>{date(car.firstSeen)}{car.firstSeenBasis === 'site-import' && <small>Added to Gavin’s Picks; earlier discovery date unknown</small>}</TableCell>
        <TableCell>{date(car.statusObservedAt)}{car.lastSeenAt && <small>Last seen available: {date(car.lastSeenAt)}</small>}</TableCell>
        <TableCell><strong>{formatDuration(observedDuration(car))}</strong>{observedDuration(car) === null && <small>Discovery or status date missing</small>}</TableCell>
        <TableCell><strong>{statusLabel(car.status)}</strong><details><summary>Evidence</summary><p>{car.note}</p><small>Last checked {date(car.checkedAt)}</small></details></TableCell>
      </TableRow>)}</TableBody>
    </Table>
    {!matches.length && <p className="notice">No past finds match those filters.</p>}
    <p className="footnote">Older records without a discovery date stay in the list with “Not recorded”. Asking prices are not achieved sale prices. All dates use UK time.</p>
  </section>;
}
