# Production Deployment Checklist

## Pre-Deployment

### 1. Disable Developer Mode
```bash
bench --site veloraverse.com set-config developer_mode 0
```

### 2. Set CORS (Frontend Domain)
In `sites/common_site_config.json`:
```json
{
  "allow_cors": "https://your-frontend-domain.com"
}
```

### 3. Create Database Indexes
```bash
bench --site veloraverse.com execute velora_verse.tools.create_indexes.run
```

### 4. Run Migrations
```bash
bench --site veloraverse.com migrate
```

### 5. Build Assets
```bash
bench build --app velora_verse --production
```

### 6. Setup Roles
```bash
bench --site veloraverse.com execute velora_verse.tools.setup_roles.setup
```

## Infrastructure

### HTTPS
- Ensure HTTPS is configured via nginx or a reverse proxy
- Redirect all HTTP traffic to HTTPS

### Redis
- Redis is required for caching and rate limiting
- Verify Redis is running: `redis-cli -p 13003 ping`

### Log Rotation
- Frappe logs are at `logs/` in the bench directory
- Configure logrotate for `web.log`, `worker.log`, `scheduler.log`

### Process Manager
- Use `bench setup supervisor` or `bench setup systemd` for process management
- Ensure workers, scheduler, and socketio are running

## Monitoring

### Health Endpoint
```
GET /api/method/velora_verse.api.health.check
```
Returns:
```json
{
  "status": "healthy",
  "checks": {"database": "ok", "redis": "ok"},
  "version": {"app": "...", "frappe": "..."},
  "site": "veloraverse.com"
}
```
Use this for uptime monitoring (e.g., UptimeRobot, Pingdom).

### Error Logs
All non-critical errors are logged via `frappe.log_error()`. Monitor via:
- Desk: `/app/error-log`
- CLI: `bench --site veloraverse.com execute frappe.client.get_count --args '{"doctype": "Error Log"}'`

## Rate Limits
The following endpoints are rate-limited (via Redis):

| Endpoint | Limit |
|----------|-------|
| `auth.register` | 5/hour |
| `auth.login` | 10/min |
| `auth.forgot_password` | 3/hour |
| `products.get_products` | 60/min |
| `products.search_products` | 30/min |
| `products.get_product_filters` | 30/min |
| `search.autocomplete` | 30/min |
| `analytics.track_event` | 60/min |
| `gift_cards.check_gift_card_balance` | 10/min |

## Caching
- Category tree: cached 1 hour, invalidated on Category create/update/delete
- Product filters: cached 15 minutes, invalidated on Items/Category changes

## Scheduled Tasks
Ensure the scheduler is running (`bench doctor`):
- Every 5 min: Activate/deactivate promotions
- Hourly: Cancel unpaid orders
- Daily: Low stock alerts, back-in-stock, abandoned carts, loyalty/gift card expiry, segment reassignment, notification/analytics cleanup
