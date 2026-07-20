def keep_recent(records, cutoff):
    return [record for record in records if record.timestamp >= cutoff]
