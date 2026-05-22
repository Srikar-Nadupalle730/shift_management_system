import frappe

def check_doctypes():
    doctypes = ["Shift Project", "Shift Activity", "Shift Timesheet"]
    for dt in doctypes:
        if frappe.db.exists("DocType", dt):
            print(f"{dt} exists.")
        else:
            print(f"{dt} does not exist.")

