# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

"""
Setup custom roles for Velora Verse.
Run: bench --site veloraverse.com execute velora_verse.tools.setup_roles.setup
"""

import frappe


def setup():
	"""Create Customer and Store Admin roles if they don't exist."""
	roles = [
		{
			"role_name": "Customer",
			"desk_access": 0,
			"is_custom": 1,
		},
		{
			"role_name": "Store Admin",
			"desk_access": 1,
			"is_custom": 1,
		},
	]

	for role_data in roles:
		if not frappe.db.exists("Role", role_data["role_name"]):
			role = frappe.new_doc("Role")
			role.role_name = role_data["role_name"]
			role.desk_access = role_data["desk_access"]
			role.is_custom = role_data["is_custom"]
			role.save(ignore_permissions=True)
			print(f"Created role: {role_data['role_name']}")
		else:
			print(f"Role already exists: {role_data['role_name']}")

	frappe.db.commit()
	print("Role setup complete.")
