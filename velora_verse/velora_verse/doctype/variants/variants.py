# Copyright (c) 2026, velora-verse and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

import frappe

class Variants(Document):
    def before_save(self):
        variant_parts = []
        base_name 	  = ""
        
        
        if self.variant_name:
         base_name =  frappe.get_doc("Items", self.variant_name).item_name

        
        
        for items in self.variant_values:
            if items.values: 
                variant_parts.append(items.values)
        
        if variant_parts:
            self.title = base_name +" ".join(variant_parts)
        
        print(self.variant_name, "Generated variant name")
	
