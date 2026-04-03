# Copyright (c) 2026, Syed Ahamed and Contributors
# See license.txt

# import frappe
from frappe.tests import IntegrationTestCase


# On IntegrationTestCase, the doctype test records and all
# link-field test record dependencies are recursively loaded
# Use these module variables to add/remove to/from that list
EXTRA_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]
IGNORE_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]



class IntegrationTestCRMEnquiry(IntegrationTestCase):
	"""
	Integration tests for CRMEnquiry.
	Use this class for testing interactions between multiple components.
	"""

	pass
