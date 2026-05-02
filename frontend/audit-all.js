import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/catalog', name: 'Catalog' },
  { path: '/compare', name: 'Compare' },
  { path: '/faq', name: 'FAQ' },
];

const OUTPUT_DIR = './performance-audit';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

async function auditPage(page) {
  const url = `${BASE_URL}${page.path}`;
  const outputFile = `${OUTPUT_DIR}/${page.name.toLowerCase()}-audit.json`;
  
  console.log(`\n🔍 Auditando ${page.name} (${url})...`);
  
  try {
    execSync(`npx lighthouse ${url} --preset=perf --throttling.cpuSlowdownMultiplier=4 --throttling.rttMs=40 --throttling.downloadThroughputKbps=100000 --throttling.uploadThroughputKbps=50000 --output=json --output-path=${outputFile} --quiet --chrome-flags="--headless" --emulated-form-factor=mobile`, {
      stdio: 'inherit',
      timeout: 120000
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
      mainThreadWork: audits['mainthread-work-breakdown']?.details?.items || [],
      largestContentfulPaintElement: audits['largest-contentful-paint-element']?.details?.items || [],
      unusedJavascript: audits['unused-javascript']?.details?.items || [],
    };
  } catch (error) {
    console.error(`❌ Error auditando ${page.name}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting automatic Lighthouse audit...\n');
  console.log('📱 URL base:', BASE_URL);
  console.log('📄 Páginas a auditar:', PAGES.map(p => p.name).join(', '));
  
  const results = [];
  
  for (const page of PAGES) {
    const result = await auditPage(page);
    if (result) {
      results.push(result);
    }
  }
  
  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE AUDITORÍA');
  console.log('='.repeat(60));
  
  for (const r of results) {
    console.log(`\n🔹 ${r.name} (${r.url})`);
    console.log(`   FCP:  ${(r.fcp / 1000).toFixed(1)}s`);
    console.log(`   LCP:  ${(r.lcp / 1000).toFixed(1)}s`);
    console.log(`   TBT:  ${r.tbt}ms`);
    console.log(`   TTI:  ${(r.tti / 1000).toFixed(1)}s`);
    console.log(`   CLS:  ${r.cls.toFixed(3)}`);
  }
  
  // Find worst performing metrics
  const avgFcp = results.reduce((a, r) => a + r.fcp, 0) / results.length;
  const avgLcp = results.reduce((a, r) => a + r.lcp, 0) / results.length;
  const avgTbt = results.reduce((a, r) => a + r.tbt, 0) / results.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 PROMEDIOS');
  console.log('='.repeat(60));
  console.log(`   FCP promedio:  ${(avgFcp / 1000).toFixed(1)}s`);
  console.log(`   LCP promedio:  ${(avgLcp / 1000).toFixed(1)}s`);
  console.log(`   TBT promedio: ${avgTbt.toFixed(0)}ms`);
  
  // Save summary
  fs.writeFileSync(`${OUTPUT_DIR}/summary.json`, JSON.stringify(results, null, 2));
  console.log(`\n✅ Informes guardados en: ${OUTPUT_DIR}/`);
}

main().catch(console.error);