# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""
Permission query conditions and has_permission overrides.
These enforce data isolation — customers see only their own records.
"""

import frappe


# --- Permission Query Conditions ---
# These return SQL WHERE clauses that filter list views.

def address_permission_query(user):
	if user == "Administrator":
		return ""
	return f"`tabAddress`.user = {frappe.db.escape(user)}"


def cart_permission_query(user):
	if user == "Administrator":
		return ""
	return f"`tabCart`.user = {frappe.db.escape(user)}"


def wishlist_permission_query(user):
	if user == "Administrator":
		return ""
	return f"`tabWishlist`.user = {frappe.db.escape(user)}"


def review_permission_query(user):
	"""Reviews are readable by all, but write-restricted to own."""
	# No restriction on reading reviews
	return ""


def order_permission_query(user):
	if user == "Administrator":
		return ""
	if "Store Admin" in frappe.get_roles(user):
		return ""
	return f"`tabOrder`.user = {frappe.db.escape(user)}"


def payment_log_permission_query(user):
	if user == "Administrator":
		return ""
	if "Store Admin" in frappe.get_roles(user):
		return ""
	return f"`tabPayment Log`.user = {frappe.db.escape(user)}"


def inventory_log_permission_query(user):
	"""Only admin and store admin can view inventory logs."""
	if user == "Administrator":
		return ""
	if "Store Admin" in frappe.get_roles(user):
		return ""
	return "1=0"  # Block all other users


# --- Has Permission ---
# These return True/False for individual document access.

def address_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	return doc.user == user


def cart_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	return doc.user == user


def wishlist_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	return doc.user == user


def review_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	if ptype == "read":
		return True  # Reviews are publicly readable
	return doc.user == user


def order_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	if "Store Admin" in frappe.get_roles(user):
		return True
	return doc.user == user


def payment_log_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	if "Store Admin" in frappe.get_roles(user):
		return True
	return doc.user == user


def inventory_log_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	if "Store Admin" in frappe.get_roles(user):
		return True
	return False


# --- Return Request ---

def return_request_permission_query(user):
	if user == "Administrator":
		return ""
	if "Store Admin" in frappe.get_roles(user):
		return ""
	return f"`tabReturn Request`.user = {frappe.db.escape(user)}"


def return_request_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	if "Store Admin" in frappe.get_roles(user):
		return True
	return doc.user == user


# --- Stock Notification ---

def stock_notification_permission_query(user):
	if user == "Administrator":
		return ""
	return f"`tabStock Notification`.user = {frappe.db.escape(user)}"


def stock_notification_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	return doc.user == user


# --- Recent View ---

def recent_view_permission_query(user):
	if user == "Administrator":
		return ""
	if "Store Admin" in frappe.get_roles(user):
		return ""
	return f"`tabRecent View`.user = {frappe.db.escape(user)}"


def recent_view_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	if "Store Admin" in frappe.get_roles(user):
		return True
	return doc.user == user


# --- User Notification ---

def user_notification_permission_query(user):
	if user == "Administrator":
		return ""
	if "Store Admin" in frappe.get_roles(user):
		return ""
	return f"`tabUser Notification`.user = {frappe.db.escape(user)}"


def user_notification_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	if "Store Admin" in frappe.get_roles(user):
		return True
	return doc.user == user


# --- Loyalty Points Ledger ---

def loyalty_points_ledger_permission_query(user):
	if user == "Administrator":
		return ""
	if "Store Admin" in frappe.get_roles(user):
		return ""
	return f"`tabLoyalty Points Ledger`.user = {frappe.db.escape(user)}"


def loyalty_points_ledger_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	if "Store Admin" in frappe.get_roles(user):
		return True
	return doc.user == user


# --- Gift Card ---

def gift_card_permission_query(user):
	if user == "Administrator":
		return ""
	if "Store Admin" in frappe.get_roles(user):
		return ""
	return f"`tabGift Card`.purchased_by = {frappe.db.escape(user)}"


def gift_card_has_permission(doc, ptype, user):
	if user == "Administrator":
		return True
	if "Store Admin" in frappe.get_roles(user):
		return True
	return doc.purchased_by == user
