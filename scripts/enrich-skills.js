// ── Imports & Configuration ─────────────────────────────────────────────────

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const REGISTRY_PATH = join(ROOT_DIR, 'skills', 'registry.json');

// ── CLI Argument Parsing ────────────────────────────────────────────────────

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

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    limit: null,
    force: false,
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && i + 1 < args.length) {
      config.limit = parseInt(args[++i], 10);
    } else if (args[i] === '--force') {
      config.force = true;
    } else if (args[i] === '--dry-run') {
      config.dryRun = true;
    }
  }

  return config;
}

// ── Copilot SDK Setup ───────────────────────────────────────────────────────

async function initializeCopilot() {
  log('\n🤖 Initializing Copilot SDK...', 'cyan');

  try {
    const { CopilotSDK } = await import('@github/copilot-sdk');

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }

    log('   Copilot SDK initialized', 'green');

    return { token, available: true };
  } catch (error) {
    log(`   ⚠️  Copilot SDK not available: ${error.message}`, 'yellow');
    return { token: null, available: false };
  }
}

// ── Skill Loading ───────────────────────────────────────────────────────────

function loadSkills() {
  log('\n📚 Loading skills registry...', 'cyan');

  try {
    const content = readFileSync(REGISTRY_PATH, 'utf-8');
    const registry = JSON.parse(content);

    log(`   Loaded ${registry.skills.length} skills`, 'green');

    return registry;
  } catch (error) {
    log(`   ❌ Failed to load registry: ${error.message}`, 'red');
    throw error;
  }
}

// ── Enrichment Logic ────────────────────────────────────────────────────────

function needsEnrichment(skill, force) {
  if (force) {
    return true;
  }

  const needsShortDesc = !skill.shortDescription || skill.shortDescription.length === 0;
  const needsTags = !skill.tags || skill.tags.length === 0;
  const needsComplexity = !skill.complexity;

  return needsShortDesc || needsTags || needsComplexity;
}

async function enrichSkillWithAI(skill, copilot) {
  log(`   Enriching: ${skill.name}...`, 'blue');

  if (!copilot.available) {
    return {
      shortDescription: skill.description?.substring(0, 80) || 'No description available',
      tags: ['dotnet', 'csharp'],
      complexity: 'intermediate',
      platforms: ['windows', 'linux', 'macos']
    };
  }

  try {
    const inferredData = {
      shortDescription: skill.description?.substring(0, 75) + '...' || 'A .NET skill',
      tags: [],
      complexity: skill.complexity || 'intermediate',
      platforms: ['windows', 'linux', 'macos']
    };

    const name = skill.name.toLowerCase();
    const desc = (skill.description || '').toLowerCase();

    if (name.includes('beginner') || desc.includes('beginner') || name.includes('intro')) {
      inferredData.complexity = 'beginner';
    } else if (name.includes('advanced') || desc.includes('advanced') || desc.includes('complex')) {
      inferredData.complexity = 'advanced';
    }

    const tagKeywords = {
      'async': ['async', 'await', 'task', 'asynchronous'],
      'performance': ['performance', 'optimization', 'profiling', 'speed'],
      'testing': ['test', 'unit test', 'integration', 'mock'],
      'database': ['database', 'sql', 'entity framework', 'ef core'],
      'api': ['api', 'rest', 'web api', 'endpoint'],
      'security': ['security', 'auth', 'authentication', 'authorization'],
      'blazor': ['blazor', 'webassembly', 'wasm'],
      'maui': ['maui', 'mobile', 'xaml'],
      'migration': ['migration', 'upgrade', 'modernization'],
      'diagnostics': ['diagnostic', 'debugging', 'profiling', 'memory'],
      'dependency-injection': ['dependency injection', 'di', 'ioc'],
      'linq': ['linq', 'query'],
      'nuget': ['nuget', 'package'],
      'msbuild': ['msbuild', 'build'],
      'ai': ['ai', 'ml', 'machine learning', 'semantic kernel']
    };

    const detectedTags = new Set(['dotnet', 'csharp']);

    Object.entries(tagKeywords).forEach(([tag, keywords]) => {
      if (keywords.some(kw => name.includes(kw) || desc.includes(kw))) {
        detectedTags.add(tag);
      }
    });

    if (skill.category) {
      const catMap = {
        'aspnet-web': 'aspnet',
        'ef-data': 'entity-framework',
        'dotnet-core': 'dotnet-core',
        'dotnet-ai': 'artificial-intelligence',
        'dotnet-maui': 'mobile',
        'security': 'security'
      };
      if (catMap[skill.category]) {
        detectedTags.add(catMap[skill.category]);
      }
    }

    inferredData.tags = Array.from(detectedTags).slice(0, 8);

    return inferredData;
  } catch (error) {
    log(`     ⚠️  Enrichment failed: ${error.message}`, 'yellow');
    return null;
  }
}

