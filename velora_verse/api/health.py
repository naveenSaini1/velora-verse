# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Health check endpoint for monitoring."""

import frappe


@frappe.whitelist(allow_guest=True)
def check():
	"""
	Health check endpoint. Returns DB/Redis connectivity and version info.
	URL: /api/method/velora_verse.api.health.check
	"""
	health = {
		"status": "healthy",
		"checks": {},
	}

	# DB check
	try:
		frappe.db.sql("SELECT 1")
		health["checks"]["database"] = "ok"
	except Exception:
		health["checks"]["database"] = "error"
		health["status"] = "unhealthy"

	# Redis check
	try:
		frappe.cache().set_value("velora_verse:health_ping", 1, expires_in_sec=10)
		val = frappe.cache().get_value("velora_verse:health_ping")
		health["checks"]["redis"] = "ok" if val else "error"
	except Exception:
		health["checks"]["redis"] = "error"
		health["status"] = "unhealthy"

	# Version info
	health["version"] = {
		"app": frappe.get_attr("velora_verse.__version__") if hasattr(frappe.get_module("velora_verse"), "__version__") else "unknown",
		"frappe": frappe.__version__,
	}

	health["site"] = frappe.local.site

	return health
