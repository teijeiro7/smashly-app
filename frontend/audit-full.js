import { execSync } from 'child_process';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/catalog', name: 'Catalog' },
  { path: '/racket-detail?id=test', name: 'RacketDetail' },
  { path: '/compare', name: 'Compare' },
  { path: '/best-racket', name: 'BestRacket' },
  { path: '/faq', name: 'FAQ' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/profile', name: 'Profile' },
];

const OUTPUT_DIR = './performance-audit-full';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

async function auditPage(page) {
  const url = `${BASE_URL}${page.path}`;
  const outputFile = `${OUTPUT_DIR}/${page.name.toLowerCase()}-audit.json`;
  
  console.log(`🔍 ${page.name}...`);
  
  try {
    execSync(`npx lighthouse ${url} --preset=perf --throttling.cpuSlowdownMultiplier=4 --throttling.rttMs=40 --throttling.downloadThroughputKbps=100000 --throttling.uploadThroughputKbps=50000 --output=json --output-path=${outputFile} --quiet --chrome-flags="--headless" --emulated-form-factor=mobile`, {
      stdio: 'pipe',
      timeout: 180000
    });
    
    const data = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
    const audits = data.audits;
    
    return {
      name: page.name,
      url: url,
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      tbt: audits['total-blocking-time']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      tti: audits['interactive']?.numericValue || 0,
      speedIndex: audits['speed-index']?.numericValue || 0,
      // Opportunities
      unusedJs: audits['unused-javascript']?.details?.items || [],
      offscreenImages: audits['offscreen-images']?.details?.items || [],
      renderBlocking: audits['render-blocking-resources']?.details?.items || [],
      largeJs: audits['mainthread-work-breakdown']?.details?.items || [],
    };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Auditoría completa...\n');
  
  const results = [];
  
  for (const page of PAGES) {
    const result = await auditPage(page);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\n📊 RESUMEN');
  console.log('='.repeat(70));
  
  for (const r of results) {
    console.log(`\n🔹 ${r.name}`);
    console.log(`   FCP: ${(r.fcp/1000).toFixed(1)}s | LCP: ${(r.lcp/1000).toFixed(1)}s | TBT: ${r.tbt}ms | TTI: ${(r.tti/1000).toFixed(1)}s`);
  }
  
  // Analyze opportunities
  console.log('\n📈 ANÁLISIS DE OPORTUNIDADES');
  console.log('='.repeat(70));
  
  let totalUnusedJs = 0;
  let totalImages = 0;
  let totalBlocking = 0;
  
  for (const r of results) {
    totalUnusedJs += r.unusedJs.reduce((a, i) => a + (i.wastedBytes || 0), 0);
    totalImages += r.offscreenImages.length;
    totalBlocking += r.renderBlocking.reduce((a, i) => a + (i.wastedMs || 0), 0);
  }
  
  console.log(`\n🔴 JS sin usar: ${(totalUnusedJs/1024/1024).toFixed(1)}MB desperdiciado`);
  console.log(`🟠 Imágenes offscreen: ${totalImages} elementos`);
  console.log(`🟡 Bloqueos render: ${totalBlocking.toFixed(0)}ms`);
  
  // Find worst pages
  const worstLCP = [...results].sort((a, b) => b.lcp - a.lcp)[0];
  const worstTBT = [...results].sort((a, b) => b.tbt - a.tbt)[0];
  
  console.log('\n⚠️ PÁGINAS CRÍTICAS');
  console.log('='.repeat(70));
  console.log(`   Peor LCP: ${worstLCP.name} (${(worstLCP.lcp/1000).toFixed(1)}s)`);
  console.log(`   Peor TBT: ${worstTBT.name} (${worstTBT.tbt}ms)`);
  
  fs.writeFileSync(`${OUTPUT_DIR}/full-summary.json`, JSON.stringify(results, null, 2));
  console.log(`\n✅ Informes en: ${OUTPUT_DIR}/`);
}

main().catch(console.error);