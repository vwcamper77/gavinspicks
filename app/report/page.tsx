import Link from 'next/link';
import {getPublicSelectionReport} from '@/lib/public-selection-report';

export const dynamic = 'force-dynamic';

export default async function ReportPage({searchParams}: {searchParams: Promise<{locale?: string}>}) {
  const es = (await searchParams).locale === 'es';
  const report = await getPublicSelectionReport().catch(() => null);
  const money = new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP', maximumFractionDigits: 0});
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <nav className="flex flex-wrap gap-5 text-sm underline">
        <Link href="/">← Gavin’s Picks</Link>
        <Link href={es ? '/report' : '/report?locale=es'}>{es ? 'English' : 'Español'}</Link>
        <a href="/api/selection-report">JSON</a>
      </nav>
      <h1 className="mt-8 text-4xl font-semibold">{es ? 'Selección diaria' : 'Daily selection'}</h1>
      <p className="mt-4">1995–2010 · £10,000–£100,000 · {es ? 'Sin BMW 1M, Focus RS ni cajas de 3 o 4 velocidades.' : 'Excludes BMW 1M, Focus RS and 3 or 4-speed gearboxes.'}</p>
      <p className="mt-2 text-sm text-muted-foreground">{es ? 'Hasta 4 por año, 3 por modelo y 50 en total. Anuncios comprobados en las últimas 24 horas.' : 'Up to 4 per year, 3 per model and 50 overall. Adverts checked within the last 24 hours.'}</p>
      {!report ? <p className="mt-8" role="alert">{es ? 'No se pudo comprobar la disponibilidad. Vuelve a intentarlo más tarde.' : 'Availability checks are temporarily unavailable. Please try again later.'}</p> : <>
        <p className="mt-6 text-sm">{es ? 'Generado' : 'Generated'}: {new Intl.DateTimeFormat(es ? 'es-ES' : 'en-GB', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London'}).format(new Date(report.generatedAt))} (UK)</p>
        <p className="mt-2 font-semibold">{report.totalSelected} {es ? 'coincidencias verificadas' : 'verified matches'}</p>
        {report.totalSelected === 0 && <p className="mt-6 rounded-lg border p-5">{es ? 'Ningún anuncio del catálogo actual cumple todos los criterios y la comprobación de 24 horas. Esto no significa que todos los coches estén vendidos.' : 'No adverts in the current feed meet every criterion and the 24-hour check requirement. This does not mean all the cars are sold.'}</p>}
        {report.perYear.filter(bucket => bucket.count > 0).map(bucket => <section className="mt-8" key={bucket.year}>
          <h2 className="text-2xl font-semibold">{bucket.year}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">{bucket.topListings.map(car => <article className="rounded-lg border p-5" key={car.id}>
            <h3 className="text-lg font-semibold">{car.title}</h3>
            <p className="mt-2">{money.format(car.price)} · {car.gearbox}</p>
            <p className="mt-2 text-sm">{car.seller} · {car.location}</p>
            <p className="mt-2 text-sm">{es ? 'Comprobado' : 'Checked'}: {new Date(car.checkedAt).toLocaleString(es ? 'es-ES' : 'en-GB', {timeZone: 'Europe/London'})} (UK)</p>
            <a className="mt-4 inline-block underline" href={car.url} target="_blank" rel="noreferrer">{es ? 'Ver anuncio' : 'View advert'} ↗</a>
          </article>)}</div>
        </section>)}
      </>}
    </main>
  );
}
