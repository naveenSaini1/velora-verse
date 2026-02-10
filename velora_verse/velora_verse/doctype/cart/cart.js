// Copyright (c) 2026, velora-verse and contributors
// For license information, please see license.txt

frappe.ui.form.on("Cart", {
    refresh(frm) {
        if (frm.is_new() && !frm.doc.user) {
            frm.set_value("user", frappe.session.user);
        }
    },
});
