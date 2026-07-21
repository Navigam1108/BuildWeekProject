import unittest

from logscope.ingestion import suppress_duplicates
from logscope.query_engine import LogRecord, QueryEngine
from logscope.retention import expired_record_ids


class HiddenInvariants(unittest.TestCase):
    def test_duplicate_timestamp_tie_group_is_inclusive(self):
        records = [LogRecord(10, "a"), LogRecord(10, "b"), LogRecord(20, "c")]
        result = QueryEngine(records).query_logs_by_time_range(10, 10)
        self.assertEqual([item.message for item in result], ["a", "b"])

    def test_source_filter_preserves_ingestion_order(self):
        engine = QueryEngine([LogRecord(1, "a", "api"), LogRecord(2, "b", "worker"), LogRecord(3, "c", "api")])
        self.assertEqual([record.message for record in engine.query_by_source("api")], ["a", "c"])

    def test_top_sources_breaks_ties_by_source_name(self):
        engine = QueryEngine([LogRecord(1, "a", "worker"), LogRecord(2, "b", "api")])
        self.assertEqual(engine.top_sources(2), [("api", 1), ("worker", 1)])

    def test_dedupe_and_retention_keep_expected_records(self):
        records = [LogRecord(1, "a"), LogRecord(1, "a"), LogRecord(2, "a")]
        self.assertEqual(suppress_duplicates(records), [records[0], records[2]])
        self.assertEqual(expired_record_ids(records, 2), [0, 1])
