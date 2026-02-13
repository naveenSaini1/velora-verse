# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Customer authentication APIs for the storefront."""

import frappe
from frappe.rate_limiter import rate_limit
from frappe.utils import validate_email_address


@frappe.whitelist(allow_guest=True)
@rate_limit(limit=3, seconds=60)
def register(email, full_name, password, phone=None):
	"""Register a new customer account."""
	if not email or not full_name or not password:
		frappe.throw("Email, full name, and password are required.")

	email = email.strip().lower()
	if not validate_email_address(email):
		frappe.throw("Please enter a valid email address.")

	if frappe.db.exists("User", email):
		frappe.throw("An account with this email already exists.")

	if len(password) < 8:
		frappe.throw("Password must be at least 8 characters long.")

	# Split full_name into first/last
	name_parts = full_name.strip().split(" ", 1)
	first_name = name_parts[0]
	last_name = name_parts[1] if len(name_parts) > 1 else ""

	user = frappe.get_doc({
		"doctype": "User",
		"email": email,
		"first_name": first_name,
		"last_name": last_name,
		"user_type": "Website User",
		"send_welcome_email": 0,
		"new_password": password,
		"phone": phone,
	})
	user.insert(ignore_permissions=True)
	frappe.db.commit()

	# Send welcome email
	try:
		from velora_verse.services.notifications import send_welcome_email
		send_welcome_email(email, full_name)
	except Exception:
		frappe.log_error(title=f"Welcome Email Failed: {email}", message=frappe.get_traceback())

	# Award signup loyalty bonus
	try:
		from velora_verse.api.loyalty import award_signup_bonus
		award_signup_bonus(email)
	except Exception:
		frappe.log_error(title=f"Signup Bonus Failed: {email}", message=frappe.get_traceback())

	return {
		"message": "Account created successfully. Please log in.",
		"user": email,
	}


@frappe.whitelist(allow_guest=True)
@rate_limit(limit=5, seconds=60)
def login(email, password):
	"""Log in with email, username, or phone number."""
	if not email or not password:
		frappe.throw("Credentials are required.")

	identifier = email.strip()

	# Resolve identifier to user email
	user_email = _resolve_login_identifier(identifier)

	try:
		login_manager = frappe.auth.LoginManager()
		login_manager.authenticate(user_email, password)
		login_manager.post_login()
	except frappe.exceptions.AuthenticationError:
		frappe.clear_messages()
		frappe.throw("Invalid login credentials.", frappe.AuthenticationError)

	user_doc = frappe.get_doc("User", frappe.session.user)

	return {
		"message": "Login successful",
		"user": frappe.session.user,
		"full_name": user_doc.full_name,
		"sid": frappe.session.sid,
	}


def _resolve_login_identifier(identifier):
	"""Resolve an email, username, or phone number to a Frappe user email."""
	# 1. Direct match by email / user name (e.g. "Administrator")
	if frappe.db.exists("User", identifier):
		return identifier

	# 2. Case-insensitive email match
	lower = identifier.lower()
	if frappe.db.exists("User", lower):
		return lower

	# 3. Match by username field
	user_by_username = frappe.db.get_value("User", {"username": identifier}, "name")
	if user_by_username:
		return user_by_username

	# Case-insensitive username
	user_by_username_lower = frappe.db.get_value("User", {"username": lower}, "name")
	if user_by_username_lower:
		return user_by_username_lower

	# 4. Match by phone or mobile_no
	phone_clean = identifier.strip().replace(" ", "").replace("-", "")
	user_by_phone = frappe.db.get_value("User", {"phone": phone_clean}, "name")
	if user_by_phone:
		return user_by_phone

	user_by_mobile = frappe.db.get_value("User", {"mobile_no": phone_clean}, "name")
	if user_by_mobile:
		return user_by_mobile

	# Also try with/without country code prefix
	if phone_clean.startswith("+91"):
		stripped = phone_clean[3:]
		user_by_phone = frappe.db.get_value("User", {"phone": stripped}, "name") or \
			frappe.db.get_value("User", {"mobile_no": stripped}, "name")
		if user_by_phone:
			return user_by_phone
	elif phone_clean.startswith("91") and len(phone_clean) == 12:
		stripped = phone_clean[2:]
		user_by_phone = frappe.db.get_value("User", {"phone": stripped}, "name") or \
			frappe.db.get_value("User", {"mobile_no": stripped}, "name")
		if user_by_phone:
			return user_by_phone

	# 5. Nothing matched — return as-is, let Frappe handle the auth error
	return identifier


@frappe.whitelist(allow_guest=True)
@rate_limit(limit=3, seconds=60)
def forgot_password(email):
	"""Send a password reset link."""
	if not email:
		frappe.throw("Email is required.")

	email = email.strip().lower()

	if not frappe.db.exists("User", email):
		# Don't reveal whether user exists
		return {"message": "If an account with this email exists, a reset link has been sent."}

	try:
		frappe.sendmail(
			recipients=email,
			subject="Password Reset",
			template="reset_password",
			args={"link": frappe.utils.get_url(f"/update-password?key={frappe.generate_hash()}")},
			now=True,
		)
	except Exception:
		frappe.log_error(title=f"Password Reset Email Failed: {email}", message=frappe.get_traceback())

	return {"message": "If an account with this email exists, a reset link has been sent."}


@frappe.whitelist()
def update_profile(first_name=None, last_name=None, phone=None):
	"""Update the current user's profile."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to update your profile.")

	user_doc = frappe.get_doc("User", user)

	if first_name:
		user_doc.first_name = first_name
	if last_name is not None:
		user_doc.last_name = last_name
	if phone is not None:
		user_doc.phone = phone

	user_doc.save(ignore_permissions=True)

	return {
		"message": "Profile updated",
		"user": user,
		"full_name": user_doc.full_name,
	}


@frappe.whitelist()
@rate_limit(limit=5, seconds=60)
def change_password(old_password, new_password):
	"""Change the current user's password."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to change your password.")

	if not old_password or not new_password:
		frappe.throw("Both old and new passwords are required.")

	if len(new_password) < 8:
		frappe.throw("New password must be at least 8 characters long.")

	# Verify old password
	try:
		frappe.local.login_manager.authenticate(user, old_password)
	except frappe.exceptions.AuthenticationError:
		frappe.clear_messages()
		frappe.throw("Current password is incorrect.")

	from frappe.utils.password import update_password
	update_password(user, new_password)

	return {"message": "Password changed successfully"}


@frappe.whitelist()
def logout():
	"""Log out the current user."""
	user = frappe.session.user
	if user == "Guest":
		return {"message": "Not logged in"}

	frappe.local.login_manager.logout()
	return {"message": "Logged out successfully"}
