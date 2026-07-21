from bisect import bisect_left


def keep_recent(records, cutoff):
    timestamps = [record.timestamp for record in records]
    return records[bisect_left(timestamps, cutoff):]


def expired_record_ids(records, cutoff):
    timestamps = [record.timestamp for record in records]
    return list(range(bisect_left(timestamps, cutoff)))
