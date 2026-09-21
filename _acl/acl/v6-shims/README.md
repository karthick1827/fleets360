# v6 Deprecation Shims

Skills in this folder are deprecated skills kept for backward compatibility with v6 skill IDs.
Some retain their full workflow, while others forward to the skill that replaced them, passing a
stated intent and pre-resolved customization fields so the target skips its own intent inference.

| Shim                       | Forwards to                          |
| -------------------------- | ------------------------------------ |
| `acl-create-story`        | Retained in full                     |
| `acl-dev-story`           | Retained in full                     |
| `acl-create-prd`          | `acl-prd` (create intent)           |
| `acl-edit-prd`            | `acl-prd` (update intent)           |
| `acl-validate-prd`        | `acl-prd` (validate intent)         |
| `acl-create-architecture` | `acl-architecture` (create intent)  |
| `acl-market-research`     | `acl-deep-recon` (market type)      |
| `acl-domain-research`     | `acl-deep-recon` (domain type)      |
| `acl-technical-research`  | `acl-deep-recon` (technical type)   |

Enterprise users may still depend on these IDs, so they ship by default. Removal rides the
v7 cut — never a 6.x minor.

The folder is grouping only: the installer discovers skills recursively and installs each
one under its own `name`, so nesting here does not change any installed path or skill ID.
A future install option will let users include or exclude this folder before it is removed
outright.
