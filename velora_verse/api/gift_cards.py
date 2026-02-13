# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""Gift Card system APIs and helpers."""

import frappe
import uuid
from frappe.utils import now_datetime, add_months, getdate, today


@frappe.whitelist()
def purchase_gift_card(amount, recipient_email=None, recipient_name=None, sender_message=None):
	"""Purchase a new gift card."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to purchase a gift card.")

	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_gift_cards", 0):
		frappe.throw("Gift cards are not available.")

	amount = float(amount)
	if amount <= 0:
		frappe.throw("Gift card amount must be greater than 0.")

	# Validate against denominations if configured
	denominations = getattr(settings, "gift_card_denominations", "")
	if denominations:
		valid_amounts = [float(d.strip()) for d in denominations.split(",") if d.strip()]
		if valid_amounts and amount not in valid_amounts:
			frappe.throw(f"Please choose from available denominations: {denominations}")

	expiry_months = getattr(settings, "gift_card_expiry_months", 12) or 12
	card_code = str(uuid.uuid4())[:16].upper().replace("-", "")

	doc = frappe.new_doc("Gift Card")
	doc.card_code = card_code
	doc.original_amount = amount
	doc.current_balance = amount
	doc.status = "Active"
	doc.purchased_by = user
	doc.recipient_email = recipient_email
	doc.recipient_name = recipient_name
	doc.sender_message = sender_message
	doc.expiry_date = add_months(today(), expiry_months)

	# Add purchase transaction
	doc.append("gift_card_transactions", {
		"transaction_date": now_datetime(),
		"transaction_type": "Purchase",
		"amount": amount,
		"balance_after": amount,
		"redeemed_by": user,
	})

	doc.insert(ignore_permissions=True)

	# Send email to recipient if provided
	if recipient_email:
		try:
			_send_gift_card_email(doc)
		except Exception:
			frappe.log_error(title=f"Gift Card Email Failed: {card_code}", message=frappe.get_traceback())

	return {
		"message": "Gift card purchased",
		"card_code": card_code,
		"amount": amount,
		"expiry_date": str(doc.expiry_date),
	}


@frappe.whitelist(allow_guest=True)
def check_gift_card_balance(card_code):
	"""Check the balance of a gift card."""
	if not card_code:
		frappe.throw("Card code is required.")

	card = frappe.db.get_value(
		"Gift Card", card_code,
		["card_code", "current_balance", "status", "expiry_date", "original_amount"],
		as_dict=True,
	)

	if not card:
		frappe.throw("Invalid gift card code.")

	return {
		"card_code": card.card_code,
		"original_amount": card.original_amount,
		"current_balance": card.current_balance,
		"status": card.status,
		"expiry_date": card.expiry_date,
		"is_valid": card.status == "Active" and card.current_balance > 0,
	}


@frappe.whitelist()
def get_my_gift_cards():
	"""Get gift cards purchased by or sent to the current user."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in.")

	cards = frappe.get_all(
		"Gift Card",
		filters=[
			["Gift Card", "purchased_by", "=", user],
		],
		fields=[
			"name", "card_code", "original_amount", "current_balance",
			"status", "recipient_email", "recipient_name", "sender_message",
			"expiry_date", "creation",
		],
		order_by="creation desc",
	)

	# Also get cards where user is the recipient
	received = frappe.get_all(
		"Gift Card",
		filters={"recipient_email": user, "purchased_by": ["!=", user]},
		fields=[
			"name", "card_code", "original_amount", "current_balance",
			"status", "purchased_by", "sender_message", "expiry_date", "creation",
		],
		order_by="creation desc",
	)

	def _map_card(c):
		return {
			"name": c.name,
			"card_code": c.card_code,
			"initial_amount": c.original_amount or 0,
			"balance": c.current_balance or 0,
			"status": c.status,
			"recipient_email": c.get("recipient_email"),
			"recipient_name": c.get("recipient_name"),
			"message": c.get("sender_message"),
			"purchased_on": str(c.creation) if c.creation else None,
			"expires_on": str(c.expiry_date) if c.get("expiry_date") else None,
		}

	return {
		"purchased": [_map_card(c) for c in cards],
		"received": [_map_card(c) for c in received],
	}


