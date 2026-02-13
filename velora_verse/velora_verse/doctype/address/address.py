# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Address(Document):
	def validate(self):
		self.validate_phone()
		self.validate_pincode()

		if not self.user:
			self.user = frappe.session.user

		if self.is_default:
			self.clear_other_defaults()

	def validate_phone(self):
		phone = (self.phone or "").strip()
		if phone and not phone.replace("+", "").replace("-", "").replace(" ", "").isdigit():
			frappe.throw("Phone number must contain only digits, spaces, hyphens, or '+'.")

	def validate_pincode(self):
		pincode = (self.pincode or "").strip()
		if pincode and not pincode.replace(" ", "").replace("-", "").isalnum():
			frappe.throw("Pincode must be alphanumeric.")

	def clear_other_defaults(self):
		"""Ensure only one default address per user per address type."""
		frappe.db.sql("""
			UPDATE `tabAddress`
			SET is_default = 0
			WHERE user = %s AND address_type = %s AND name != %s AND is_default = 1
		""", (self.user, self.address_type, self.name))


@frappe.whitelist()
def get_addresses():
	"""Get all addresses for the current user."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to view addresses.")

	addresses = frappe.get_all(
		"Address",
		filters={"user": user},
		fields=[
			"name", "full_name", "phone", "address_line_1", "address_line_2",
			"city", "state", "pincode", "country", "address_type", "is_default",
		],
		order_by="is_default desc, modified desc",
	)

	return {"addresses": addresses}


@frappe.whitelist()
def add_address(full_name, phone, address_line_1, city, state, pincode, address_type="Shipping", address_line_2=None, country="India", is_default=0):
	"""Add a new address for the current user."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to add an address.")

	address = frappe.new_doc("Address")
	address.user = user
	address.full_name = full_name
	address.phone = phone
	address.address_line_1 = address_line_1
	address.address_line_2 = address_line_2
	address.city = city
	address.state = state
	address.pincode = pincode
	address.country = country
	address.address_type = address_type
	address.is_default = int(is_default)
	address.save(ignore_permissions=True)

	return {"message": "Address added", "address": address.name}


@frappe.whitelist()
def update_address(address_name, **kwargs):
	"""Update an existing address."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to update an address.")

	if not frappe.db.exists("Address", address_name):
		frappe.throw("Address not found.")

	address = frappe.get_doc("Address", address_name)
	if address.user != user and user != "Administrator":
		frappe.throw("You can only update your own addresses.", frappe.PermissionError)

	allowed_fields = [
		"full_name", "phone", "address_line_1", "address_line_2",
		"city", "state", "pincode", "country", "address_type", "is_default",
	]
	for field in allowed_fields:
		if field in kwargs:
			address.set(field, kwargs[field])

	address.save(ignore_permissions=True)

	return {"message": "Address updated", "address": address.name}


@frappe.whitelist()
def delete_address(address_name):
	"""Delete an address."""
	user = frappe.session.user
	if user == "Guest":
		frappe.throw("Please log in to delete an address.")

	if not frappe.db.exists("Address", address_name):
		frappe.throw("Address not found.")

	address = frappe.get_doc("Address", address_name)
	if address.user != user and user != "Administrator":
		frappe.throw("You can only delete your own addresses.", frappe.PermissionError)

	frappe.delete_doc("Address", address_name, ignore_permissions=True)

	return {"message": "Address deleted"}