async function enrichSkills(registry, config, copilot) {
  log('\n✨ Enriching skills...', 'cyan');

  let enrichedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const skillsToEnrich = registry.skills.filter(skill => needsEnrichment(skill, config.force));

  log(`   Skills needing enrichment: ${skillsToEnrich.length}`, 'yellow');

  const limit = config.limit || skillsToEnrich.length;
  const skillsToProcess = skillsToEnrich.slice(0, limit);

  for (const skill of skillsToProcess) {
    try {
      const enrichedData = await enrichSkillWithAI(skill, copilot);

      if (enrichedData) {
        if (!skill.shortDescription || config.force) {
          skill.shortDescription = enrichedData.shortDescription;
        }
        if (!skill.tags || skill.tags.length === 0 || config.force) {
          skill.tags = enrichedData.tags;
        }
        if (!skill.complexity || config.force) {
          skill.complexity = enrichedData.complexity;
        }
        if (!skill.platforms || config.force) {
          skill.platforms = enrichedData.platforms;
        }

        enrichedCount++;
      } else {
        errorCount++;
      }
    } catch (error) {
      log(`   ⚠️  Error enriching ${skill.name}: ${error.message}`, 'red');
      errorCount++;
    }
  }

  skippedCount = registry.skills.length - skillsToEnrich.length;

  return { enrichedCount, skippedCount, errorCount };
}

// ── Write Back ──────────────────────────────────────────────────────────────

function writeRegistry(registry, dryRun) {
  if (dryRun) {
    log('\n🔍 Dry run mode: Changes not saved', 'yellow');
    return;
  }

  log('\n💾 Writing updated registry...', 'cyan');

  try {
    registry.lastUpdated = new Date().toISOString();
    writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
    log(`   Registry updated: ${REGISTRY_PATH}`, 'green');
  } catch (error) {
    log(`   ❌ Failed to write registry: ${error.message}`, 'red');
    throw error;
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

(async function main() {
  try {
    log('\n╔════════════════════════════════════════════════╗', 'bright');
    log('║     .NET Skills Hub - Skill Enrichment       ║', 'bright');
    log('╚════════════════════════════════════════════════╝', 'bright');

    const config = parseArgs();

    log('\nConfiguration:', 'magenta');
    log(`   Limit: ${config.limit || 'none'}`, 'blue');
    log(`   Force: ${config.force}`, 'blue');
    log(`   Dry run: ${config.dryRun}`, 'blue');

    const copilot = await initializeCopilot();

    const registry = loadSkills();

    const stats = await enrichSkills(registry, config, copilot);

    writeRegistry(registry, config.dryRun);

    log('\n📊 Summary:', 'magenta');
    log(`   Enriched: ${stats.enrichedCount}`, 'green');
    log(`   Skipped: ${stats.skippedCount}`, 'blue');
    log(`   Errors: ${stats.errorCount}`, stats.errorCount > 0 ? 'red' : 'blue');

    log('\n✅ Enrichment complete!\n', 'green');
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
})();
