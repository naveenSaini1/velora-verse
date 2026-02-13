# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Webhook / Event System for dispatching events to external URLs."""

import frappe
import json
import hashlib
import hmac
from frappe.utils import now_datetime


def dispatch_webhook_event(event_type, payload):
	"""
	Dispatch a webhook event to all active subscriptions for this event type.
	Runs asynchronously via enqueue.

	Args:
		event_type: e.g. "order.created", "payment.completed"
		payload: dict of event data
	"""
	subscriptions = frappe.get_all(
		"Webhook Subscription",
		filters={"event_type": event_type, "is_active": 1},
		fields=["name", "target_url", "secret_key", "content_type", "retry_count"],
	)

	for sub in subscriptions:
		frappe.enqueue(
			_deliver_webhook,
			subscription_name=sub.name,
			target_url=sub.target_url,
			secret_key=sub.secret_key,
			content_type=sub.content_type or "application/json",
			retry_count=sub.retry_count or 3,
			event_type=event_type,
			payload=payload,
			queue="short",
		)


def _deliver_webhook(subscription_name, target_url, secret_key, content_type,
	retry_count, event_type, payload):
	"""Deliver a webhook with retry logic."""
	import requests

	body = json.dumps({
		"event": event_type,
		"timestamp": str(now_datetime()),
		"data": payload,
	})

	headers = {"Content-Type": content_type}

	# Add HMAC signature if secret is configured
	if secret_key:
		signature = hmac.new(
			secret_key.encode("utf-8"),
			body.encode("utf-8"),
			hashlib.sha256,
		).hexdigest()
		headers["X-Webhook-Signature"] = signature

	last_status = None
	last_body = None
	success = False

	for attempt in range(retry_count):
		try:
			response = requests.post(
				target_url,
				data=body,
				headers=headers,
				timeout=10,
			)
			last_status = response.status_code
			last_body = response.text[:500] if response.text else ""
			success = 200 <= response.status_code < 300

			# Log this attempt
			_log_attempt(subscription_name, last_status, last_body,
				"Success" if success else "Failed")

			if success:
				break

		except Exception as e:
			last_status = 0
			last_body = str(e)[:500]
			_log_attempt(subscription_name, 0, last_body, "Failed")

	return success


def _log_attempt(subscription_name, status, body, delivery_status):
	"""Log a webhook delivery attempt."""
	try:
		sub = frappe.get_doc("Webhook Subscription", subscription_name)
		sub.append("webhook_logs", {
			"attempt_datetime": now_datetime(),
			"response_status": status,
			"response_body": body,
			"delivery_status": delivery_status,
		})
		sub.save(ignore_permissions=True)
		frappe.db.commit()
	except Exception:
		frappe.log_error(f"Webhook log failed for {subscription_name}", "Webhook")


@frappe.whitelist()
def test_webhook(subscription_name):
	"""Test a webhook subscription by sending a test payload. Admin-only."""
	if "System Manager" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Insufficient permissions.", frappe.PermissionError)

	if not frappe.db.exists("Webhook Subscription", subscription_name):
		frappe.throw("Webhook subscription not found.")

	sub = frappe.get_doc("Webhook Subscription", subscription_name)

	test_payload = {
		"test": True,
		"message": "This is a test webhook from Velora Verse",
		"subscription": subscription_name,
		"event_type": sub.event_type,
	}

	success = _deliver_webhook(
		subscription_name=sub.name,
		target_url=sub.target_url,
		secret_key=sub.secret_key,
		content_type=sub.content_type or "application/json",
		retry_count=1,
		event_type="test",
		payload=test_payload,
	)

	return {"message": "Test webhook sent", "success": success}


@frappe.whitelist()
def get_webhook_logs(subscription_name, limit=20):
	"""Get recent webhook delivery logs. Admin-only."""
	if "System Manager" not in frappe.get_roles() and frappe.session.user != "Administrator":
		frappe.throw("Insufficient permissions.", frappe.PermissionError)

	if not frappe.db.exists("Webhook Subscription", subscription_name):
		frappe.throw("Webhook subscription not found.")

	limit = min(100, max(1, int(limit)))

	logs = frappe.db.sql("""
		SELECT attempt_datetime, response_status, response_body, delivery_status
		FROM `tabWebhook Log Entry`
		WHERE parent = %s
		ORDER BY attempt_datetime DESC
		LIMIT %s
	""", (subscription_name, limit), as_dict=True)

	return {"logs": logs}