@frappe.whitelist()
def preview_gift_card_redemption(card_code, amount=None):
	"""Preview a gift card redemption."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in.")

	card = frappe.db.get_value(
		"Gift Card", card_code,
		["current_balance", "status", "expiry_date"],
		as_dict=True,
	)

	if not card:
		return {"valid": False, "message": "Invalid gift card code."}

	if card.status != "Active":
		return {"valid": False, "message": f"Gift card is {card.status}."}

	if card.expiry_date and getdate(card.expiry_date) < getdate(today()):
		return {"valid": False, "message": "Gift card has expired."}

	available = card.current_balance
	if amount:
		redeem_amount = min(float(amount), available)
	else:
		redeem_amount = available

	return {
		"valid": True,
		"available_balance": available,
		"redeem_amount": redeem_amount,
		"remaining_balance": available - redeem_amount,
	}


# --- Internal helpers ---

def redeem_gift_card(card_code, amount, order_name, user):
	"""Redeem a gift card for an order. Returns actual amount redeemed.
	Uses SELECT ... FOR UPDATE to prevent concurrent redemptions."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	if not getattr(settings, "enable_gift_cards", 0):
		return 0

	if not card_code:
		return 0

	# Lock the gift card row to prevent concurrent redemptions
	locked = frappe.db.sql("""
		SELECT current_balance, status, expiry_date
		FROM `tabGift Card`
		WHERE name = %s
		FOR UPDATE
	""", card_code, as_dict=True)

	if not locked:
		frappe.throw("Invalid gift card code.")

	card_data = locked[0]

	if card_data.status != "Active":
		frappe.throw(f"Gift card is {card_data.status}.")

	if card_data.expiry_date and getdate(card_data.expiry_date) < getdate(today()):
		frappe.throw("Gift card has expired.")

	redeem_amount = min(float(amount), card_data.current_balance)
	if redeem_amount <= 0:
		return 0

	new_balance = card_data.current_balance - redeem_amount
	new_status = "Fully Redeemed" if new_balance <= 0 else "Active"
	if new_balance < 0:
		new_balance = 0

	# Atomic update under lock
	frappe.db.sql("""
		UPDATE `tabGift Card`
		SET current_balance = %s, status = %s
		WHERE name = %s
	""", (new_balance, new_status, card_code))

	# Add transaction record
	card = frappe.get_doc("Gift Card", card_code)
	card.append("gift_card_transactions", {
		"transaction_date": now_datetime(),
		"transaction_type": "Redemption",
		"amount": redeem_amount,
		"balance_after": new_balance,
		"order_reference": order_name,
		"redeemed_by": user,
	})
	card.save(ignore_permissions=True)

	return redeem_amount


def refund_to_gift_card(card_code, amount, order_name, user):
	"""Refund amount back to a gift card when order is cancelled.
	Uses SELECT ... FOR UPDATE to prevent concurrent modifications."""
	if not card_code or not frappe.db.exists("Gift Card", card_code):
		return 0

	# Lock the gift card row
	locked = frappe.db.sql("""
		SELECT current_balance, status
		FROM `tabGift Card`
		WHERE name = %s
		FOR UPDATE
	""", card_code, as_dict=True)

	if not locked:
		return 0

	new_balance = locked[0].current_balance + float(amount)
	new_status = "Active" if new_balance > 0 and locked[0].status == "Fully Redeemed" else locked[0].status

	frappe.db.sql("""
		UPDATE `tabGift Card`
		SET current_balance = %s, status = %s
		WHERE name = %s
	""", (new_balance, new_status, card_code))

	card = frappe.get_doc("Gift Card", card_code)
	card.append("gift_card_transactions", {
		"transaction_date": now_datetime(),
		"transaction_type": "Refund",
		"amount": amount,
		"balance_after": new_balance,
		"order_reference": order_name,
		"redeemed_by": user,
	})
	card.save(ignore_permissions=True)

	return float(amount)


def expire_gift_cards():
	"""Daily task: expire gift cards past their expiry date."""
	expired = frappe.get_all(
		"Gift Card",
		filters={
			"status": "Active",
			"expiry_date": ["<", today()],
		},
		pluck="name",
	)

	for card_code in expired:
		card = frappe.get_doc("Gift Card", card_code)
		remaining = card.current_balance
		card.status = "Expired"
		card.current_balance = 0

		if remaining > 0:
			card.append("gift_card_transactions", {
				"transaction_date": now_datetime(),
				"transaction_type": "Expiry",
				"amount": remaining,
				"balance_after": 0,
			})

		card.save(ignore_permissions=True)

	if expired:
		frappe.db.commit()


def _send_gift_card_email(card_doc):
	"""Send gift card email to recipient."""
	from velora_verse.utils import get_store_settings

	settings = get_store_settings()
	store_name = settings.store_name or "Velora Verse"
	sender_name = frappe.db.get_value("User", card_doc.purchased_by, "full_name") or "Someone"

	subject = f"You received a {store_name} gift card!"
	message = f"""
	<h3>You've received a gift card!</h3>
	<p><strong>{sender_name}</strong> sent you a gift card worth
	<strong>{settings.currency_symbol}{card_doc.original_amount}</strong>.</p>
	{f'<p>Message: "{card_doc.sender_message}"</p>' if card_doc.sender_message else ''}
	<p>Your gift card code: <strong>{card_doc.card_code}</strong></p>
	<p>Valid until: {card_doc.expiry_date}</p>
	<p>Use this code at checkout to redeem your gift card.</p>
	"""

	frappe.sendmail(
		recipients=[card_doc.recipient_email],
		subject=subject,
		message=message,
		now=True,
	)
