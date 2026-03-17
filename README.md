# agent-control-cli

CLI to manage agent repositories and install/uninstall agents for Kiro.

## Quick Start

```bash
npm install -g @agent-control/cli
agent-control
```

You can also use the short command alias:

```bash
agentctl
```

Running the command without arguments opens interactive mode.

## Installation

### From npm (recommended)

```bash
npm install -g @agent-control/cli
```

### From source (local checkout)

```bash
npm install
npm run build
npm install -g .
```

## Core Concepts

- A **repository** is a Git URL or local path that contains agents.
- An **agent id** identifies one concrete agent inside a repository.
- Installed agents are linked into Kiro's agent directory.

## Common Workflows

### 1) Add a repository and install an agent

```bash
agent-control add-repo <url-or-local-path> <repo-name>
agent-control list-available <repo-name>
agent-control install <repo-name> <agent-id>
```

### 2) Check what is installed

```bash
agent-control list
agent-control info <repo-name> <agent-id>
```

### 3) Update and repair setup

```bash
agent-control update
agent-control doctor
agent-control cleanup
```

## Command Reference

```bash
# Interactive mode
agent-control
agent-control interactive

# Repository management
agent-control add-repo <url-or-local-path> <name>
agent-control remove-repo <name>
agent-control list-repos

# Agent management
agent-control list
agent-control list-available <repo>
agent-control info <repo> <agent-id>
agent-control install <repo> <agent-id>
agent-control uninstall <repo> <agent-id>

# Maintenance
agent-control update
agent-control cleanup
agent-control doctor
```

## Where Data Is Stored

- Config: `~/.agent-control/config.json`
- Cloned repositories: `~/.agent-control/repos/`
- Installed agent files: `~/.agent-control/agents/`
- Kiro symlinks: `~/.kiro/agents/`

## Troubleshooting

- Run `agent-control doctor` to detect and auto-fix common setup issues.
- Run `agent-control cleanup` if symlinks look broken.
- Verify repositories with `agent-control list-repos`.

## Notes

- Command names: `agent-control` and `agentctl` are equivalent.
- If you prefer menus over flags/arguments, use interactive mode.
