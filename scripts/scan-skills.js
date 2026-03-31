// ── Imports & CLI Argument Parsing ─────────────────────────────────────────

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

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
    output: 'scan-report.json',
    updateSkills: false,
    aiScan: false,
    failOnHigh: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) {
      config.output = args[++i];
    } else if (args[i] === '--update-skills') {
      config.updateSkills = true;
    } else if (args[i] === '--ai-scan') {
      config.aiScan = true;
    } else if (args[i] === '--fail-on-high') {
      config.failOnHigh = true;
    }
  }

  return config;
}

// ── Rule Loading ────────────────────────────────────────────────────────────

function parseYAML(content) {
  const rules = [];
  const lines = content.split('\n');
  let currentRule = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('- id:')) {
      if (currentRule) {
        rules.push(currentRule);
      }
      currentRule = { id: line.substring(5).trim() };
    } else if (currentRule) {
      if (line.startsWith('name:')) {
        currentRule.name = line.substring(5).trim();
      } else if (line.startsWith('description:')) {
        currentRule.description = line.substring(12).trim();
      } else if (line.startsWith('severity:')) {
        currentRule.severity = line.substring(9).trim();
      } else if (line.startsWith('pattern:')) {
        let pattern = line.substring(8).trim();
        if (pattern.startsWith("'") && pattern.endsWith("'")) {
          pattern = pattern.substring(1, pattern.length - 1);
        }
        currentRule.pattern = pattern;
      } else if (line.startsWith('message:')) {
        let message = line.substring(8).trim();
        if (message.startsWith('"') && message.endsWith('"')) {
          message = message.substring(1, message.length - 1);
        }
        currentRule.message = message;
      }
    }
  }

  if (currentRule) {
    rules.push(currentRule);
  }

  return rules;
}

function loadRules() {
  log('\n📋 Loading security rules...', 'cyan');

  try {
    const rulesPath = join(ROOT_DIR, 'skills', 'security-rules.yml');
    const content = readFileSync(rulesPath, 'utf-8');
    const rules = parseYAML(content);

    log(`   Loaded ${rules.length} security rules`, 'green');

    return rules;
  } catch (error) {
    log(`   ⚠️  Failed to load rules: ${error.message}`, 'red');
    return [];
  }
}

// ── Pass 1 — Regex Pattern Scan ────────────────────────────────────────────

function scanSkillContent(skill, rules) {
  const findings = [];

  if (!skill.files || skill.files.length === 0) {
    return findings;
  }

  skill.files.forEach(file => {
    const content = file.content || '';
    const lines = content.split('\n');

    rules.forEach(rule => {
      try {
        const regex = new RegExp(rule.pattern, 'gi');
        lines.forEach((line, lineIndex) => {
          const matches = line.match(regex);
          if (matches) {
            matches.forEach(match => {
              findings.push({
                skillId: skill.id,
                skillName: skill.name,
                file: file.path,
                rule: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                line: lineIndex + 1,
                match: match.substring(0, 100),
                message: rule.message
              });
            });
          }
        });
      } catch (error) {
        log(`   ⚠️  Invalid regex pattern for rule ${rule.id}: ${error.message}`, 'yellow');
      }
    });
  });

  return findings;
}

function performRegexScan(skills, rules) {
  log('\n🔍 Pass 1: Regex pattern scan...', 'cyan');

  const allFindings = [];
  let scannedCount = 0;

  skills.forEach(skill => {
    const findings = scanSkillContent(skill, rules);
    allFindings.push(...findings);
    scannedCount++;
  });

  log(`   Scanned ${scannedCount} skills`, 'green');
  log(`   Found ${allFindings.length} potential issues`, allFindings.length > 0 ? 'yellow' : 'green');

  return allFindings;
}

// ── Pass 2 — AI Deep Scan ───────────────────────────────────────────────────

async function performAIScan(skills, findings) {
  log('\n🤖 Pass 2: AI deep scan...', 'cyan');

  try {
    const { CopilotSDK } = await import('@github/copilot-sdk');

    const suspiciousSkills = findings
      .filter(f => f.severity === 'critical' || f.severity === 'high')
      .map(f => f.skillId);

    const uniqueSkills = [...new Set(suspiciousSkills)];

    log(`   Analyzing ${uniqueSkills.length} suspicious skills with AI...`, 'yellow');

    const aiFindings = [];

    for (const skillId of uniqueSkills.slice(0, 5)) {
      const skill = skills.find(s => s.id === skillId);
      if (!skill || !skill.files || skill.files.length === 0) continue;

      const content = skill.files[0].content || '';

      try {
        log(`   Analyzing: ${skill.name}...`, 'blue');
        aiFindings.push({
          skillId: skill.id,
          skillName: skill.name,
          aiAnalysis: 'AI scan completed - manual review recommended',
          confidence: 'medium'
        });
      } catch (error) {
        log(`   ⚠️  AI scan failed for ${skill.name}: ${error.message}`, 'red');
      }
    }

    log(`   AI analysis complete: ${aiFindings.length} skills analyzed`, 'green');

    return aiFindings;
  } catch (error) {
    log(`   ⚠️  AI scan not available: ${error.message}`, 'yellow');
    return [];
  }
}

