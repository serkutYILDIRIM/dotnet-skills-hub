# Pull Request

## Description

<!-- Provide a brief description of your changes -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] New skill addition
- [ ] Skill update/modification
- [ ] Bug fix
- [ ] Documentation update
- [ ] Infrastructure/tooling improvement
- [ ] Other (please describe):

## Checklist

<!-- Ensure all items are completed before submitting -->

### General Requirements

- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines
- [ ] My changes follow the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] My changes generate no new warnings or errors

### For New Skills or Skill Updates

- [ ] The skill is focused on C# .NET development
- [ ] Schema validation passes (`ajv validate -s skills/schema.json -d skills/registry.json`)
- [ ] No duplicate skill IDs exist in the registry
- [ ] Skill source is publicly accessible on GitHub
- [ ] Description is between 100-300 characters
- [ ] Short description is between 50-80 characters (if provided)
- [ ] 3-5 trigger keywords are defined
- [ ] Appropriate complexity level is set (beginner/intermediate/advanced)
- [ ] Category is one of the 12 defined categories
- [ ] Source repository and path are correct and accessible
- [ ] I have tested the skill locally

### Testing

- [ ] I have tested my changes locally
- [ ] All existing tests pass
- [ ] I have added tests for new functionality (if applicable)

## Related Issues

<!-- Link any related issues using #issue_number -->

Closes #
Related to #

## Screenshots (if applicable)

<!-- Add screenshots to help reviewers understand your changes -->

## Additional Notes

<!-- Add any additional information that reviewers should know -->

---

**For Maintainers:**

- [ ] Code review completed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Ready to merge
