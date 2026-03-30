// ── Imports & Configuration ─────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const SOURCES_DIR = join(ROOT_DIR, 'sources');
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

function walkDirectory(dir, fileList = []) {
  if (!existsSync(dir)) {
    return fileList;
  }

  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      walkDirectory(filePath, fileList);
    } else if (file === 'SKILL.md') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// ── Skill Discovery ─────────────────────────────────────────────────────────

function discoverSkills() {
  log('\n🔍 Discovering skills from sources...', 'cyan');

  const skillFiles = walkDirectory(SOURCES_DIR);

  log(`   Found ${skillFiles.length} SKILL.md files`, 'green');

  return skillFiles;
}

// ── Skill Parsing ───────────────────────────────────────────────────────────

function parseSkillFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    const relativePath = filePath.replace(SOURCES_DIR, '').replace(/\\/g, '/');
    const pathParts = relativePath.split('/').filter(Boolean);
    const sourceName = pathParts[0] || 'unknown';

    const skill = {
      id: frontmatter.id || frontmatter.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      name: frontmatter.name || 'Unnamed Skill',
      description: frontmatter.description || '',
      shortDescription: frontmatter.shortDescription || frontmatter.description?.substring(0, 80) || '',
      category: frontmatter.category || 'uncategorized',
      author: frontmatter.author || 'unknown',
      triggers: Array.isArray(frontmatter.triggers) ? frontmatter.triggers : [],
      complexity: frontmatter.complexity || 'intermediate',
      featured: frontmatter.featured || false,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      source: {
        repo: frontmatter.source?.repo || 'https://github.com/dotnet/skills',
        path: relativePath,
        branch: frontmatter.source?.branch || 'main'
      },
      files: [
        {
          path: 'SKILL.md',
          content: content
        }
      ],
      _sourceName: sourceName
    };

    return skill;
  } catch (error) {
    log(`   ⚠️  Failed to parse ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

// ── Registry Merging ────────────────────────────────────────────────────────

function loadRegistry() {
  log('\n📚 Loading curated registry...', 'cyan');

  try {
    const registryContent = readFileSync(REGISTRY_PATH, 'utf-8');
    const registry = JSON.parse(registryContent);

    log(`   Loaded ${registry.skills.length} skills from registry`, 'green');

    return registry;
  } catch (error) {
    log(`   ⚠️  Failed to load registry: ${error.message}`, 'yellow');
    return { version: '1.0.0', lastUpdated: new Date().toISOString(), categories: [], skills: [] };
  }
}

function mergeSkills(registrySkills, discoveredSkills) {
  log('\n🔄 Merging discovered skills with registry...', 'cyan');

  const skillMap = new Map();

  registrySkills.forEach(skill => {
    skillMap.set(skill.id, { ...skill, _source: 'registry' });
  });

  discoveredSkills.forEach(skill => {
    if (!skillMap.has(skill.id)) {
      skillMap.set(skill.id, { ...skill, _source: 'discovered' });
    }
  });

  const mergedSkills = Array.from(skillMap.values());

  log(`   Total merged skills: ${mergedSkills.length}`, 'green');
  log(`   Registry skills: ${registrySkills.length}`, 'blue');
  log(`   Discovered skills: ${discoveredSkills.length}`, 'blue');

  return mergedSkills;
}

// ── File Content Embedding ─────────────────────────────────────────────────

function embedFileContents(skills) {
  log('\n📦 Embedding file contents...', 'cyan');

  let embeddedCount = 0;

  skills.forEach(skill => {
    if (skill.files && skill.files.length > 0) {
      embeddedCount++;
    } else if (!skill.files) {
      skill.files = [];
    }
  });

  log(`   Embedded content for ${embeddedCount} skills`, 'green');

  return skills;
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

  const sourceCounts = {};
  skills.forEach(skill => {
    const source = skill._sourceName || skill._source || 'registry';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  log('\n   Skills by source:', 'cyan');
  Object.entries(sourceCounts).forEach(([source, count]) => {
    log(`     ${source}: ${count}`, 'blue');
  });

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
}

// ── Main ────────────────────────────────────────────────────────────────────

(async function main() {
  try {
    log('\n╔════════════════════════════════════════════════╗', 'bright');
    log('║     .NET Skills Hub - Skill Aggregation      ║', 'bright');
    log('╚════════════════════════════════════════════════╝', 'bright');

    const registry = loadRegistry();

    const skillFiles = discoverSkills();

    log('\n🔨 Parsing skill files...', 'cyan');
    const discoveredSkills = skillFiles
      .map(parseSkillFile)
      .filter(skill => skill !== null);
    log(`   Parsed ${discoveredSkills.length} skills successfully`, 'green');

    let mergedSkills = mergeSkills(registry.skills, discoveredSkills);

    mergedSkills = embedFileContents(mergedSkills);

    const outputData = {
      version: registry.version,
      lastUpdated: new Date().toISOString(),
      categories: registry.categories,
      skills: mergedSkills
    };

    writeOutput(outputData);

    generateStats(mergedSkills, registry.categories);

    log('\n✅ Aggregation complete!\n', 'green');
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
})();
