# Rolling back knitelyfe.com to WordPress

On 2026-10-06 the apex was switched from the WordPress site at Northwest
Registered Agent to the Cloudflare Worker serving this repo.

To put WordPress back:

1. Cloudflare → knitelyfe.com → DNS → Records
2. Delete the record pointing the apex at the Worker
3. Add:  type A   name @ (knitelyfe.com)   content 66.223.49.89   proxied
4. Remove "knitelyfe.com" from the routes block in wrangler.jsonc, redeploy

The WordPress install itself was never touched. It still lives at
66.223.49.89 (Northwest Registered Agent).

Note: WordPress currently has its Site Address set to
https://old.knitelyfe.com, which does not exist. Before it will serve
correctly again, either create that subdomain at Northwest, or add to
wp-config.php above the "stop editing" line:

    define('WP_HOME','https://knitelyfe.com');
    define('WP_SITEURL','https://knitelyfe.com');