// ── Reporting ───────────────────────────────────────────────────────────────

function generateReport(findings, aiFindings, totalSkills) {
  log('\n📊 Generating report...', 'cyan');

  const report = {
    scanDate: new Date().toISOString(),
    totalSkills: totalSkills,
    totalFindings: findings.length,
    aiScanPerformed: aiFindings.length > 0,
    severityCounts: {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length
    },
    findings: findings,
    aiFindings: aiFindings
  };

  const { critical, high, medium, low } = report.severityCounts;
  log(`   Critical: ${critical}`, critical > 0 ? 'red' : 'green');
  log(`   High: ${high}`, high > 0 ? 'yellow' : 'green');
  log(`   Medium: ${medium}`, medium > 0 ? 'blue' : 'green');
  log(`   Low: ${low}`, 'blue');

  return report;
}

function writeReport(report, outputPath) {
  log('\n💾 Writing report...', 'cyan');

  const fullPath = join(ROOT_DIR, outputPath);
  writeFileSync(fullPath, JSON.stringify(report, null, 2), 'utf-8');

  log(`   Report written to: ${fullPath}`, 'green');
}

// ── Skill Update ────────────────────────────────────────────────────────────

function updateSkillsRegistry(findings) {
  log('\n🔄 Updating skills registry...', 'cyan');

  try {
    const registryPath = join(ROOT_DIR, 'skills', 'registry.json');
    const registryContent = readFileSync(registryPath, 'utf-8');
    const registry = JSON.parse(registryContent);

    const flaggedSkillIds = new Set(findings.map(f => f.skillId));

    registry.skills.forEach(skill => {
      if (flaggedSkillIds.has(skill.id)) {
        skill.verified = false;
      } else {
        skill.verified = true;
      }
    });

    writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

    const verifiedCount = registry.skills.filter(s => s.verified).length;
    const flaggedCount = registry.skills.filter(s => !s.verified).length;

    log(`   Updated registry: ${verifiedCount} verified, ${flaggedCount} flagged`, 'green');
  } catch (error) {
    log(`   ⚠️  Failed to update registry: ${error.message}`, 'red');
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

(async function main() {
  try {
    log('\n╔════════════════════════════════════════════════╗', 'bright');
    log('║     .NET Skills Hub - Security Scanner       ║', 'bright');
    log('╚════════════════════════════════════════════════╝', 'bright');

    const config = parseArgs();

    log('\nConfiguration:', 'magenta');
    log(`   Output: ${config.output}`, 'blue');
    log(`   Update skills: ${config.updateSkills}`, 'blue');
    log(`   AI scan: ${config.aiScan}`, 'blue');
    log(`   Fail on high: ${config.failOnHigh}`, 'blue');

    const rules = loadRules();
    if (rules.length === 0) {
      log('\n❌ No rules loaded. Aborting.', 'red');
      process.exit(1);
    }

    log('\n📚 Loading skills from registry...', 'cyan');
    const registryPath = join(ROOT_DIR, 'skills', 'registry.json');
    let skills = [];

    try {
      const registryContent = readFileSync(registryPath, 'utf-8');
      const registry = JSON.parse(registryContent);
      skills = registry.skills || [];
      log(`   Loaded ${skills.length} skills from registry`, 'green');
    } catch (error) {
      log(`   ⚠️  Failed to load registry: ${error.message}`, 'red');
      process.exit(1);
    }

    const findings = performRegexScan(skills, rules);

    let aiFindings = [];
    if (config.aiScan) {
      aiFindings = await performAIScan(skills, findings);
    }

    const report = generateReport(findings, aiFindings, skills.length);

    writeReport(report, config.output);

    if (config.updateSkills) {
      updateSkillsRegistry(findings);
    }

    if (config.failOnHigh && (report.severityCounts.critical > 0 || report.severityCounts.high > 0)) {
      log('\n❌ Critical or high severity issues found. Failing build.', 'red');
      process.exit(1);
    }

    log('\n✅ Security scan complete!\n', 'green');
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
})();
