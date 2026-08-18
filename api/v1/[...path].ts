import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Single catch-all dispatcher for every /api/v1/* route.
 *
 * Vercel's Hobby plan caps a deployment at 12 Serverless Functions. Each of
 * the 15 handlers this project needed under api/v1/** used to be its own
 * file/function, which alone pushed the project past the limit and failed
 * every deploy ("Deploying outputs..." -> Error, no build error — this is a
 * platform-level cap, not a code bug).
 *
 * The actual handler implementations were moved unchanged to api/_v1/** (the
 * `_` prefix means Vercel doesn't treat that subtree as functions at all)
 * and are just imported + called here. Every one of them already parses its
 * own dynamic path segment(s) directly from req.url (see e.g.
 * price-watch/[id].ts, stores/catalog/[storeId]/[priceId].ts), so req.url
 * being unchanged when dispatched from this catch-all is enough — the only
 * exception is stores/[id].ts, which reads req.query.id the way Vercel would
 * have injected it for a real [id].ts route, so that one case is set
 * explicitly below.
 */
import adminRacketConflicts from '../_v1/admin/rackets/conflicts';
import adminRacketResolve from '../_v1/admin/rackets/[id]/resolve';
import adminRecentActivity from '../_v1/admin/recent-activity';
import analyticsStore from '../_v1/analytics/store';
import analyticsStoreTimeline from '../_v1/analytics/store/[id]/timeline';
import errors from '../_v1/errors';
import messagingConversations from '../_v1/messaging/conversations';
import messagingMessages from '../_v1/messaging/messages';
import priceWatchIndex from '../_v1/price-watch/index';
import priceWatchById from '../_v1/price-watch/[id]';
import racketsPriceHistory from '../_v1/rackets/[id]/price-history';
import storesIndex from '../_v1/stores/index';
import storesMyStore from '../_v1/stores/my-store';
import storesCatalogSearch from '../_v1/stores/catalog/[storeId]/search';
import storesCatalogPriceId from '../_v1/stores/catalog/[storeId]/[priceId]';
import storesCatalogStoreId from '../_v1/stores/catalog/[storeId]';
import storesById from '../_v1/stores/[id]';
import usersMeActivity from '../_v1/users/me/activity';

type Req = IncomingMessage & { query?: any };

export default async function handler(req: Req, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const segments = url.pathname.replace(/^\/api\/v1\/?/, '').split('/').filter(Boolean);
  const [a, b, c, d] = segments;

  // admin/*
  if (segments.length === 2 && a === 'admin' && b === 'recent-activity') {
    return adminRecentActivity(req, res);
  }
  if (segments.length === 3 && a === 'admin' && b === 'rackets' && c === 'conflicts') {
    return adminRacketConflicts(req, res);
  }
  if (segments.length === 4 && a === 'admin' && b === 'rackets' && d === 'resolve') {
    req.query = { ...req.query, id: c };
    return adminRacketResolve(req, res);
  }

  // analytics/*
  if (segments.length === 2 && a === 'analytics' && b === 'store') {
    return analyticsStore(req, res);
  }
  if (segments.length === 4 && a === 'analytics' && b === 'store' && d === 'timeline') {
    return analyticsStoreTimeline(req, res);
  }

  // messaging/*
  if (segments.length === 2 && a === 'messaging' && b === 'conversations') {
    return messagingConversations(req, res);
  }
  if (segments.length === 2 && a === 'messaging' && b === 'messages') {
    return messagingMessages(req, res);
  }

  // price-watch, price-watch/:id
  if (segments.length === 1 && a === 'price-watch') {
    return priceWatchIndex(req, res);
  }
  if (segments.length === 2 && a === 'price-watch') {
    return priceWatchById(req, res);
  }

  // rackets/:id/price-history
  if (segments.length === 3 && a === 'rackets' && c === 'price-history') {
    return racketsPriceHistory(req, res);
  }

  // stores/*  (most specific first: literal segments before wildcard :id)
  if (segments.length === 1 && a === 'stores') {
    return storesIndex(req, res);
  }
  if (segments.length === 2 && a === 'stores' && b === 'my-store') {
    return storesMyStore(req, res);
  }
  if (segments.length === 4 && a === 'stores' && b === 'catalog' && d === 'search') {
    return storesCatalogSearch(req, res);
  }
  if (segments.length === 4 && a === 'stores' && b === 'catalog') {
    return storesCatalogPriceId(req, res);
  }
  if (segments.length === 3 && a === 'stores' && b === 'catalog') {
    return storesCatalogStoreId(req, res);
  }
  if (segments.length === 2 && a === 'stores') {
    req.query = { ...req.query, id: b };
    return storesById(req, res);
  }

  // users/me/activity
  if (segments.length === 3 && a === 'users' && b === 'me' && c === 'activity') {
    return usersMeActivity(req, res);
  }

  // errors — public error-reporting ingestion (see api/_v1/errors.ts)
  if (segments.length === 1 && a === 'errors') {
    return errors(req, res);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}
