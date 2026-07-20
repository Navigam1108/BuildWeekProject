import unittest

from payfix.reconcile import LedgerEntry, Payment, reconcile


class HiddenInvariants(unittest.TestCase):
    def test_duplicate_ledger_rows_do_not_duplicate_payment(self):
        payment = Payment("same", 10)
        ledger = [LedgerEntry("same", 10), LedgerEntry("same", 10)]
        self.assertEqual(reconcile([payment], ledger), [payment])


if __name__ == "__main__":
    unittest.main()
