import unittest

from logscope.ingestion import suppress_duplicates
from logscope.query_engine import LogRecord, QueryEngine
from logscope.retention import expired_record_ids


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

    def test_source_filter_and_top_sources(self):
        engine = QueryEngine([
            LogRecord(1, "a", "worker"), LogRecord(2, "b", "api"), LogRecord(3, "c", "worker"),
        ])
        self.assertEqual([record.message for record in engine.query_by_source("worker")], ["a", "c"])
        self.assertEqual(engine.top_sources(1), [("worker", 2)])

    def test_retention_and_duplicate_suppression(self):
        records = [LogRecord(1, "old"), LogRecord(2, "new"), LogRecord(2, "new")]
        self.assertEqual(expired_record_ids(records, 2), [0])
        self.assertEqual(suppress_duplicates(records), records[:2])


if __name__ == "__main__":
    unittest.main()
