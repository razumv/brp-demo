# Astryx real-browser and device certification

This record is intentionally tied to an exact candidate commit. Run `npm run test:e2e:appearance:real-devices` with BrowserStack Automate credentials. The runner builds `HEAD`, publishes a one-time provenance endpoint, opens a uniquely identified BrowserStack Local tunnel, and rejects a server whose SHA differs.

## Required evidence

| Target | Required version | Candidate SHA | Date | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| Chrome / Windows | current stable | Pending | Pending | Blocked until credentialed run | Pending session URL |
| Edge / Windows | current stable | Pending | Pending | Blocked until credentialed run | Pending session URL |
| Firefox / Windows | current stable | Pending | Pending | Blocked until credentialed run | Pending session URL |
| Safari / macOS | current stable | Pending | Pending | Blocked until credentialed run | Pending session URL |
| iOS Safari / iPhone | current profile | Pending | Pending | Blocked until credentialed run | Pending session URL |
| Android Chrome / Pixel | current profile | Pending | Pending | Blocked until credentialed run | Pending session URL |

The release is not certified while any row is pending, the BrowserStack build SHA differs from the candidate SHA, or evidence links are absent. Equivalent physical-device evidence may replace a target only when the exact OS/browser/device version, candidate SHA, date, screenshots/video, and operator are recorded here.
