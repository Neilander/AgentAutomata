# Local Launchers

- `start_local.bat` / `start_local.ps1`: production workspace server on `http://localhost:3777/workbench/`.
- `start_test.bat` / `start_test.ps1`: test workspace server on `http://localhost:3778/workbench/`.

Use the production port for normal browsing. Agents should use the test port when they need to verify new routes or pages, so an old production process does not hide new code or block validation.
