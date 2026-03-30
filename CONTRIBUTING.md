# Contributing to .NET Skills Hub

Thank you for your interest in contributing to the .NET Skills Hub! This guide will help you add new skills, improve existing ones, and ensure quality contributions.

## Table of Contents

- [What is a Skill?](#what-is-a-skill)
- [Before You Start](#before-you-start)
- [Adding a New Skill](#adding-a-new-skill)
- [Skill Entry Format](#skill-entry-format)
- [Categories](#categories)
- [Validation](#validation)
- [Review Process](#review-process)
- [Questions?](#questions)

## What is a Skill?

A **skill** is a specialized prompt or template that guides GitHub Copilot to perform specific .NET development tasks. Skills are defined in `SKILL.md` files and help Copilot understand context, patterns, and best practices for C# .NET development.

### Examples of .NET Skills

- Generate EF Core migrations from model changes
- Create ASP.NET Core Minimal API endpoints with validation
- Write xUnit test cases with proper assertions
- Configure dependency injection container with service lifetimes
- Perform NuGet security audit and dependency analysis
- Set up SignalR hub with authentication
- Implement CQRS pattern with MediatR
- Create .NET MAUI MVVM view models
- Optimize LINQ queries for performance
- Configure MSBuild for multi-targeting

Skills should be focused, actionable, and directly applicable to real .NET development scenarios.

## Before You Start

### Requirements

Before submitting a skill, ensure it meets these criteria:

✅ **Public Repository** — The skill must be hosted in a publicly accessible GitHub repository

✅ **SKILL.md File** — The repository must contain a properly formatted `SKILL.md` file with frontmatter

✅ **.NET Focus** — The skill must be specifically for C# .NET development (not general programming)

✅ **Original or Properly Attributed** — Ensure you have rights to submit the skill or properly attribute the original author

### Quality Guidelines

Good skills should:

- **Be Specific** — Focus on a concrete .NET task or pattern
- **Be Actionable** — Provide clear guidance Copilot can follow
- **Include Examples** — Show code samples in C#
- **Use .NET Terminology** — Reference .NET-specific APIs, frameworks, and patterns
- **Be Well-Documented** — Include usage instructions and prerequisites
- **Follow Best Practices** — Align with official .NET guidelines

## Adding a New Skill

Follow these steps to add a new skill to the catalog:

### Step 1: Prepare Your Skill

Create a `SKILL.md` file in your GitHub repository with this structure:

```markdown
---
name: Your Skill Name
description: Detailed description (100-300 characters)
category: dotnet-core
author: your-github-username
triggers:
  - trigger keyword 1
  - trigger keyword 2
  - trigger keyword 3
complexity: intermediate
---

# Your Skill Name

[Your skill content here with examples, usage, and guidance]
```

### Step 2: Fork This Repository

Fork the `dotnet-skills-hub/dotnet-skills-hub` repository to your GitHub account.

### Step 3: Add Your Skill to the Registry

Edit `skills/registry.json` and add your skill entry:

```json
{
  "id": "your-skill-id",
  "name": "Your Skill Name",
  "description": "Detailed description between 100-300 characters explaining what this skill helps developers accomplish and which .NET technologies it covers.",
  "shortDescription": "Brief 50-80 character summary of the skill",
  "category": "dotnet-core",
  "author": "your-github-username",
  "triggers": ["keyword1", "keyword2", "keyword3"],
  "complexity": "intermediate",
  "featured": false,
  "source": {
    "repo": "https://github.com/your-username/your-repo",
    "path": "path/to/SKILL.md",
    "branch": "main"
  }
}
```

### Step 4: Submit a Pull Request

1. Commit your changes with a descriptive message
2. Push to your fork
3. Open a pull request against the `main` branch
4. Fill out the pull request template
5. Wait for review

## Skill Entry Format

Each skill entry in `skills/registry.json` follows this structure:

```json
{
  "id": "unique-skill-identifier",
  "name": "Human Readable Skill Name",
  "description": "Comprehensive description explaining what the skill does, which .NET features it covers, and how it helps developers. Must be between 100-300 characters.",
  "shortDescription": "Brief summary for list views (50-80 chars)",
  "category": "category-id",
  "author": "github-username",
  "triggers": ["keyword1", "keyword2", "keyword3"],
  "complexity": "beginner",
  "featured": false,
  "tags": ["tag1", "tag2", "tag3"],
  "source": {
    "repo": "https://github.com/username/repository",
    "path": "skills/skill-name/SKILL.md",
    "branch": "main"
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ Yes | Unique identifier (lowercase, hyphens only) |
| `name` | string | ✅ Yes | Display name for the skill |
| `description` | string | ✅ Yes | Detailed description (100-300 characters) |
| `shortDescription` | string | No | Brief summary (50-80 characters) |
| `category` | string | ✅ Yes | Category ID from the list below |
| `author` | string | ✅ Yes | GitHub username of the author |
| `triggers` | array | No | 3-5 keywords that activate the skill |
| `complexity` | string | No | Difficulty level: `beginner`, `intermediate`, or `advanced` |
| `featured` | boolean | No | Whether to feature on homepage (maintainers set this) |
| `tags` | array | No | Additional categorization tags |
| `source.repo` | string | ✅ Yes | GitHub repository URL |
| `source.path` | string | ✅ Yes | Path to SKILL.md in the repository |
| `source.branch` | string | No | Git branch (default: `main`) |

### Complexity Levels

- **Beginner** — Basic .NET concepts, simple patterns, introductory tasks
- **Intermediate** — Standard .NET development, common frameworks, typical scenarios
- **Advanced** — Complex patterns, performance optimization, advanced architecture

## Categories

All skills must be assigned to one of these 12 categories:

| Category ID | Name | Description |
|-------------|------|-------------|
| `dotnet-core` | .NET Core & Fundamentals | C# syntax, LINQ, async/await, dependency injection |
| `aspnet-web` | ASP.NET & Web APIs | REST APIs, Minimal APIs, Blazor, SignalR |
| `ef-data` | Entity Framework & Data | EF Core, migrations, LINQ to SQL, Dapper |
| `testing` | Testing & Quality | xUnit, NUnit, MSTest, Moq, FluentAssertions |
| `msbuild-build` | MSBuild & Build System | Project files, build optimization, NuGet packages |
| `dotnet-nuget` | NuGet & Package Management | NuGet packages, dependency management, versioning |
| `dotnet-upgrade` | Migration & Upgrade | Framework migration, .NET 6→8→10, API compat |
| `dotnet-maui` | .NET MAUI & Mobile | Cross-platform UI, XAML, mobile development |
| `dotnet-ai` | AI & ML with .NET | ML.NET, Semantic Kernel, LLM integration, MCP |
| `dotnet-diag` | Diagnostics & Performance | Performance investigations, debugging, incident analysis |
| `dotnet-template` | Template Engine & Scaffolding | Template discovery, project scaffolding, template authoring |
| `security` | Security & Auth | Identity, OAuth, OWASP, secure coding |

## Validation

All pull requests undergo automated validation:

### Automated Checks

1. **JSON Schema Validation** — Ensures the registry follows the correct structure
2. **Duplicate ID Check** — Verifies no duplicate skill IDs exist
3. **Field Validation** — Checks required fields and character limits
4. **Source Accessibility** — Validates that the source repository is publicly accessible

### Local Validation

Before submitting, validate your changes locally:

```bash
# Install AJV CLI
npm install -g ajv-cli

# Validate against schema
ajv validate -s skills/schema.json -d skills/registry.json
```

If validation passes, you'll see:
```
skills/registry.json valid
```

## Review Process

After submitting your pull request:

1. **Automated Checks** — GitHub Actions will run validation workflows
2. **Manual Review** — Maintainers will review the skill for quality and relevance
3. **Feedback** — You may receive requests for changes or improvements
4. **Merge** — Once approved, your skill will be merged and deployed

### Timeline

- Initial automated checks: **< 5 minutes**
- Manual review: **1-3 business days**
- Follow-up revisions: **As needed**

## Questions?

If you have questions or need help:

- 💬 **Open a Discussion** — [GitHub Discussions](https://github.com/dotnet-skills-hub/dotnet-skills-hub/discussions)
- 🐛 **Report Issues** — [GitHub Issues](https://github.com/dotnet-skills-hub/dotnet-skills-hub/issues)
- 📧 **Contact Maintainers** — Open an issue with the `question` label

---

Thank you for contributing to the .NET Skills Hub! Together, we're building the definitive catalog of Copilot skills for the .NET community. 🔷💜
