# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe


def get_store_settings():
	"""Get Store Settings singleton, cached for the request lifecycle."""
	if not hasattr(frappe.local, "store_settings"):
		frappe.local.store_settings = frappe.get_single("Store Settings")
	return frappe.local.store_settings


@frappe.whitelist(allow_guest=True)
def get_csrf_token():
	"""Return the CSRF token for the current session.

	External frontends (e.g. Next.js on a different port) need this
	to send POST requests with the correct X-Frappe-CSRF-Token header.
	"""
	return frappe.sessions.get_csrf_token()
