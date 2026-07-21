import unittest

from payfix.reconcile import (
    LedgerEntry,
    Payment,
    duplicate_references,
    enrich_currency,
    prioritize_exceptions,
    reconcile,
    validate_accounts,
)


class ReconcileTests(unittest.TestCase):
    def test_matches_reference_and_amount(self):
        payments = [Payment("a", 100), Payment("b", 200)]
        ledger = [LedgerEntry("b", 200), LedgerEntry("a", 999)]
        self.assertEqual(reconcile(payments, ledger), [payments[1]])

    def test_empty_inputs(self):
        self.assertEqual(reconcile([], []), [])

    def test_preserves_payment_order(self):
        payments = [Payment("z", 1), Payment("a", 2)]
        ledger = [LedgerEntry("a", 2), LedgerEntry("z", 1)]
        self.assertEqual([item.reference for item in reconcile(payments, ledger)], ["z", "a"])

    def test_duplicate_references_and_currency_enrichment(self):
        payments = [Payment("a", 100, "USD"), Payment("a", 200, "EUR"), Payment("b", 300, "JPY")]
        self.assertEqual(duplicate_references(payments), ["a"])
        self.assertEqual(enrich_currency(payments, [("EUR", 1.1), ("USD", 1.0)]), [(payments[0], 100.0), (payments[1], 220.00000000000003)])

    def test_account_validation_and_exception_order(self):
        payments = [Payment("b", 100, account="valid"), Payment("a", 100, account="blocked"), Payment("c", 300, account="valid")]
        self.assertEqual(validate_accounts(payments, ["valid"]), [payments[0], payments[2]])
        self.assertEqual(prioritize_exceptions(payments, 2), [payments[2], payments[1]])
