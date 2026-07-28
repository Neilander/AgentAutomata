# Local Launchers

- `start_local.bat` / `start_local.ps1`: production workspace server on `http://localhost:3777/workbench/`.
- `start_test.bat` / `start_test.ps1`: test workspace server on `http://localhost:3778/workbench/`.

Use the production port for normal browsing. Agents should use the test port when they need to verify new routes or pages, so an old production process does not hide new code or block validation.

`start_local.bat` waits for `/api/health` and opens the workbench only after the server is ready. If startup fails, the command window stays open and shows the actual error. For a no-browser diagnostic run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start_local.ps1 -NoBrowser
```
