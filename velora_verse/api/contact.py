# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Contact form API."""

import frappe
from frappe.rate_limiter import rate_limit
from frappe.utils import validate_email_address


@frappe.whitelist(allow_guest=True, methods=["POST"])
@rate_limit(limit=3, seconds=60)
def submit_contact(name, email, subject, message):
	"""Handle contact form submission — sends email to site admin."""
	if not all([name, email, subject, message]):
		frappe.throw("All fields are required.")

	name = name.strip()
	email = email.strip().lower()
	subject = subject.strip()
	message = message.strip()

	if not validate_email_address(email):
		frappe.throw("Please enter a valid email address.")

	if len(message) < 10:
		frappe.throw("Message must be at least 10 characters.")

	# Send email to the admin
	admin_email = frappe.db.get_single_value("Store Settings", "support_email") or frappe.db.get_value(
		"User", "Administrator", "email"
	)

	if admin_email:
		frappe.sendmail(
			recipients=[admin_email],
			subject=f"[Contact Form] {subject}",
			message=f"""
			<p><strong>From:</strong> {frappe.utils.escape_html(name)} ({frappe.utils.escape_html(email)})</p>
			<p><strong>Subject:</strong> {frappe.utils.escape_html(subject)}</p>
			<hr/>
			<p>{frappe.utils.escape_html(message).replace(chr(10), '<br/>')}</p>
			""",
			reply_to=email,
		)

	return {"message": "Thank you for reaching out! We'll get back to you soon."}
