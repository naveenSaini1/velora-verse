app_name = "velora_verse"
app_title = "velora-verse"
app_publisher = "velora-verse"
app_description = "velora-verse"
app_email = "veloraverse@gmail.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "velora_verse",
# 		"logo": "/assets/velora_verse/logo.png",
# 		"title": "velora-verse",
# 		"route": "/velora_verse",
# 		"has_permission": "velora_verse.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/velora_verse/css/velora_verse.css"
# app_include_js = "/assets/velora_verse/js/velora_verse.js"

# include js, css files in header of web template
# web_include_css = "/assets/velora_verse/css/velora_verse.css"
# web_include_js = "/assets/velora_verse/js/velora_verse.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "velora_verse/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "velora_verse/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "velora_verse.utils.jinja_methods",
# 	"filters": "velora_verse.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "velora_verse.install.before_install"
# after_install = "velora_verse.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "velora_verse.uninstall.before_uninstall"
# after_uninstall = "velora_verse.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "velora_verse.utils.before_app_install"
# after_app_install = "velora_verse.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "velora_verse.utils.before_app_uninstall"
# after_app_uninstall = "velora_verse.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "velora_verse.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

permission_query_conditions = {
	"Address": "velora_verse.services.permissions.address_permission_query",
	"Cart": "velora_verse.services.permissions.cart_permission_query",
	"Wishlist": "velora_verse.services.permissions.wishlist_permission_query",
	"Review": "velora_verse.services.permissions.review_permission_query",
	"Order": "velora_verse.services.permissions.order_permission_query",
	"Payment Log": "velora_verse.services.permissions.payment_log_permission_query",
	"Inventory Log": "velora_verse.services.permissions.inventory_log_permission_query",
	"Return Request": "velora_verse.services.permissions.return_request_permission_query",
	"Stock Notification": "velora_verse.services.permissions.stock_notification_permission_query",
	"Recent View": "velora_verse.services.permissions.recent_view_permission_query",
	"User Notification": "velora_verse.services.permissions.user_notification_permission_query",
	"Loyalty Points Ledger": "velora_verse.services.permissions.loyalty_points_ledger_permission_query",
	"Gift Card": "velora_verse.services.permissions.gift_card_permission_query",
}

has_permission = {
	"Address": "velora_verse.services.permissions.address_has_permission",
	"Cart": "velora_verse.services.permissions.cart_has_permission",
	"Wishlist": "velora_verse.services.permissions.wishlist_has_permission",
	"Review": "velora_verse.services.permissions.review_has_permission",
	"Order": "velora_verse.services.permissions.order_has_permission",
	"Payment Log": "velora_verse.services.permissions.payment_log_has_permission",
	"Inventory Log": "velora_verse.services.permissions.inventory_log_has_permission",
	"Return Request": "velora_verse.services.permissions.return_request_has_permission",
	"Stock Notification": "velora_verse.services.permissions.stock_notification_has_permission",
	"Recent View": "velora_verse.services.permissions.recent_view_has_permission",
	"User Notification": "velora_verse.services.permissions.user_notification_has_permission",
	"Loyalty Points Ledger": "velora_verse.services.permissions.loyalty_points_ledger_has_permission",
	"Gift Card": "velora_verse.services.permissions.gift_card_has_permission",
}

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"Variants": {
		"on_update": "velora_verse.services.doc_events.variant_on_update",
	},
	"Order": {
		"on_update_after_submit": "velora_verse.services.doc_events.order_on_update_after_submit",
	},
	"Category": {
		"on_update": "velora_verse.services.doc_events.clear_category_cache",
		"on_trash": "velora_verse.services.doc_events.clear_category_cache",
	},
	"Items": {
		"on_update": "velora_verse.services.doc_events.clear_product_filters_cache",
		"on_trash": "velora_verse.services.doc_events.clear_product_filters_cache",
	},
}

# Scheduled Tasks
# ---------------

scheduler_events = {
	"cron": {
		"*/5 * * * *": [
			"velora_verse.services.tasks.activate_deactivate_promotions",
		],
	},
	"hourly": [
		"velora_verse.services.tasks.cancel_unpaid_orders",
	],
	"daily": [
		"velora_verse.services.tasks.check_low_stock",
		"velora_verse.services.tasks.check_back_in_stock",
		"velora_verse.services.tasks.cleanup_old_views",
		"velora_verse.services.tasks.send_abandoned_cart_emails",
		"velora_verse.services.tasks.expire_loyalty_points",
		"velora_verse.services.tasks.expire_gift_cards",
		"velora_verse.services.tasks.reassign_customer_segments",
		"velora_verse.services.tasks.cleanup_notifications",
		"velora_verse.services.tasks.cleanup_analytics",
	],
}

# Testing
# -------

# before_tests = "velora_verse.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "velora_verse.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "velora_verse.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["velora_verse.utils.before_request"]
# after_request = ["velora_verse.utils.after_request"]

# Job Events
# ----------
# before_job = ["velora_verse.utils.before_job"]
# after_job = ["velora_verse.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"velora_verse.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []

