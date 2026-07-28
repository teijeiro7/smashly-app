import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../_lib/supabase';
import { setCorsHeaders, handleOptions } from '../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'CRON_SECRET not configured' }));
    return;
  }

  const authHeader = req.headers['authorization'] || '';
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  try {
    const { data: activeWatches, error: fetchError } = await supabaseAdmin
      .from('price_watch')
      .select('id, user_id, racket_id, target_price')
      .eq('active', true);

    if (fetchError) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: fetchError.message }));
      return;
    }

    if (!activeWatches || activeWatches.length === 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ checked: 0, triggered: 0 }));
      return;
    }

    const racketIds = [...new Set(activeWatches.map(w => w.racket_id))];

    const { data: prices, error: pricesError } = await supabaseAdmin
      .from('store_prices')
      .select('racket_id, price')
      .in('racket_id', racketIds)
      .not('price', 'is', null);

    if (pricesError) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: pricesError.message }));
      return;
    }

    const minPriceByRacket = new Map<number, number>();
    for (const p of prices || []) {
      const current = minPriceByRacket.get(p.racket_id) ?? Infinity;
      if (p.price < current) {
        minPriceByRacket.set(p.racket_id, p.price);
      }
    }

    let triggered = 0;

    for (const watch of activeWatches) {
      const minPrice = minPriceByRacket.get(watch.racket_id);
      if (minPrice == null) continue;

      if (minPrice <= watch.target_price) {
        await supabaseAdmin.from('notifications').insert({
          user_id: watch.user_id,
          type: 'price_drop',
          title: '¡Precio bajado!',
          message: `El precio de tu pala vigilada ha bajado a ${minPrice.toFixed(2)}€ (objetivo: ${watch.target_price.toFixed(2)}€)`,
          data: { racket_id: watch.racket_id, watch_id: watch.id, current_price: minPrice, target_price: watch.target_price },
        });

        await supabaseAdmin
          .from('price_watch')
          .update({ active: false })
          .eq('id', watch.id);

        triggered++;
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ checked: activeWatches.length, triggered }));
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Internal error' }));
  }
}
