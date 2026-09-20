# Desktop Architecture and Operating Boundary

Pizjo Admin is packaged with Electron as a Windows desktop application. Its renderer has no Node access, its preload surface exposes only named application actions, remote navigation is denied, and the interface’s content-security policy allows resources only from the bundled application files.

| Component | Local implementation |
|---|---|
| Database | SQLite file within the Windows user’s Pizjo application-data directory |
| Authentication | First-run owner setup; local salted password hashes; administrator and staff roles |
| Sessions | Short-lived in-memory token, cleared on sign-out or app restart |
| Operations | Menu, inventory, orders, invoices, sales, offers, staff, social planning, activity history |
| Backup | Operator-selected `.db` backup file with a pre-restore safety copy |
| Network | No application fetches, API calls, public-site writes, or cloud synchronization |

The existing public Pizjo storefront and its hosted admin remain independent. This desktop edition does not publish inventory, change customer-facing offers, send WhatsApp messages, connect social accounts, process payments, or transfer data to any cloud service.

The source folder intentionally ignores `node_modules/`, generated installers, and live database files. Those files must remain on the local Windows machine rather than entering the Git repository.
