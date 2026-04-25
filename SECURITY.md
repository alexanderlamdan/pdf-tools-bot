# Security Policy

## Supported Projects

This security policy applies to all software projects maintained by
**Alexander Lamdan**, including:

- **lmdnbot.com** — Telegram Bot Marketplace (EN / RU / HE)
- **PDF Tools Bot** — Telegram PDF processing bot (EN / RU / HE)
- **konekt-ru-bot** — Telegram social platform

---

## Reporting a Vulnerability

I take security seriously. If you discover a vulnerability, please follow
responsible disclosure — **do not open a public issue**.

### How to Report

**Email:** alexanderlamdan2@zohomail.com
**Subject line:** `[SECURITY] Brief description of the issue`

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Your suggested fix (optional but appreciated)

PGP encryption is available upon request.

---

## Disclosure Timeline

| Milestone | Timeframe |
|---|---|
| Acknowledgment of your report | Within **48 hours** |
| Initial assessment & severity rating | Within **7 days** |
| Fix development | Depends on severity (see below) |
| Fix released | See below |
| Public disclosure (if any) | After fix is live |

### Severity-Based Response Times

| Severity | Example | Fix Target |
|---|---|---|
| **Critical** | RCE, auth bypass, data leak | 24–72 hours |
| **High** | Privilege escalation, injection | 7 days |
| **Medium** | CSRF, info disclosure | 30 days |
| **Low** | Minor info leaks, best-practice gaps | 90 days |

---

## Responsible Disclosure Rules

By reporting a vulnerability, you agree to:

✅ Report privately before any public disclosure  
✅ Give me reasonable time to fix the issue  
✅ Not exploit the vulnerability or access user data  
✅ Not share or retain copies of source code obtained during research  
✅ Act in good faith  

I agree to:

✅ Respond promptly and keep you informed  
✅ Not pursue legal action against good-faith researchers  
✅ Credit you publicly (if you wish) after the fix is released  
✅ Notify you when the vulnerability is patched  

---

## Scope

**In scope:**
- Authentication and authorization flaws
- Data exposure or privacy violations
- SQL injection, XSS, CSRF, SSRF
- Remote code execution
- Business logic vulnerabilities
- Telegram bot API abuse vectors
- File processing vulnerabilities (PDF, images)

**Out of scope:**
- Denial of service attacks
- Social engineering
- Physical security
- Vulnerabilities in third-party dependencies (report upstream)
- Issues already known and documented

---

## Privacy Commitment

All projects handle user data with minimal retention:
- No unnecessary personal data is stored
- File processing is done in isolated tmpfs — files are not persisted
- User data is never sold or shared with third parties

---

## Hall of Fame

Security researchers who responsibly disclosed vulnerabilities:

*(None yet — be the first)*

---

*This policy is subject to change. Last updated: 2026*
