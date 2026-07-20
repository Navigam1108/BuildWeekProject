import unittest

from logscope.query_engine import LogRecord, QueryEngine


class QueryEngineTests(unittest.TestCase):
    def setUp(self):
        self.engine = QueryEngine([LogRecord(i, f"event-{i}") for i in range(0, 1000, 10)])

    def test_inclusive_range(self):
        result = self.engine.query_logs_by_time_range(100, 200)
        self.assertEqual(result[0].timestamp, 100)
        self.assertEqual(result[-1].timestamp, 200)

    def test_empty_range(self):
        self.assertEqual(self.engine.query_logs_by_time_range(101, 109), [])

    def test_count(self):
        self.assertEqual(self.engine.count(), 100)


if __name__ == "__main__":
    unittest.main()
