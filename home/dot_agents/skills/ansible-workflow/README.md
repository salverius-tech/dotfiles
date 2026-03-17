# Ansible Workflow Skill

Guidelines for Ansible automation covering playbook standards, secrets management, project structure, dynamic inventories, and performance optimization.

## Files

| File           | Purpose                                              |
| -------------- | ---------------------------------------------------- |
| `knowledge.md` | Portable ansible workflow guidelines (loaded by agents) |
| `assets/ansible.cfg.template` | Ansible configuration template |
| `assets/dot_ansible-lint.template` | Ansible-lint configuration template |
| `assets/dot_yamllint.template` | YAML lint configuration template |

## Topics Covered

- Tool grid and runtime requirements (Ansible Core 2.18+, ansible-lint, yamllint, Molecule)
- Code standards: FQCN requirement, linting, and sensitive data handling with `no_log`
- Secrets management with SOPS (recommended) and ansible-vault (legacy)
- Project structure: environment-based inventories, group_vars organization, single-purpose roles
- Dynamic inventories for AWS EC2, Azure RM, and GCP Compute
- Handler patterns and variable precedence
- Molecule testing setup and execution
- Performance optimization (forks, pipelining, fact caching, async tasks)
