import unittest

from payfix.reconcile import LedgerEntry, Payment, reconcile


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
