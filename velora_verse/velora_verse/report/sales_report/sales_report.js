frappe.query_reports["Sales Report"] = {
	filters: [
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
		},
		{
			fieldname: "payment_status",
			label: __("Payment Status"),
			fieldtype: "Select",
			options: "\nUnpaid\nPaid\nRefunded\nPartially Refunded",
		},
		{
			fieldname: "status",
			label: __("Order Status"),
			fieldtype: "Select",
			options: "\nPending\nConfirmed\nProcessing\nShipped\nDelivered\nCancelled\nReturned",
		},
	],
};
