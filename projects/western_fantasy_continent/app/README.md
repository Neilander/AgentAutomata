# Western Fantasy Local App

Use `launcher/start_local.bat` or `launcher/start_local.ps1` on Windows, or `launcher/start_local.command` on macOS, to start the local server and open the workbench.

The launcher opens the server at `http://localhost:3778`.

Current endpoints:

- `GET /api/health`
- `GET /api/art-lab/status`
- `GET /api/art-lab/records`
- `POST /api/art-lab/import`
- `POST /api/art-lab/generate`
- `DELETE /api/art-lab/records/:id`
- `GET /api/traces`
- `GET /api/traces/:name`
- `POST /api/traces/:name`
- `GET /trace_tool`
