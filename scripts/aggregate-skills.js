// ── Imports & Configuration ─────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const REGISTRY_PATH = join(ROOT_DIR, 'skills', 'registry.json');
const OUTPUT_DIR = join(ROOT_DIR, 'site', 'src', 'data');
const OUTPUT_PATH = join(OUTPUT_DIR, 'skills.json');

// ── Helpers ─────────────────────────────────────────────────────────────────

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ── Registry Loading ────────────────────────────────────────────────────────

function loadRegistry() {
  log('\n📚 Loading skills registry...', 'cyan');

  try {
    const registryContent = readFileSync(REGISTRY_PATH, 'utf-8');
    const registry = JSON.parse(registryContent);

    log(`   Loaded ${registry.skills.length} skills from registry`, 'green');
    log(`   Loaded ${registry.categories.length} categories`, 'green');

    return registry;
  } catch (error) {
    log(`   ⚠️  Failed to load registry: ${error.message}`, 'red');
    throw error;
  }
}

// ── Output ──────────────────────────────────────────────────────────────────

function writeOutput(data) {
  log('\n💾 Writing output...', 'cyan');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    log(`   Created directory: ${OUTPUT_DIR}`, 'yellow');
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');

  log(`   Written to: ${OUTPUT_PATH}`, 'green');
}

function generateStats(skills, categories) {
  log('\n📊 Statistics:', 'magenta');
  log(`   Total skills: ${skills.length}`, 'bright');
  log(`   Total categories: ${categories.length}`, 'bright');

  const categoryCounts = {};
  skills.forEach(skill => {
    const cat = skill.category || 'uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  log('\n   Skills by category:', 'cyan');
  Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
    const categoryInfo = categories.find(c => c.id === category);
    const icon = categoryInfo?.icon || '📁';
    const name = categoryInfo?.name || category;
    log(`     ${icon} ${name}: ${count}`, 'blue');
  });

  const complexityCounts = {};
  skills.forEach(skill => {
    const complexity = skill.complexity || 'intermediate';
    complexityCounts[complexity] = (complexityCounts[complexity] || 0) + 1;
  });

  log('\n   Skills by complexity:', 'cyan');
  Object.entries(complexityCounts).sort((a, b) => b[1] - a[1]).forEach(([complexity, count]) => {
    log(`     ${complexity}: ${count}`, 'blue');
  });

  const repoSources = {};
  skills.forEach(skill => {
    const repoName = skill.source?.repoName || 'unknown';
    repoSources[repoName] = (repoSources[repoName] || 0) + 1;
  });

  log('\n   Skills by source repository:', 'cyan');
  Object.entries(repoSources).sort((a, b) => b[1] - a[1]).forEach(([repo, count]) => {
    log(`     ${repo}: ${count}`, 'blue');
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

(async function main() {
  try {
    log('\n╔════════════════════════════════════════════════╗', 'bright');
    log('║     .NET Skills Hub - Skill Aggregation      ║', 'bright');
    log('╚════════════════════════════════════════════════╝', 'bright');

    const registry = loadRegistry();

    const outputData = {
      version: registry.version,
      lastUpdated: new Date().toISOString(),
      categories: registry.categories,
      skills: registry.skills
    };

    writeOutput(outputData);

    generateStats(registry.skills, registry.categories);

    log('\n✅ Aggregation complete!\n', 'green');
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
})();
