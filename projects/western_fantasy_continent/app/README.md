# Western Fantasy Local App

Use `launcher/start_local.bat` or `launcher/start_local.ps1` to start the local server and open the trace tool.

The launcher opens the server at `http://localhost:3778`.

Current endpoints:

- `GET /api/health`
- `GET /api/traces`
- `GET /api/traces/:name`
- `POST /api/traces/:name`
- `GET /trace_tool`
