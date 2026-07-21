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


class HiddenInvariants(unittest.TestCase):
    def test_duplicate_ledger_rows_do_not_duplicate_payment(self):
        payment = Payment("same", 10)
        ledger = [LedgerEntry("same", 10), LedgerEntry("same", 10)]
        self.assertEqual(reconcile([payment], ledger), [payment])

    def test_duplicate_reference_order_is_first_seen(self):
        payments = [Payment("z", 1), Payment("a", 2), Payment("z", 3), Payment("a", 4)]
        self.assertEqual(duplicate_references(payments), ["z", "a"])

    def test_unknown_currency_is_ignored_and_valid_accounts_remain_ordered(self):
        payments = [Payment("a", 10, "USD", "one"), Payment("b", 20, "XXX", "two"), Payment("c", 30, "USD", "one")]
        self.assertEqual(enrich_currency(payments, [("USD", 1.0)]), [(payments[0], 10.0), (payments[2], 30.0)])
        self.assertEqual(validate_accounts(payments, ["one"]), [payments[0], payments[2]])

    def test_priorities_use_reference_for_equal_amounts(self):
        payments = [Payment("z", 100), Payment("a", 100), Payment("b", 200)]
        self.assertEqual(prioritize_exceptions(payments, 2), [payments[2], payments[1]])
