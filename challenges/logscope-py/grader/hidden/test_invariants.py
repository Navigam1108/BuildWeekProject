import unittest

from logscope.query_engine import LogRecord, QueryEngine


class HiddenInvariants(unittest.TestCase):
    def test_duplicate_timestamp_tie_group_is_inclusive(self):
        records = [LogRecord(10, "a"), LogRecord(10, "b"), LogRecord(20, "c")]
        result = QueryEngine(records).query_logs_by_time_range(10, 10)
        self.assertEqual([item.message for item in result], ["a", "b"])


if __name__ == "__main__":
    unittest.main()
