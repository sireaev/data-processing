# Questions

**Question:** How can we design the system in a way that every Company will be able to serve games on their gaming site from their domain?

**Answer:** To serve games on their gaming site from their domain, companies should adopt multi-tenancy architecture. Every company should have its own domain. The requirements are:

1. Wildcard domain: *(like \*.gPlatform.com)*, to setup DNS for each company's domain.
2. Routing domain: The Node.js instance will read Headers from the request and route them to the correct tenant's resource: gaming platform, casino, online game, user dashboard.
3. Company domain: Every company's game and user's dashboard would be isolated by company domain, this will ensure that the player don't share its data between other platforms and keeps data safe.
---
**Question:** What modification should be done to the users table at gPlatform to support this change?


**Answer:** To support this change, we'll add *company_id* and *platform_id* to the user's table, therefore we'll create a unique identifier key which is based on the user data for example email and a *platform_id*. This way we'll like each user to their gaming platform.

---

**Question:** Considering we have 1 backend cluster that serves all companies, how can we validate a user login on one gaming domain in such a way that it does not give access to a different gaming domain? (i.e. authenticating on site A, grants access to site A only)

**Answer:** JWT must include platform_id in the token payload, this way the user will login with their token from the specific domain they logged from. On every request the Node.js cluster should validate both the token and the domain: request headers and the platform_id inside the token.
